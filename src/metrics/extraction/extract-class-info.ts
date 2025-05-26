import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export interface ClassInfo {
	name: string;
	filePath: string;
	methods: MethodInfo[];
	fields: FieldInfo[];
}

export interface MethodInfo {
	name: string;
	accessedFields: string[];
}

export interface FieldInfo {
	name: string;
	accessedBy: string[]; // method names that access this field
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
	const typeChecker = program.getTypeChecker();

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

		ts.forEachChild(node, (child) =>
			findFieldAccesses(child, fields, accessedFields)
		);
	}

	visit(sourceFile);
}
