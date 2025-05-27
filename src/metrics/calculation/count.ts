import * as ts from 'typescript';
import { ClassInfo, Metric } from '../extraction/interface';

/**
 * Count metrics interface for file and class-level counting
 */
export interface CountMetric extends Metric {
	name: string;
	calculate(classInfo: ClassInfo): number;
	description: string;
}

/**
 * File-level count metrics interface for analyzing entire files
 */
export interface FileCountMetric {
	name: string;
	calculateFromFile(sourceFile: ts.SourceFile): number;
	description: string;
}

/**
 * Counts the number of methods in a class
 */
export class MethodCountMetric implements CountMetric {
	name = 'MethodCount';
	description = 'Counts the number of methods in a class';

	calculate(classInfo: ClassInfo): number {
		return classInfo.methods.length;
	}
}

/**
 * Counts the number of fields/properties in a class
 */
export class FieldCountMetric implements CountMetric {
	name = 'FieldCount';
	description = 'Counts the number of fields/properties in a class';

	calculate(classInfo: ClassInfo): number {
		return classInfo.fields.length;
	}
}

/**
 * Counts the total lines of code in a file
 */
export class LinesOfCodeMetric implements FileCountMetric {
	name = 'LinesOfCode';
	description =
		'Counts the total lines of code in a file (excluding empty lines and comments)';

	calculateFromFile(sourceFile: ts.SourceFile): number {
		const text = sourceFile.getFullText();
		const lines = text.split('\n');

		// Count non-empty lines that aren't just whitespace or comments
		return lines.filter((line) => {
			const trimmed = line.trim();
			return (
				trimmed.length > 0 &&
				!trimmed.startsWith('//') &&
				!trimmed.startsWith('/*') &&
				!trimmed.startsWith('*') &&
				trimmed !== '*/'
			);
		}).length;
	}
}

/**
 * Counts the total number of statements in a file
 */
export class StatementCountMetric implements FileCountMetric {
	name = 'StatementCount';
	description = 'Counts the total number of statements in a file';

	calculateFromFile(sourceFile: ts.SourceFile): number {
		let statementCount = 0;

		function visit(node: ts.Node): void {
			// Count various types of statements
			if (
				ts.isExpressionStatement(node) ||
				ts.isVariableStatement(node) ||
				ts.isReturnStatement(node) ||
				ts.isIfStatement(node) ||
				ts.isForStatement(node) ||
				ts.isWhileStatement(node) ||
				ts.isDoStatement(node) ||
				ts.isSwitchStatement(node) ||
				ts.isBreakStatement(node) ||
				ts.isContinueStatement(node) ||
				ts.isThrowStatement(node) ||
				ts.isTryStatement(node) ||
				ts.isWithStatement(node) ||
				ts.isLabeledStatement(node) ||
				ts.isDebuggerStatement(node)
			) {
				statementCount++;
			}

			ts.forEachChild(node, visit);
		}

		visit(sourceFile);
		return statementCount;
	}
}

/**
 * Counts the number of import statements in a file
 */
export class ImportCountMetric implements FileCountMetric {
	name = 'ImportCount';
	description = 'Counts the number of import statements in a file';

	calculateFromFile(sourceFile: ts.SourceFile): number {
		let importCount = 0;

		function visit(node: ts.Node): void {
			if (ts.isImportDeclaration(node)) {
				importCount++;
			}
			ts.forEachChild(node, visit);
		}

		visit(sourceFile);
		return importCount;
	}
}

/**
 * Counts the number of classes in a file
 */
export class ClassCountMetric implements FileCountMetric {
	name = 'ClassCount';
	description = 'Counts the number of classes in a file';

	calculateFromFile(sourceFile: ts.SourceFile): number {
		let classCount = 0;

		function visit(node: ts.Node): void {
			if (ts.isClassDeclaration(node)) {
				classCount++;
			}
			ts.forEachChild(node, visit);
		}

		visit(sourceFile);
		return classCount;
	}
}

/**
 * Counts the number of interfaces in a file
 */
export class InterfaceCountMetric implements FileCountMetric {
	name = 'InterfaceCount';
	description = 'Counts the number of interfaces in a file';

	calculateFromFile(sourceFile: ts.SourceFile): number {
		let interfaceCount = 0;

		function visit(node: ts.Node): void {
			if (ts.isInterfaceDeclaration(node)) {
				interfaceCount++;
			}
			ts.forEachChild(node, visit);
		}

		visit(sourceFile);
		return interfaceCount;
	}
}

/**
 * Counts the number of functions in a file (excluding methods)
 */
export class FunctionCountMetric implements FileCountMetric {
	name = 'FunctionCount';
	description = 'Counts the number of functions in a file (excluding class methods)';

	calculateFromFile(sourceFile: ts.SourceFile): number {
		let functionCount = 0;

		function visit(node: ts.Node): void {
			// Count function declarations and function expressions at module level
			if (
				(ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) &&
				!isInsideClass(node)
			) {
				functionCount++;
			}
			ts.forEachChild(node, visit);
		}

		function isInsideClass(node: ts.Node): boolean {
			let parent = node.parent;
			while (parent) {
				if (ts.isClassDeclaration(parent)) {
					return true;
				}
				parent = parent.parent;
			}
			return false;
		}

		visit(sourceFile);
		return functionCount;
	}
}
