import * as ts from 'typescript';

/**
 * Checks if a given node is an abstract class declaration
 */
export function isAbstractClassDeclaration(node: ts.Node): node is ts.ClassDeclaration {
	return (
		ts.isClassDeclaration(node) &&
		node.modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.AbstractKeyword
		) === true
	);
}

/**
 * Checks if a given node is an abstract method declaration
 */
export function isAbstractMethodDeclaration(node: ts.Node): node is ts.MethodDeclaration {
	return (
		ts.isMethodDeclaration(node) &&
		node.modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.AbstractKeyword
		) === true
	);
}

/**
 * Counts the number of declarations in a source file
 */
export function countDeclarations(sourceFile: ts.SourceFile): {
	total: number;
	interfaces: number;
	abstractClasses: number;
	abstractMethods: number;
	concreteClasses: number;
	functions: number;
	variables: number;
} {
	let total = 0;
	let interfaces = 0;
	let abstractClasses = 0;
	let abstractMethods = 0;
	let concreteClasses = 0;
	let functions = 0;
	let variables = 0;

	function visit(node: ts.Node): void {
		if (ts.isInterfaceDeclaration(node)) {
			interfaces++;
			total++;
		} else if (isAbstractClassDeclaration(node)) {
			abstractClasses++;
			total++;
		} else if (ts.isClassDeclaration(node)) {
			concreteClasses++;
			total++;
		} else if (isAbstractMethodDeclaration(node)) {
			abstractMethods++;
			total++;
		} else if (ts.isFunctionDeclaration(node)) {
			functions++;
			total++;
		} else if (ts.isVariableStatement(node)) {
			variables += node.declarationList.declarations.length;
			total += node.declarationList.declarations.length;
		}

		ts.forEachChild(node, visit);
	}

	visit(sourceFile);

	return {
		total,
		interfaces,
		abstractClasses,
		abstractMethods,
		concreteClasses,
		functions,
		variables,
	};
}
