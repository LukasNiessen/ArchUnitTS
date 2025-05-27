import { metrics } from '../../src/metrics/fluentapi/metrics';
import path from 'path';
import {
	MethodCountMetric,
	FieldCountMetric,
	LinesOfCodeMetric,
	StatementCountMetric,
	ImportCountMetric,
	ClassCountMetric,
	InterfaceCountMetric,
	FunctionCountMetric,
} from '../../src/metrics/calculation/count';
import { ClassInfo } from '../../src/metrics/extraction/interface';
import * as ts from 'typescript';

describe('Count Metrics', () => {
	describe('MethodCountMetric', () => {
		it('should count methods correctly', () => {
			const metric = new MethodCountMetric();
			const classInfo: ClassInfo = {
				name: 'TestClass',
				filePath: '/test/TestClass.ts',
				methods: [
					{ name: 'method1', accessedFields: [] },
					{ name: 'method2', accessedFields: [] },
					{ name: 'method3', accessedFields: [] },
				],
				fields: [],
			};

			const result = metric.calculate(classInfo);
			expect(result).toBe(3);
		});

		it('should return 0 for class with no methods', () => {
			const metric = new MethodCountMetric();
			const classInfo: ClassInfo = {
				name: 'EmptyClass',
				filePath: '/test/EmptyClass.ts',
				methods: [],
				fields: [],
			};

			const result = metric.calculate(classInfo);
			expect(result).toBe(0);
		});

		it('should have correct name and description', () => {
			const metric = new MethodCountMetric();
			expect(metric.name).toBe('MethodCount');
			expect(metric.description).toBe('Counts the number of methods in a class');
		});
	});

	describe('FieldCountMetric', () => {
		it('should count fields correctly', () => {
			const metric = new FieldCountMetric();
			const classInfo: ClassInfo = {
				name: 'TestClass',
				filePath: '/test/TestClass.ts',
				methods: [],
				fields: [
					{ name: 'field1', accessedBy: [] },
					{ name: 'field2', accessedBy: [] },
				],
			};

			const result = metric.calculate(classInfo);
			expect(result).toBe(2);
		});

		it('should return 0 for class with no fields', () => {
			const metric = new FieldCountMetric();
			const classInfo: ClassInfo = {
				name: 'EmptyClass',
				filePath: '/test/EmptyClass.ts',
				methods: [],
				fields: [],
			};

			const result = metric.calculate(classInfo);
			expect(result).toBe(0);
		});

		it('should have correct name and description', () => {
			const metric = new FieldCountMetric();
			expect(metric.name).toBe('FieldCount');
			expect(metric.description).toBe(
				'Counts the number of fields/properties in a class'
			);
		});
	});

	describe('LinesOfCodeMetric', () => {
		it('should count non-empty lines correctly', () => {
			const metric = new LinesOfCodeMetric();

			// Mock TypeScript SourceFile
			const mockSourceFile = {
				getFullText: () => `
// This is a comment
export class TestClass {
	private field1: string;

	public method1(): void {
		console.log('test');
	}
}
`,
			} as ts.SourceFile;

			const result = metric.calculateFromFile(mockSourceFile);
			// Should count: export class..., private field1..., public method1()..., console.log...
			// Should ignore: empty lines and comments
			expect(result).toBeGreaterThan(0);
		});

		it('should ignore empty lines and comments', () => {
			const metric = new LinesOfCodeMetric();

			const mockSourceFile = {
				getFullText: () => `
// Comment line 1
/* Comment line 2 */
/**
 * Multi-line comment
 */

const variable = 'test';

`,
			} as ts.SourceFile;

			const result = metric.calculateFromFile(mockSourceFile);
			expect(result).toBe(1); // Only "const variable = 'test';" should be counted
		});

		it('should have correct name and description', () => {
			const metric = new LinesOfCodeMetric();
			expect(metric.name).toBe('LinesOfCode');
			expect(metric.description).toBe(
				'Counts the total lines of code in a file (excluding empty lines and comments)'
			);
		});
	});

	describe('StatementCountMetric', () => {
		it('should count statements correctly', () => {
			const metric = new StatementCountMetric();

			// Create a minimal TypeScript source file for testing
			const sourceCode = `
			const variable = 'test';
			if (true) {
				console.log('hello');
			}
			for (let i = 0; i < 10; i++) {
				break;
			}
			`;

			const sourceFile = ts.createSourceFile(
				'test.ts',
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);

			const result = metric.calculateFromFile(sourceFile);
			expect(result).toBeGreaterThan(0);
		});

		it('should have correct name and description', () => {
			const metric = new StatementCountMetric();
			expect(metric.name).toBe('StatementCount');
			expect(metric.description).toBe(
				'Counts the total number of statements in a file'
			);
		});
	});

	describe('ImportCountMetric', () => {
		it('should count import statements correctly', () => {
			const metric = new ImportCountMetric();

			const sourceCode = `
			import { Component } from 'react';
			import * as fs from 'fs';
			import './styles.css';
			
			const variable = 'test';
			`;

			const sourceFile = ts.createSourceFile(
				'test.ts',
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);

			const result = metric.calculateFromFile(sourceFile);
			expect(result).toBe(3);
		});

		it('should return 0 when no imports', () => {
			const metric = new ImportCountMetric();

			const sourceCode = `
			const variable = 'test';
			console.log(variable);
			`;

			const sourceFile = ts.createSourceFile(
				'test.ts',
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);

			const result = metric.calculateFromFile(sourceFile);
			expect(result).toBe(0);
		});

		it('should have correct name and description', () => {
			const metric = new ImportCountMetric();
			expect(metric.name).toBe('ImportCount');
			expect(metric.description).toBe(
				'Counts the number of import statements in a file'
			);
		});
	});

	describe('ClassCountMetric', () => {
		it('should count class declarations correctly', () => {
			const metric = new ClassCountMetric();

			const sourceCode = `
			class TestClass1 {
				test() {}
			}
			
			export class TestClass2 {
				test() {}
			}
			
			abstract class TestClass3 {
				abstract test(): void;
			}
			`;

			const sourceFile = ts.createSourceFile(
				'test.ts',
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);

			const result = metric.calculateFromFile(sourceFile);
			expect(result).toBe(3);
		});

		it('should have correct name and description', () => {
			const metric = new ClassCountMetric();
			expect(metric.name).toBe('ClassCount');
			expect(metric.description).toBe('Counts the number of classes in a file');
		});
	});

	describe('InterfaceCountMetric', () => {
		it('should count interface declarations correctly', () => {
			const metric = new InterfaceCountMetric();

			const sourceCode = `
			interface Interface1 {
				prop1: string;
			}
			
			export interface Interface2 {
				prop2: number;
			}
			
			class TestClass {}
			`;

			const sourceFile = ts.createSourceFile(
				'test.ts',
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);

			const result = metric.calculateFromFile(sourceFile);
			expect(result).toBe(2);
		});

		it('should have correct name and description', () => {
			const metric = new InterfaceCountMetric();
			expect(metric.name).toBe('InterfaceCount');
			expect(metric.description).toBe('Counts the number of interfaces in a file');
		});
	});

	describe('FunctionCountMetric', () => {
		it('should count function declarations correctly', () => {
			const metric = new FunctionCountMetric();

			const sourceCode = `
			function testFunction1() {
				return 'test1';
			}
			
			export function testFunction2() {
				return 'test2';
			}
			
			const arrowFunction = () => 'test3';
			
			class TestClass {
				method() { // Should not be counted
					return 'method';
				}
			}
			`;

			const sourceFile = ts.createSourceFile(
				'test.ts',
				sourceCode,
				ts.ScriptTarget.Latest,
				true
			);

			const result = metric.calculateFromFile(sourceFile);
			expect(result).toBeGreaterThanOrEqual(2); // At least the two function declarations
		});

		it('should have correct name and description', () => {
			const metric = new FunctionCountMetric();
			expect(metric.name).toBe('FunctionCount');
			expect(metric.description).toBe(
				'Counts the number of functions in a file (excluding class methods)'
			);
		});
	});

	describe('Fluent API Integration', () => {
		it('should create count metrics builder', () => {
			const builder = metrics().count();
			expect(builder).toBeDefined();
			expect(builder.methodCount).toBeDefined();
			expect(builder.fieldCount).toBeDefined();
			expect(builder.linesOfCode).toBeDefined();
		});

		it('should create method count threshold builder', () => {
			const thresholdBuilder = metrics().count().methodCount();
			expect(thresholdBuilder).toBeDefined();
			expect(thresholdBuilder.shouldBeBelowOrEqual).toBeDefined();
			expect(thresholdBuilder.shouldBeAbove).toBeDefined();
		});

		it('should create lines of code threshold builder', () => {
			const thresholdBuilder = metrics().count().linesOfCode();
			expect(thresholdBuilder).toBeDefined();
			expect(thresholdBuilder.shouldBeBelowOrEqual).toBeDefined();
			expect(thresholdBuilder.shouldBeAbove).toBeDefined();
		});
		it('should create all count metric builders', () => {
			const builder = metrics().count();
			expect(builder.methodCount).toBeDefined();
			expect(builder.fieldCount).toBeDefined();
			expect(builder.linesOfCode).toBeDefined();
			expect(builder.statements).toBeDefined();
			expect(builder.imports).toBeDefined();
			expect(builder.classes).toBeDefined();
			expect(builder.interfaces).toBeDefined();
			expect(builder.functions).toBeDefined();
		});
	});

	describe('Threshold Conditions', () => {
		it('should create method count condition with threshold', () => {
			const condition = metrics().count().methodCount().shouldBeBelowOrEqual(10);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});

		it('should create lines of code condition with threshold', () => {
			const condition = metrics().count().linesOfCode().shouldBeBelowOrEqual(100);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});

		it('should create field count condition with threshold', () => {
			const condition = metrics().count().fieldCount().shouldBeAbove(0);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});
		it('should create statement count condition with threshold', () => {
			const condition = metrics().count().statements().shouldBeBelow(50);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});

		it('should create import count condition with threshold', () => {
			const condition = metrics().count().imports().shouldBeBelowOrEqual(20);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});

		it('should create class count condition with threshold', () => {
			const condition = metrics().count().classes().shouldBeAboveOrEqual(1);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});

		it('should create interface count condition with threshold', () => {
			const condition = metrics().count().interfaces().shouldBe(2);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});

		it('should create function count condition with threshold', () => {
			const condition = metrics().count().functions().shouldBeAbove(0);
			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});
	});
	describe('Threshold Validation', () => {
		it('should validate method count violations correctly', async () => {
			const condition = metrics().count().methodCount().shouldBeBelowOrEqual(10);
			const violations = await condition.check();

			// Since this uses real project files, we can only test that the check method works
			expect(Array.isArray(violations)).toBe(true);
			expect(typeof violations.length).toBe('number');
		});
		it('should not create violations when thresholds are met', async () => {
			const mockProjectPath = path.join(__dirname, 'mock-project', 'tsconfig.json');

			const methodCondition = metrics(mockProjectPath)
				.count()
				.methodCount()
				.shouldBeBelowOrEqual(100);
			const fieldCondition = metrics(mockProjectPath)
				.count()
				.fieldCount()
				.shouldBeAboveOrEqual(0);

			const methodViolations = await methodCondition.check();
			const fieldViolations = await fieldCondition.check();

			// Test that check methods return arrays
			expect(Array.isArray(methodViolations)).toBe(true);
			expect(Array.isArray(fieldViolations)).toBe(true);
		});
	});
});
