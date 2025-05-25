import ts from 'typescript';
import { ImportKind } from './import-kinds';

export const determineImportKinds = (x: ts.ImportDeclaration): ImportKind[] => {
	const clause = x.importClause;
	if (!clause) {
		return [];
	}

	const kinds: ImportKind[] = [];

	if (clause.isTypeOnly) {
		kinds.push(ImportKind.TYPE);
	} else {
		kinds.push(ImportKind.VALUE);
	}

	if (clause.name) {
		kinds.push(ImportKind.DEFAULT);
	}

	if (clause.namedBindings) {
		if (ts.isNamespaceImport(clause.namedBindings)) {
			kinds.push(ImportKind.NAMESPACE);
		} else if (ts.isNamedImports(clause.namedBindings)) {
			kinds.push(ImportKind.NAMED);
		}
	}

	return kinds;
};
