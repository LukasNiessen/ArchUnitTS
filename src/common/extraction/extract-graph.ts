import ts, { CompilerHost, TypeAcquisition, CompilerOptions } from 'typescript';
import fs from 'fs';
import path from 'path';
import { Edge } from './graph';
import { TechnicalError } from '../error/errors';
import { normalizeWindowsPaths } from '../util/path-utils';
import { ImportPathsResolver } from '@zerollup/ts-helpers';
import { determineImportKinds } from '../util/import-kinds-helper';

export const guessLocationOfTsconfig = (): string | undefined => {
	return guessLocationOfTsconfigRecursively('.');
};

const guessLocationOfTsconfigRecursively = (pathName: string): string | undefined => {
	const dir = fs.readdirSync(pathName);

	// First check if tsconfig exists in the current directory
	const tsconfigFileName = dir.find(
		(fileName) => path.basename(fileName) === 'tsconfig.json'
	);
	if (tsconfigFileName) {
		return path.resolve(pathName, 'tsconfig.json');
	}

	// If not, go up one level
	const levelUp = path.resolve(pathName, '..');

	// Stop if we've reached the filesystem root
	if (path.relative(levelUp, pathName) === '') {
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
	if (!compilerHost.readDirectory) {
		throw new TechnicalError('compiler host is missing readDirectory method');
	}

	const files = compilerHost.readDirectory(
		rootDir,
		['ts', 'tsx'], // IS JS EXCLUDED?
		config.exclude ?? [],
		config.include ?? []
	);

	if (!files) {
		throw new TechnicalError('compiler could not resolve project files');
	}

	return files;
};

const graphCache: Map<string | undefined, Promise<Edge[]>> = new Map();

export const extractGraph = async (configFileName?: string): Promise<Edge[]> => {
	const cachedResult = graphCache.get(configFileName);
	if (cachedResult) {
		return cachedResult;
	}
	const computedResult = extractGraphUncached(configFileName);
	graphCache.set(configFileName, computedResult);
	return await computedResult;
};

export const extractGraphUncached = async (configFileName?: string): Promise<Edge[]> => {
	const configFile = configFileName ?? guessLocationOfTsconfig();
	if (!configFile) {
		throw new TechnicalError('Could not find configuration path');
	}

	const config = ts.readConfigFile(configFile, (path: string) => {
		return fs.readFileSync(path).toString();
	});
	if (config.error) {
		throw new TechnicalError('invalid config path');
	}

	const parsedConfig: CompilerOptions = config.config;

	const rootDir = path.dirname(path.resolve(configFile));

	const compilerHost = ts.createCompilerHost(parsedConfig);

	const files = getProjectFiles(rootDir, compilerHost, config?.config);

	const program = ts.createProgram({
		rootNames: files ?? [],
		options: parsedConfig,
		host: compilerHost,
	});

	const imports: Edge[] = [];
	for (const sourceFile of program.getSourceFiles()) {
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
					return;
				}

				const resolver = new ImportPathsResolver(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(parsedConfig as any).compilerOptions
				);

				const suggestion = resolver.getImportSuggestions(
					module,
					path.dirname(normalizedSourceFileName)
				);

				const bestGuess = suggestion !== undefined ? suggestion[0] : undefined;

				// TODO Might use some module resolution cache in future
				const resolvedModule = ts.resolveModuleName(
					bestGuess ?? module,
					sourceFile.fileName,
					parsedConfig,
					compilerHost
				).resolvedModule;

				if (resolvedModule === undefined) {
					return;
				}

				const { resolvedFileName, isExternalLibraryImport } = resolvedModule;
				const normalizedTargetFileName = path.relative(rootDir, resolvedFileName);

				const importKinds = determineImportKinds(x);

				imports.push({
					source: normalizeWindowsPaths(normalizedSourceFileName),
					target: normalizeWindowsPaths(normalizedTargetFileName),
					external: isExternalLibraryImport ?? false,
					importKinds: importKinds,
				});
			} catch (importError) {
				// Skip this import if there's an error processing it
				console.warn('Error processing import:', importError);
			}
		});
	}

	return imports;
};
