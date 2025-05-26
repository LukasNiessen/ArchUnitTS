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
