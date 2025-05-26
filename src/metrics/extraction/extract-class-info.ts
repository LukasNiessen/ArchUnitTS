import * as ts from 'typescript';
import * as path from 'path';
import { Edge } from '../../common/extraction/graph';
import { extractGraph } from '../../common/extraction/extract-graph';
import { ClassInfo } from './interface';

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
}

/**
 * Extracts class information from TypeScript source files for metrics calculation
 */
export function extractClassInfo(
	tsConfigFilePath?: string,
	projectPath: string = process.cwd()
): ClassInfo[] {
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

	const classes: ClassInfo[] = [];

	// Process each source file
	for (const sourceFile of program.getSourceFiles()) {
		if (
			!sourceFile.isDeclarationFile &&
			!sourceFile.fileName.includes('node_modules')
		) {
			processSourceFile(sourceFile, program, classes);
		}
	}

	return classes;
}

function processSourceFile(
	sourceFile: ts.SourceFile,
	program: ts.Program,
	classes: ClassInfo[]
): void {
	function visit(node: ts.Node): void {
		// Find class declarations
		if (ts.isClassDeclaration(node) && node.name) {
			const className = node.name.text;
			const classInfo: ClassInfo = {
				name: className,
				filePath: sourceFile.fileName,
				methods: [],
				fields: [],
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
					const accessedFields: string[] = [];

					// Analyze method body to find field accesses
					if (member.body) {
						findFieldAccesses(
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
