import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
	js.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
			},
			parser: typescriptParser,
			parserOptions: {
				project: './tsconfig.json',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
			import: importPlugin,
			jsdoc: jsdoc,
		},
		rules: {
			// TypeScript-specific rules
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',

			// General JavaScript/TypeScript rules
			'no-var': 'error',
			'no-eval': 'error',
			'no-duplicate-imports': 'error',
			'no-throw-literal': 'error',
			eqeqeq: ['error', 'smart'],
			curly: ['error', 'multi-line'],

			// Import rules
			'import/no-deprecated': 'error',
		},
	},
	prettier,
];
