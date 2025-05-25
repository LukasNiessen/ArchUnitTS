import ts from 'typescript';
import { ImportKind } from './import-kinds';

/**
 *
 *
 *  | `ImportKind`  | Example                                        | Explanation                                                    |
 *  | ------------- | ---------------------------------------------- | -------------------------------------------------------------- |
 *  | `VALUE`       | `import { something } from './module';`        | A runtime import (default behavior if not `type`).             |
 *  | `TYPE`        | `import type { SomeType } from './types';`     | A compile-time-only import (used for TypeScript types).        |
 *  | `DEFAULT`     | `import React from 'react';`                   | A default import—grabs the default export from the module.     |
 *  | `NAMED`       | `import { useState, useEffect } from 'react';` | Named imports—specific exported bindings.                      |
 *  | `NAMESPACE`   | `import * as React from 'react';`              | Namespace import—imports the entire module as an object.       |
 *  | `SIDE_EFFECT` | `import './setupGlobals';`                     | Side-effect-only import—executes the module but binds nothing. |
 *
 */
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
