import ts from 'typescript';
import { ImportKind } from '../extraction/graph';
import { determineImportKinds } from './import-kinds-helper';

describe('determineImportKinds', () => {
	// Helper function to create AST from source code
	const createImportDeclaration = (importStatement: string): ts.ImportDeclaration => {
		const sourceFile = ts.createSourceFile(
			'test.ts',
			importStatement,
			ts.ScriptTarget.Latest,
			true
		);

		const importDeclaration = sourceFile.statements[0] as ts.ImportDeclaration;
		if (!ts.isImportDeclaration(importDeclaration)) {
			throw new Error('Failed to create import declaration');
		}

		return importDeclaration;
	};

	describe('side-effect imports', () => {
		it('should return empty array for side-effect only import', () => {
			const importDecl = createImportDeclaration("import './module';");
			const result = determineImportKinds(importDecl);
			expect(result).toEqual([]);
		});
	});

	describe('default imports', () => {
		it('should return VALUE and DEFAULT for default import', () => {
			const importDecl = createImportDeclaration(
				"import defaultExport from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.VALUE, ImportKind.DEFAULT])
			);
			expect(result).toHaveLength(2);
		});

		it('should return TYPE and DEFAULT for type-only default import', () => {
			const importDecl = createImportDeclaration(
				"import type defaultExport from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.TYPE, ImportKind.DEFAULT])
			);
			expect(result).toHaveLength(2);
		});
	});

	describe('named imports', () => {
		it('should return VALUE and NAMED for named imports', () => {
			const importDecl = createImportDeclaration(
				"import { namedExport } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.VALUE, ImportKind.NAMED])
			);
			expect(result).toHaveLength(2);
		});

		it('should return TYPE and NAMED for type-only named imports', () => {
			const importDecl = createImportDeclaration(
				"import type { TypeExport } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.TYPE, ImportKind.NAMED])
			);
			expect(result).toHaveLength(2);
		});

		it('should handle multiple named imports', () => {
			const importDecl = createImportDeclaration(
				"import { export1, export2, export3 } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.VALUE, ImportKind.NAMED])
			);
			expect(result).toHaveLength(2);
		});
	});

	describe('namespace imports', () => {
		it('should return VALUE and NAMESPACE for namespace import', () => {
			const importDecl = createImportDeclaration(
				"import * as namespace from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.VALUE, ImportKind.NAMESPACE])
			);
			expect(result).toHaveLength(2);
		});

		it('should return TYPE and NAMESPACE for type-only namespace import', () => {
			const importDecl = createImportDeclaration(
				"import type * as TypeNamespace from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.TYPE, ImportKind.NAMESPACE])
			);
			expect(result).toHaveLength(2);
		});
	});

	describe('mixed imports', () => {
		it('should return VALUE, DEFAULT, and NAMED for default + named imports', () => {
			const importDecl = createImportDeclaration(
				"import defaultExport, { namedExport } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([
					ImportKind.VALUE,
					ImportKind.DEFAULT,
					ImportKind.NAMED,
				])
			);
			expect(result).toHaveLength(3);
		});

		it('should return TYPE, DEFAULT, and NAMED for type-only default + named imports', () => {
			const importDecl = createImportDeclaration(
				"import type defaultExport, { TypeExport } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([
					ImportKind.TYPE,
					ImportKind.DEFAULT,
					ImportKind.NAMED,
				])
			);
			expect(result).toHaveLength(3);
		});

		it('should handle default + multiple named imports', () => {
			const importDecl = createImportDeclaration(
				"import defaultExport, { export1, export2 } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([
					ImportKind.VALUE,
					ImportKind.DEFAULT,
					ImportKind.NAMED,
				])
			);
			expect(result).toHaveLength(3);
		});
	});

	describe('edge cases', () => {
		it('should handle imports with aliases', () => {
			const importDecl = createImportDeclaration(
				"import { originalName as alias } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.VALUE, ImportKind.NAMED])
			);
			expect(result).toHaveLength(2);
		});

		it('should handle mixed named imports with aliases', () => {
			const importDecl = createImportDeclaration(
				"import { export1, export2 as alias } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.VALUE, ImportKind.NAMED])
			);
			expect(result).toHaveLength(2);
		});

		it('should handle default import with alias', () => {
			const importDecl = createImportDeclaration(
				"import { default as customName } from './module';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toEqual(
				expect.arrayContaining([ImportKind.VALUE, ImportKind.NAMED])
			);
			expect(result).toHaveLength(2);
		});
	});

	describe('type vs value distinction', () => {
		it('should correctly identify value imports', () => {
			const importDecl = createImportDeclaration(
				"import { Component } from 'react';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toContain(ImportKind.VALUE);
			expect(result).not.toContain(ImportKind.TYPE);
		});

		it('should correctly identify type imports', () => {
			const importDecl = createImportDeclaration(
				"import type { ComponentProps } from 'react';"
			);
			const result = determineImportKinds(importDecl);
			expect(result).toContain(ImportKind.TYPE);
			expect(result).not.toContain(ImportKind.VALUE);
		});
	});

	describe('import clause validation', () => {
		it('should handle malformed import gracefully', () => {
			// Create a mock import declaration without import clause
			const mockImportDecl = {
				importClause: null,
			} as unknown as ts.ImportDeclaration;

			const result = determineImportKinds(mockImportDecl);
			expect(result).toEqual([]);
		});
	});
});
