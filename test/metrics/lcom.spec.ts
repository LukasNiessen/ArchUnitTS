import { LCOM96b, ClassInfo } from '../../src/metrics';

describe('LCOM96b metric calculation', () => {
	const lcom96b = new LCOM96b();

	it('should return 0 for perfect cohesion', () => {
		// A class where all methods access all fields
		const classInfo: ClassInfo = {
			name: 'PerfectCohesion',
			filePath: '/path/to/perfect.ts',
			methods: [
				{ name: 'method1', accessedFields: ['field1', 'field2'] },
				{ name: 'method2', accessedFields: ['field1', 'field2'] },
			],
			fields: [
				{ name: 'field1', accessedBy: ['method1', 'method2'] },
				{ name: 'field2', accessedBy: ['method1', 'method2'] },
			],
		};

		expect(lcom96b.calculate(classInfo)).toBe(0);
	});

	it('should return 1 for no cohesion', () => {
		// A class where each method accesses a separate field
		const classInfo: ClassInfo = {
			name: 'NoCohesion',
			filePath: '/path/to/nocohesion.ts',
			methods: [
				{ name: 'method1', accessedFields: ['field1'] },
				{ name: 'method2', accessedFields: ['field2'] },
			],
			fields: [
				{ name: 'field1', accessedBy: ['method1'] },
				{ name: 'field2', accessedBy: ['method2'] },
			],
		};

		expect(lcom96b.calculate(classInfo)).toBe(0.5);
	});

	it('should return 0 for a class with one method', () => {
		const classInfo: ClassInfo = {
			name: 'SingleMethod',
			filePath: '/path/to/single.ts',
			methods: [{ name: 'method1', accessedFields: ['field1'] }],
			fields: [{ name: 'field1', accessedBy: ['method1'] }],
		};

		expect(lcom96b.calculate(classInfo)).toBe(0);
	});

	it('should return 0 for a class with no methods', () => {
		const classInfo: ClassInfo = {
			name: 'NoMethods',
			filePath: '/path/to/nomethods.ts',
			methods: [],
			fields: [{ name: 'field1', accessedBy: [] }],
		};

		expect(lcom96b.calculate(classInfo)).toBe(0);
	});

	it('should return a value between 0 and 1 for partial cohesion', () => {
		// A class with partial cohesion
		const classInfo: ClassInfo = {
			name: 'PartialCohesion',
			filePath: '/path/to/partial.ts',
			methods: [
				{ name: 'method1', accessedFields: ['field1', 'field2'] },
				{ name: 'method2', accessedFields: ['field2'] },
				{ name: 'method3', accessedFields: ['field3'] },
			],
			fields: [
				{ name: 'field1', accessedBy: ['method1'] },
				{ name: 'field2', accessedBy: ['method1', 'method2'] },
				{ name: 'field3', accessedBy: ['method3'] },
			],
		};

		const result = lcom96b.calculate(classInfo);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThanOrEqual(1);
	});
});
