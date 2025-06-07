import ts, { CompilerHost, TypeAcquisition, CompilerOptions } from 'typescript';
import fs from 'fs';
import path from 'path';
import { Edge } from './graph';
import { TechnicalError } from '../error/errors';
import { normalizeWindowsPaths } from '../util/path-utils';
import { ImportPathsResolver } from '@zerollup/ts-helpers';
import { determineImportKinds } from '../util/import-kinds-helper';
import { CheckOptions, sharedLogger } from '..';

// Constant to control whether node_modules files should be excluded from the graph
// TODO: introduce a .archignore file instead a la .gitignore
const EXCLUDE_NODE_MODULES = true;
const EXCLUDE_DIST = true;

// Logger instance for debugging graph extraction
const logger = sharedLogger;

export const guessLocationOfTsconfig = (options?: CheckOptions): string | undefined => {
	logger?.debug(
		options?.logging,
		'Starting tsconfig.json discovery from current directory'
	);
	const result = guessLocationOfTsconfigRecursively('.');
	if (result) {
		logger?.debug(options?.logging, `Found tsconfig.json at: ${result}`);
	} else {
		logger?.warn(
			options?.logging,
			'No tsconfig.json found in current directory tree'
		);
	}
	return result;
};

const guessLocationOfTsconfigRecursively = (
	pathName: string,
	options?: CheckOptions
): string | undefined => {
	logger?.debug(
		options?.logging,
		`Searching for tsconfig.json in directory: ${path.resolve(pathName)}`
	);

	const dir = fs.readdirSync(pathName);
	logger?.debug(options?.logging, `Directory contents: ${dir.join(', ')}`);

	// First check if tsconfig exists in the current directory
	const tsconfigFileName = dir.find(
		(fileName) => path.basename(fileName) === 'tsconfig.json'
	);
	if (tsconfigFileName) {
		const resolvedPath = path.resolve(pathName, 'tsconfig.json');
		logger?.debug(options?.logging, `Found tsconfig.json at: ${resolvedPath}`);
		return resolvedPath;
	}

	// If not, go up one level
	const levelUp = path.resolve(pathName, '..');
	logger?.debug(options?.logging, `tsconfig.json not found, moving up to: ${levelUp}`);

	// Stop if we've reached the filesystem root
	if (path.relative(levelUp, pathName) === '') {
		logger?.debug(options?.logging, 'Reached filesystem root, stopping search');
		return undefined;
	}

	// Continue recursively
	return guessLocationOfTsconfigRecursively(levelUp);
};

const getProjectFiles = (
	rootDir: string,
	compilerHost: CompilerHost,
	config: CompilerOptions & TypeAcquisition,
	options?: CheckOptions
): string[] => {
	logger?.debug(
		options?.logging,
		`Getting project files from root directory: ${rootDir}`
	);
	logger?.debug(
		options?.logging,
		`Include patterns: ${JSON.stringify(config.include)}`
	);
	logger?.debug(
		options?.logging,
		`Exclude patterns: ${JSON.stringify(config.exclude)}`
	);

	if (!compilerHost.readDirectory) {
		const error = 'compiler host is missing readDirectory method';
		logger?.error(options?.logging, error);
		throw new TechnicalError(error);
	}

	const files = compilerHost.readDirectory(
		rootDir,
		['ts', 'tsx'], // IS JS EXCLUDED?
		config.exclude ?? [],
		config.include ?? []
	);

	if (!files) {
		const error = 'compiler could not resolve project files';
		logger?.error(options?.logging, error);
		throw new TechnicalError(error);
	}

	logger?.info(options?.logging, `Found ${files.length} TypeScript files in project`);
	logger?.debug(
		options?.logging,
		`Project files: ${files.slice(0, 10).join(', ')}${files.length > 10 ? `... and ${files.length - 10} more` : ''}`
	);

	return files;
};

const graphCache: Map<string | undefined, Promise<Edge[]>> = new Map();

export const clearGraphCache = (options?: CheckOptions): void => {
	const cacheSize = graphCache.size;
	graphCache.clear();
	logger?.debug(
		options?.logging,
		`Cleared graph cache (previously contained ${cacheSize} entries)`
	);
};

export const extractGraph = async (
	configFileName?: string,
	options?: CheckOptions
): Promise<Edge[]> => {
	logger?.debug(
		options?.logging,
		`Starting graph extraction with config: ${configFileName || 'auto-detected'}`
	);

	if (options?.clearCache) {
		logger?.debug(options?.logging, 'Clearing graph cache');
		clearGraphCache();
	}

	const cachedResult = graphCache.get(configFileName);
	if (cachedResult) {
		logger?.debug(options?.logging, 'Using cached graph extraction result');
		return cachedResult;
	}

	logger?.debug(options?.logging, 'No cached result found, computing new graph');
	const computedResult = extractGraphUncached(configFileName, options);
	graphCache.set(configFileName, computedResult);
	const result = await computedResult;
	logger?.info(
		options?.logging,
		`Graph extraction completed with ${result.length} edges`
	);
	return result;
};

const extractGraphUncached = async (
	configFileName?: string,
	options?: CheckOptions
): Promise<Edge[]> => {
	logger?.debug(options?.logging, 'Starting uncached graph extraction');

	const configFile = configFileName ?? guessLocationOfTsconfig();
	if (!configFile) {
		const error = 'Could not find configuration path';
		logger?.error(options?.logging, error);
		throw new TechnicalError(error);
	}

	logger?.info(options?.logging, `Using TypeScript config file: ${configFile}`);

	const config = ts.readConfigFile(configFile, (path: string) => {
		logger?.debug(options?.logging, `Reading config file: ${path}`);
		return fs.readFileSync(path).toString();
	});

	if (config.error) {
		logger?.error(
			options?.logging,
			`Invalid config file: ${config.error.messageText}`
		);
		throw new TechnicalError('invalid config path');
	}

	logger?.debug(options?.logging, 'Successfully parsed TypeScript configuration');

	const parsedConfig: CompilerOptions = config.config;
	logger?.debug(
		options?.logging,
		`Compiler options: ${JSON.stringify(parsedConfig, null, 2).slice(0, 500)}...`
	);

	const rootDir = path.dirname(path.resolve(configFile));
	logger?.info(options?.logging, `Project root directory: ${rootDir}`);

	const compilerHost = ts.createCompilerHost(parsedConfig);
	logger?.debug(options?.logging, 'Created TypeScript compiler host');

	const files = getProjectFiles(rootDir, compilerHost, config?.config);

	logger?.debug(options?.logging, 'Creating TypeScript program');
	const program = ts.createProgram({
		rootNames: files ?? [],
		options: parsedConfig,
		host: compilerHost,
	});

	const sourceFiles = program.getSourceFiles();
	logger?.info(
		options?.logging,
		`TypeScript program created with ${sourceFiles.length} source files`
	);

	// Filter out files from node_modules for logging purposes
	const projectFiles = sourceFiles.filter(
		(sf) => !sf.fileName.includes('node_modules')
	);
	const nodeModulesFiles = sourceFiles.filter((sf) =>
		sf.fileName.includes('node_modules')
	);

	logger?.debug(options?.logging, `Project source files: ${projectFiles.length}`);
	logger?.debug(options?.logging, `Node modules files: ${nodeModulesFiles.length}`);

	if (projectFiles.length === 0) {
		logger?.warn(
			options?.logging,
			'No project source files found - this might indicate a configuration issue'
		);
	}

	const imports: Edge[] = [];
	let processedFiles = 0;
	let skippedImports = 0;
	let erroredImports = 0;

	logger?.debug(options?.logging, 'Starting import analysis');

	for (const sourceFile of program.getSourceFiles()) {
		const isProjectFile = !sourceFile.fileName.includes('node_modules');

		if (isProjectFile) {
			processedFiles++;
			logger?.debug(
				options?.logging,
				`Processing file ${processedFiles}/${projectFiles.length}: ${path.relative(rootDir, sourceFile.fileName)}`
			);
		}

		ts.forEachChild(sourceFile, (x) => {
			if (!ts.isImportDeclaration(x)) {
				return;
			}

			try {
				const normalizedSourceFileName = path.relative(
					rootDir,
					sourceFile.fileName
				);

				const specifier = x.moduleSpecifier;
				const module = (specifier as { text?: string })['text'];
				if (module === undefined) {
					logger?.debug(
						options?.logging,
						`Skipping import with undefined module specifier in ${normalizedSourceFileName}`
					);
					skippedImports++;
					return;
				}

				logger?.debug(
					options?.logging,
					`Processing import: "${module}" in ${normalizedSourceFileName}`
				);

				const resolver = new ImportPathsResolver(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(parsedConfig as any).compilerOptions
				);

				const suggestion = resolver.getImportSuggestions(
					module,
					path.dirname(normalizedSourceFileName)
				);

				const bestGuess = suggestion !== undefined ? suggestion[0] : undefined;
				if (bestGuess && bestGuess !== module) {
					logger?.debug(
						options?.logging,
						`Import path resolved from "${module}" to "${bestGuess}"`
					);
				}

				// TODO Might use some module resolution cache in future
				const resolvedModule = ts.resolveModuleName(
					bestGuess ?? module,
					sourceFile.fileName,
					parsedConfig,
					compilerHost
				).resolvedModule;

				if (resolvedModule === undefined) {
					logger?.debug(
						options?.logging,
						`Could not resolve module "${module}" from ${normalizedSourceFileName}`
					);
					skippedImports++;
					return;
				}

				const { resolvedFileName, isExternalLibraryImport } = resolvedModule;
				const normalizedTargetFileName = path.relative(rootDir, resolvedFileName);

				logger?.debug(
					options?.logging,
					`Resolved "${module}" to: ${normalizedTargetFileName} (external: ${isExternalLibraryImport})`
				);

				// Skip node_modules files if configured so
				if (
					EXCLUDE_NODE_MODULES &&
					normalizedTargetFileName.startsWith('node_modules')
				) {
					logger?.debug(
						options?.logging,
						`Excluding node_modules file: ${normalizedTargetFileName}`
					);
					skippedImports++;
					return;
				}
				// Skip dist files if configured so
				if (EXCLUDE_DIST && normalizedTargetFileName.startsWith('dist')) {
					logger?.debug(
						options?.logging,
						`Excluding dist file: ${normalizedTargetFileName}`
					);
					skippedImports++;
					return;
				}

				const importKinds = determineImportKinds(x);

				const edge: Edge = {
					source: normalizeWindowsPaths(normalizedSourceFileName),
					target: normalizeWindowsPaths(normalizedTargetFileName),
					external: isExternalLibraryImport ?? false,
					importKinds: importKinds,
				};

				imports.push(edge);

				if (imports.length % 100 === 0) {
					logger?.debug(
						options?.logging,
						`Processed ${imports.length} imports so far...`
					);
				}
			} catch (importError) {
				// Skip this import if there's an error processing it
				erroredImports++;
				logger?.warn(
					options?.logging,
					`Error processing import in ${path.relative(rootDir, sourceFile.fileName)}: ${importError}`
				);
			}
		});
	}

	// Add self-referencing edges for all project files to ensure they appear in the graph
	// This is crucial for files that don't import other project files
	logger?.debug(
		options?.logging,
		'Adding self-referencing edges for all project files'
	);

	for (const sourceFile of projectFiles) {
		const normalizedFileName = normalizeWindowsPaths(
			path.relative(rootDir, sourceFile.fileName)
		);

		// Skip node_modules files if configured so
		//console.log('resolvedFileName:', resolvedFileName);
		//console.log('normalizedTargetFileName:', normalizedTargetFileName);
		if (EXCLUDE_NODE_MODULES && normalizedFileName.startsWith('node_modules')) {
			logger?.debug(
				options?.logging,
				`Excluding node_modules file: ${normalizedFileName}`
			);
			skippedImports++;
			continue;
		}
		// Skip dist files if configured so
		if (EXCLUDE_DIST && normalizedFileName.startsWith('dist')) {
			logger?.debug(options?.logging, `Excluding dist file: ${normalizedFileName}`);
			skippedImports++;
			continue;
		}

		// Add self-referencing edge for every project file
		const selfEdge: Edge = {
			source: normalizedFileName,
			target: normalizedFileName,
			external: false,
			importKinds: [], // Self-reference has no import kinds
		};

		imports.push(selfEdge);
	}

	if (projectFiles.length === 0) {
		logger?.warn(
			options?.logging,
			'No project files found - this might indicate a configuration or file discovery issue'
		);
	}

	logger?.info(options?.logging, `Import analysis completed:`);
	logger?.info(options?.logging, `  - Total edges found: ${imports.length}`);
	logger?.info(options?.logging, `  - Files processed: ${processedFiles}`);
	logger?.info(options?.logging, `  - Imports skipped: ${skippedImports}`);
	logger?.info(options?.logging, `  - Import errors: ${erroredImports}`);

	return imports;
};
