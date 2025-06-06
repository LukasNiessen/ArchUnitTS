import * as ts from 'typescript';
import * as path from 'path';
import { Edge, extractGraph } from '../../common/extraction';
import { ClassInfo } from './interface';
import { Logger } from '../../common';

/**
 * Enhanced class information including abstractness and dependency data
 */
export interface EnhancedClassInfo extends ClassInfo {
	isAbstract: boolean;
	isInterface: boolean;
	abstractMethods: string[];
	dependencies: ClassDependencyInfo;
}

/**
 * Dependency information for a class/file
 */
export interface ClassDependencyInfo {
	efferentCoupling: number; // outgoing dependencies (Ce)
	afferentCoupling: number; // incoming dependencies (Ca)
	outgoingDependencies: string[]; // files this class depends on
	incomingDependencies: string[]; // files that depend on this class
}

/**
 * File-level analysis result for distance metrics
 */
export interface FileAnalysisResult {
	filePath: string;
	classes: EnhancedClassInfo[];
	interfaces: number;
	abstractClasses: number;
	concreteClasses: number;
	totalTypes: number;
	dependencies: ClassDependencyInfo;
	sourceFile?: ts.SourceFile; // Optional source file for more detailed analysis
}

/**
 * Extracts class information from TypeScript source files for metrics calculation
 */
export function extractClassInfo(
	tsConfigFilePath?: string,
	projectPath: string = process.cwd(),
	loggerInput?: Logger
): ClassInfo[] {
	const logger = loggerInput;

	logger?.debug(
		`Starting class extraction with config: ${tsConfigFilePath || 'auto-detected'}`
	);
	logger?.info(`Project path: ${projectPath}`);

	// Get program from tsconfig or create a default one
	const configPath = tsConfigFilePath
		? path.resolve(projectPath, tsConfigFilePath)
		: path.resolve(projectPath, 'tsconfig.json');

	logger?.info(`Using TypeScript config file: ${configPath}`);
	logger?.debug(`Reading config file: ${configPath}`);

	const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
	if (configFile.error) {
		const error = `Error reading tsconfig file: ${configFile.error.messageText}`;
		logger?.error(error);
		throw new Error(error);
	}

	logger?.debug('Successfully read TypeScript configuration file');

	const parsedConfig = ts.parseJsonConfigFileContent(
		configFile.config,
		ts.sys,
		path.dirname(configPath),
		{},
		configPath
	);

	if (parsedConfig.errors.length > 0) {
		const error = `Error parsing tsconfig file: ${parsedConfig.errors[0].messageText}`;
		logger?.error(error);
		throw new Error(error);
	}

	logger?.debug('Successfully parsed TypeScript configuration');
	logger?.debug(
		`Compiler options: ${JSON.stringify(parsedConfig.options, null, 2).slice(0, 500)}...`
	);
	logger?.info(`Found ${parsedConfig.fileNames.length} files in project configuration`);

	logger?.debug(
		`Root files: ${parsedConfig.fileNames.slice(0, 10).join(', ')}${parsedConfig.fileNames.length > 10 ? `... and ${parsedConfig.fileNames.length - 10} more` : ''}`
	);

	logger?.debug('Creating TypeScript program');
	const program = ts.createProgram({
		rootNames: parsedConfig.fileNames,
		options: parsedConfig.options,
	});

	const sourceFiles = program.getSourceFiles();
	logger?.info(`TypeScript program created with ${sourceFiles.length} source files`);

	// Filter out files from node_modules for logging purposes
	const projectFiles = sourceFiles.filter(
		(sf) => !sf.isDeclarationFile && !sf.fileName.includes('node_modules')
	);
	const declarationFiles = sourceFiles.filter((sf) => sf.isDeclarationFile);
	const nodeModulesFiles = sourceFiles.filter((sf) =>
		sf.fileName.includes('node_modules')
	);

	logger?.debug(`Project source files: ${projectFiles.length}`);
	logger?.debug(`Declaration files: ${declarationFiles.length}`);
	logger?.debug(`Node modules files: ${nodeModulesFiles.length}`);

	if (projectFiles.length === 0) {
		logger?.warn(
			'No project source files found - this might indicate a configuration issue'
		);
	}

	const classes: ClassInfo[] = [];
	let processedFiles = 0;

	logger?.debug('Starting class extraction from source files');

	// Process each source file
	for (const sourceFile of program.getSourceFiles()) {
		if (
			!sourceFile.isDeclarationFile &&
			!sourceFile.fileName.includes('node_modules')
		) {
			processedFiles++;
			logger?.debug(
				`Processing file ${processedFiles}/${projectFiles.length}: ${path.relative(projectPath, sourceFile.fileName)}`
			);

			const classesBeforeFile = classes.length;
			processSourceFile(sourceFile, program, classes);
			const classesAfterFile = classes.length;
			const classesFoundInFile = classesAfterFile - classesBeforeFile;

			if (classesFoundInFile > 0) {
				logger?.debug(
					`Found ${classesFoundInFile} class(es) in ${path.relative(projectPath, sourceFile.fileName)}`
				);
			}
		}
	}

	logger?.info(`Class extraction completed:`);
	logger?.info(`  - Total classes found: ${classes.length}`);
	logger?.info(`  - Files processed: ${processedFiles}`);

	if (classes.length === 0) {
		logger?.warn(
			'No classes found - this might indicate a pattern matching or file discovery issue'
		);
	}

	return classes;
}

function processSourceFile(
	sourceFile: ts.SourceFile,
	program: ts.Program,
	classes: ClassInfo[],
	loggerInput?: Logger
): void {
	const logger = loggerInput;

	const relativeFileName = path.relative(process.cwd(), sourceFile.fileName);
	logger?.debug(`Analyzing source file: ${relativeFileName}`);

	let classesFoundInFile = 0;

	function visit(node: ts.Node): void {
		// Find class declarations
		if (ts.isClassDeclaration(node) && node.name) {
			classesFoundInFile++;
			const className = node.name.text;
			logger?.debug(`  Found class: ${className}`);

			const classInfo: ClassInfo = {
				name: className,
				filePath: relativeFileName,
				methods: [],
				fields: [],
			};

			let methodCount = 0;
			let fieldCount = 0;

			// Process class members
			node.members.forEach((member) => {
				// Find class properties/fields
				if (ts.isPropertyDeclaration(member) && member.name) {
					fieldCount++;
					const fieldName = member.name.getText(sourceFile);
					classInfo.fields.push({
						name: fieldName,
						accessedBy: [],
					});
				}

				// Find class methods
				if (ts.isMethodDeclaration(member) && member.name) {
					methodCount++;
					const methodName = member.name.getText(sourceFile);
					const accessedFields: string[] = [];

					// Analyze method body to find field accesses
					if (member.body) {
						logger?.debug(`    Analyzing method: ${methodName}`);
						findFieldAccesses(
							member.body,
							classInfo.fields.map((f) => f.name),
							accessedFields
						);

						if (accessedFields.length > 0) {
							logger?.debug(
								`      Method ${methodName} accesses fields: ${accessedFields.join(', ')}`
							);
						}
					}

					classInfo.methods.push({
						name: methodName,
						accessedFields: accessedFields,
					});

					// Update fields with methods that access them
					accessedFields.forEach((field) => {
						const fieldInfo = classInfo.fields.find((f) => f.name === field);
						if (fieldInfo && !fieldInfo.accessedBy.includes(methodName)) {
							fieldInfo.accessedBy.push(methodName);
						}
					});
				}
			});

			logger?.debug(
				`    Class ${className} has ${methodCount} methods and ${fieldCount} fields`
			);
			classes.push(classInfo);
		}

		ts.forEachChild(node, visit);
	}

	function findFieldAccesses(
		node: ts.Node,
		fields: string[],
		accessedFields: string[]
	): void {
		if (ts.isPropertyAccessExpression(node)) {
			const propertyName = node.name.text;
			if (fields.includes(propertyName)) {
				if (!accessedFields.includes(propertyName)) {
					accessedFields.push(propertyName);
				}
			}
		}

		ts.isInterfaceDeclaration(node);

		ts.forEachChild(node, (child) =>
			findFieldAccesses(child, fields, accessedFields)
		);
	}

	visit(sourceFile);

	if (classesFoundInFile > 0) {
		logger?.debug(
			`  Total classes found in ${relativeFileName}: ${classesFoundInFile}`
		);
	} else {
		logger?.debug(`  No classes found in ${relativeFileName}`);
	}
}

/**
 * Enhanced class information extraction with abstractness and dependency analysis
 */
export async function extractEnhancedClassInfo(
	tsConfigFilePath?: string,
	projectPath: string = process.cwd()
): Promise<FileAnalysisResult[]> {
	// Get program from tsconfig or create a default one
	const configPath = tsConfigFilePath
		? path.resolve(projectPath, tsConfigFilePath)
		: path.resolve(projectPath, 'tsconfig.json');

	const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
	if (configFile.error) {
		throw new Error(`Error reading tsconfig file: ${configFile.error.messageText}`);
	}

	const parsedConfig = ts.parseJsonConfigFileContent(
		configFile.config,
		ts.sys,
		path.dirname(configPath),
		{},
		configPath
	);

	if (parsedConfig.errors.length > 0) {
		throw new Error(
			`Error parsing tsconfig file: ${parsedConfig.errors[0].messageText}`
		);
	}

	const program = ts.createProgram({
		rootNames: parsedConfig.fileNames,
		options: parsedConfig.options,
	});

	// Extract dependency graph
	const dependencyGraph = await extractGraph(tsConfigFilePath || configPath);

	const fileResults: FileAnalysisResult[] = [];

	// Process each source file
	for (const sourceFile of program.getSourceFiles()) {
		if (
			!sourceFile.isDeclarationFile &&
			!sourceFile.fileName.includes('node_modules')
		) {
			const result = processSourceFileEnhanced(
				sourceFile,
				program,
				dependencyGraph
			);
			if (result.totalTypes > 0) {
				// Only include files with classes/interfaces
				fileResults.push(result);
			}
		}
	}

	return fileResults;
}

function processSourceFileEnhanced(
	sourceFile: ts.SourceFile,
	program: ts.Program,
	dependencyGraph: Edge[]
): FileAnalysisResult {
	const classes: EnhancedClassInfo[] = [];
	let interfaces = 0;
	let abstractClasses = 0;
	let concreteClasses = 0;

	function visit(node: ts.Node): void {
		// Find interface declarations
		if (ts.isInterfaceDeclaration(node) && node.name) {
			interfaces++;
		}

		// Find class declarations
		if (ts.isClassDeclaration(node) && node.name) {
			const className = node.name.text;
			const isAbstract =
				node.modifiers?.some(
					(modifier) => modifier.kind === ts.SyntaxKind.AbstractKeyword
				) || false;

			if (isAbstract) {
				abstractClasses++;
			} else {
				concreteClasses++;
			}

			const classInfo: EnhancedClassInfo = {
				name: className,
				filePath: sourceFile.fileName,
				methods: [],
				fields: [],
				isAbstract: isAbstract,
				isInterface: false,
				abstractMethods: [],
				dependencies: calculateClassDependencies(
					sourceFile.fileName,
					dependencyGraph
				),
			};

			// Process class members
			node.members.forEach((member) => {
				// Find class properties/fields
				if (ts.isPropertyDeclaration(member) && member.name) {
					const fieldName = member.name.getText(sourceFile);
					classInfo.fields.push({
						name: fieldName,
						accessedBy: [],
					});
				}

				// Find class methods
				if (ts.isMethodDeclaration(member) && member.name) {
					const methodName = member.name.getText(sourceFile);
					const isAbstractMethod =
						member.modifiers?.some(
							(modifier) => modifier.kind === ts.SyntaxKind.AbstractKeyword
						) || false;
					if (isAbstractMethod) {
						classInfo.abstractMethods.push(methodName);
					}

					const accessedFields: string[] = [];

					// Analyze method body to find field accesses
					if (member.body) {
						findFieldAccessesInMethod(
							member.body,
							classInfo.fields.map((f) => f.name),
							accessedFields
						);
					}

					classInfo.methods.push({
						name: methodName,
						accessedFields: accessedFields,
					});

					// Update fields with methods that access them
					accessedFields.forEach((field) => {
						const fieldInfo = classInfo.fields.find((f) => f.name === field);
						if (fieldInfo && !fieldInfo.accessedBy.includes(methodName)) {
							fieldInfo.accessedBy.push(methodName);
						}
					});
				}
			});

			classes.push(classInfo);
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	const totalTypes = interfaces + abstractClasses + concreteClasses;
	const fileDependencies = calculateClassDependencies(
		sourceFile.fileName,
		dependencyGraph
	);
	return {
		filePath: sourceFile.fileName,
		classes,
		interfaces,
		abstractClasses,
		concreteClasses,
		totalTypes,
		dependencies: fileDependencies,
		sourceFile, // Include the sourceFile for file-wise analysis
	};
}

function calculateClassDependencies(
	filePath: string,
	dependencyGraph: Edge[]
): ClassDependencyInfo {
	const normalizedPath = path.normalize(filePath);

	// Find outgoing dependencies (efferent coupling)
	const outgoingDependencies = dependencyGraph
		.filter((edge) => {
			const normalizedSource = path.normalize(edge.source);
			return (
				normalizedSource === normalizedPath ||
				normalizedSource.endsWith(normalizedPath)
			);
		})
		.filter((edge) => !edge.external) // Only internal dependencies
		.map((edge) => edge.target);

	// Find incoming dependencies (afferent coupling)
	const incomingDependencies = dependencyGraph
		.filter((edge) => {
			const normalizedTarget = path.normalize(edge.target);
			return (
				normalizedTarget === normalizedPath ||
				normalizedTarget.endsWith(normalizedPath)
			);
		})
		.filter((edge) => !edge.external) // Only internal dependencies
		.map((edge) => edge.source);

	return {
		efferentCoupling: outgoingDependencies.length,
		afferentCoupling: incomingDependencies.length,
		outgoingDependencies: [...new Set(outgoingDependencies)], // Remove duplicates
		incomingDependencies: [...new Set(incomingDependencies)], // Remove duplicates
	};
}

function findFieldAccessesInMethod(
	node: ts.Node,
	fields: string[],
	accessedFields: string[]
): void {
	if (ts.isPropertyAccessExpression(node)) {
		const propertyName = node.name.text;
		if (fields.includes(propertyName)) {
			if (!accessedFields.includes(propertyName)) {
				accessedFields.push(propertyName);
			}
		}
	}

	ts.forEachChild(node, (child) =>
		findFieldAccessesInMethod(child, fields, accessedFields)
	);
}
