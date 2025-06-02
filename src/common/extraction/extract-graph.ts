import ts, { CompilerHost, TypeAcquisition, CompilerOptions } from 'typescript';
import fs from 'fs';
import path from 'path';
import { Edge } from './graph';
import { TechnicalError } from '../error/errors';
import { normalizeWindowsPaths } from '../util/path-utils';
import { ImportPathsResolver } from '@zerollup/ts-helpers';
import { determineImportKinds } from '../util/import-kinds-helper';
import { Logger } from '../util';

// Constant to control whether node_modules files should be excluded from the graph
// TODO: introduce a .archignore file instead a la .gitignore
const EXCLUDE_NODE_MODULES = true;
const EXCLUDE_DIST = true;

// Logger instance for debugging graph extraction
let logger: Logger | undefined;

/**
 * Configure logging for graph extraction debugging.
 * Pass a custom logger to enable debug output during the extraction process.
 *
 * @param customLogger - Logger instance to use, or undefined to disable logging
 *
 * @example
 * ```typescript
 * import { setGraphExtractionLogger } from './extract-graph';
 * import { DefaultLogger } from '../util/logger';
 *
 * // Enable debug logging
 * const debugLogger = new DefaultLogger();
 * debuglogger?.setLevel('debug');
 * setGraphExtractionLogger(debugLogger);
 *
 * // Disable logging
 * setGraphExtractionLogger(undefined);
 * ```
 */
export const setGraphExtractionLogger = (customLogger?: Logger): void => {
	if (customLogger) {
		logger = customLogger;
	} else {
		// Create a no-op logger to disable logging
		logger = {
			debug: () => {},
			info: () => {},
			warn: () => {},
			error: () => {},
		};
	}
};

export const guessLocationOfTsconfig = (): string | undefined => {
	logger?.debug('Starting tsconfig.json discovery from current directory');
	const result = guessLocationOfTsconfigRecursively('.');
	if (result) {
		logger?.debug(`Found tsconfig.json at: ${result}`);
	} else {
		logger?.warn('No tsconfig.json found in current directory tree');
	}
	return result;
};

const guessLocationOfTsconfigRecursively = (pathName: string): string | undefined => {
	logger?.debug(`Searching for tsconfig.json in directory: ${path.resolve(pathName)}`);

	const dir = fs.readdirSync(pathName);
	logger?.debug(`Directory contents: ${dir.join(', ')}`);

	// First check if tsconfig exists in the current directory
	const tsconfigFileName = dir.find(
		(fileName) => path.basename(fileName) === 'tsconfig.json'
	);
	if (tsconfigFileName) {
		const resolvedPath = path.resolve(pathName, 'tsconfig.json');
		logger?.debug(`Found tsconfig.json at: ${resolvedPath}`);
		return resolvedPath;
	}

	// If not, go up one level
	const levelUp = path.resolve(pathName, '..');
	logger?.debug(`tsconfig.json not found, moving up to: ${levelUp}`);

	// Stop if we've reached the filesystem root
	if (path.relative(levelUp, pathName) === '') {
		logger?.debug('Reached filesystem root, stopping search');
		return undefined;
	}

	// Continue recursively
	return guessLocationOfTsconfigRecursively(levelUp);
};

const getProjectFiles = (
	rootDir: string,
	compilerHost: CompilerHost,
	config: CompilerOptions & TypeAcquisition
): string[] => {
	logger?.debug(`Getting project files from root directory: ${rootDir}`);
	logger?.debug(`Include patterns: ${JSON.stringify(config.include)}`);
	logger?.debug(`Exclude patterns: ${JSON.stringify(config.exclude)}`);

	if (!compilerHost.readDirectory) {
		const error = 'compiler host is missing readDirectory method';
		logger?.error(error);
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
		logger?.error(error);
		throw new TechnicalError(error);
	}

	logger?.info(`Found ${files.length} TypeScript files in project`);
	logger?.debug(
		`Project files: ${files.slice(0, 10).join(', ')}${files.length > 10 ? `... and ${files.length - 10} more` : ''}`
	);

	return files;
};

const graphCache: Map<string | undefined, Promise<Edge[]>> = new Map();

export const clearGraphCache = (): void => {
	const cacheSize = graphCache.size;
	graphCache.clear();
	logger?.debug(`Cleared graph cache (previously contained ${cacheSize} entries)`);
};

export const extractGraph = async (
	configFileName?: string,
	clearCache: boolean = false,
	loggerInput?: Logger
): Promise<Edge[]> => {
	if (loggerInput) {
		setGraphExtractionLogger(loggerInput);
	}

	logger?.debug(
		`Starting graph extraction with config: ${configFileName || 'auto-detected'}`
	);

	if (clearCache) {
		logger?.debug('Clearing graph cache');
		clearGraphCache();
	}

	const cachedResult = graphCache.get(configFileName);
	if (cachedResult) {
		logger?.debug('Using cached graph extraction result');
		return cachedResult;
	}

	logger?.debug('No cached result found, computing new graph');
	const computedResult = extractGraphUncached(configFileName);
	graphCache.set(configFileName, computedResult);
	const result = await computedResult;
	logger?.info(`Graph extraction completed with ${result.length} edges`);
	return result;
};

export const extractGraphUncached = async (configFileName?: string): Promise<Edge[]> => {
	logger?.debug('Starting uncached graph extraction');

	const configFile = configFileName ?? guessLocationOfTsconfig();
	if (!configFile) {
		const error = 'Could not find configuration path';
		logger?.error(error);
		throw new TechnicalError(error);
	}

	logger?.info(`Using TypeScript config file: ${configFile}`);

	const config = ts.readConfigFile(configFile, (path: string) => {
		logger?.debug(`Reading config file: ${path}`);
		return fs.readFileSync(path).toString();
	});

	if (config.error) {
		logger?.error(`Invalid config file: ${config.error.messageText}`);
		throw new TechnicalError('invalid config path');
	}

	logger?.debug('Successfully parsed TypeScript configuration');

	const parsedConfig: CompilerOptions = config.config;
	logger?.debug(
		`Compiler options: ${JSON.stringify(parsedConfig, null, 2).slice(0, 500)}...`
	);

	const rootDir = path.dirname(path.resolve(configFile));
	logger?.info(`Project root directory: ${rootDir}`);

	const compilerHost = ts.createCompilerHost(parsedConfig);
	logger?.debug('Created TypeScript compiler host');

	const files = getProjectFiles(rootDir, compilerHost, config?.config);

	logger?.debug('Creating TypeScript program');
	const program = ts.createProgram({
		rootNames: files ?? [],
		options: parsedConfig,
		host: compilerHost,
	});

	const sourceFiles = program.getSourceFiles();
	logger?.info(`TypeScript program created with ${sourceFiles.length} source files`);

	// Filter out files from node_modules for logging purposes
	const projectFiles = sourceFiles.filter(
		(sf) => !sf.fileName.includes('node_modules')
	);
	const nodeModulesFiles = sourceFiles.filter((sf) =>
		sf.fileName.includes('node_modules')
	);

	logger?.debug(`Project source files: ${projectFiles.length}`);
	logger?.debug(`Node modules files: ${nodeModulesFiles.length}`);

	if (projectFiles.length === 0) {
		logger?.warn(
			'No project source files found - this might indicate a configuration issue'
		);
	}

	const imports: Edge[] = [];
	let processedFiles = 0;
	let skippedImports = 0;
	let erroredImports = 0;

	logger?.debug('Starting import analysis');

	for (const sourceFile of program.getSourceFiles()) {
		const isProjectFile = !sourceFile.fileName.includes('node_modules');

		if (isProjectFile) {
			processedFiles++;
			logger?.debug(
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
						`Skipping import with undefined module specifier in ${normalizedSourceFileName}`
					);
					skippedImports++;
					return;
				}

				logger?.debug(
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
						`Could not resolve module "${module}" from ${normalizedSourceFileName}`
					);
					skippedImports++;
					return;
				}

				const { resolvedFileName, isExternalLibraryImport } = resolvedModule;
				const normalizedTargetFileName = path.relative(rootDir, resolvedFileName);

				logger?.debug(
					`Resolved "${module}" to: ${normalizedTargetFileName} (external: ${isExternalLibraryImport})`
				);

				// Skip node_modules files if configured so
				//console.log('resolvedFileName:', resolvedFileName);
				//console.log('normalizedTargetFileName:', normalizedTargetFileName);
				if (
					EXCLUDE_NODE_MODULES &&
					normalizedTargetFileName.startsWith('node_modules')
				) {
					logger?.debug(
						`Excluding node_modules file: ${normalizedTargetFileName}`
					);
					skippedImports++;
					return;
				}
				// Skip dist files if configured so
				if (EXCLUDE_DIST && normalizedTargetFileName.startsWith('dist')) {
					logger?.debug(`Excluding dist file: ${normalizedTargetFileName}`);
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
					logger?.debug(`Processed ${imports.length} imports so far...`);
				}
			} catch (importError) {
				// Skip this import if there's an error processing it
				erroredImports++;
				logger?.warn(
					`Error processing import in ${path.relative(rootDir, sourceFile.fileName)}: ${importError}`
				);
			}
		});
	}

	// Add self-referencing edges for all project files to ensure they appear in the graph
	// This is crucial for files that don't import other project files
	logger?.debug('Adding self-referencing edges for all project files');

	for (const sourceFile of projectFiles) {
		const normalizedFileName = normalizeWindowsPaths(
			path.relative(rootDir, sourceFile.fileName)
		);

		// Skip node_modules files if configured so
		//console.log('resolvedFileName:', resolvedFileName);
		//console.log('normalizedTargetFileName:', normalizedTargetFileName);
		if (EXCLUDE_NODE_MODULES && normalizedFileName.startsWith('node_modules')) {
			logger?.debug(`Excluding node_modules file: ${normalizedFileName}`);
			skippedImports++;
			continue;
		}
		// Skip dist files if configured so
		if (EXCLUDE_DIST && normalizedFileName.startsWith('dist')) {
			logger?.debug(`Excluding dist file: ${normalizedFileName}`);
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
			'No project files found - this might indicate a configuration or file discovery issue'
		);
	}

	logger?.info(`Import analysis completed:`);
	logger?.info(`  - Total edges found: ${imports.length}`);
	logger?.info(`  - Files processed: ${processedFiles}`);
	logger?.info(`  - Imports skipped: ${skippedImports}`);
	logger?.info(`  - Import errors: ${erroredImports}`);

	return imports;
};
