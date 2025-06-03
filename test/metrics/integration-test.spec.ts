import { metrics } from '../../src/metrics';
// Import auto-detection to enable Jest matchers
import '../../src/testing/setup/auto-detect';

// Mock the extract class info to provide some test classes with known LCOM values
jest.mock('../../src/metrics/extraction/extract-class-info', () => {
	const original = jest.requireActual(
		'../../src/metrics/extraction/extract-class-info'
	);
	return {
		...original,
		extractClassInfo: jest.fn(() => [
			{
				name: 'HighCohesionClass',
				filePath: '/src/example/HighCohesionClass.ts',
				methods: [
					{ name: 'method1', accessedFields: ['field1', 'field2', 'field3'] },
					{ name: 'method2', accessedFields: ['field1', 'field2', 'field3'] },
					{ name: 'method3', accessedFields: ['field1', 'field2', 'field3'] },
				],
				fields: [
					{ name: 'field1', accessedBy: ['method1', 'method2', 'method3'] },
					{ name: 'field2', accessedBy: ['method1', 'method2', 'method3'] },
					{ name: 'field3', accessedBy: ['method1', 'method2', 'method3'] },
				],
			},
			{
				name: 'LowCohesionClass',
				filePath: '/src/example/LowCohesionClass.ts',
				methods: [
					{ name: 'method1', accessedFields: ['field1'] },
					{ name: 'method2', accessedFields: ['field2'] },
					{ name: 'method3', accessedFields: ['field3'] },
				],
				fields: [
					{ name: 'field1', accessedBy: ['method1'] },
					{ name: 'field2', accessedBy: ['method2'] },
					{ name: 'field3', accessedBy: ['method3'] },
				],
			},
			{
				name: 'MediumCohesionClass',
				filePath: '/src/example/MediumCohesionClass.ts',
				methods: [
					{ name: 'method1', accessedFields: ['field1', 'field2'] },
					{ name: 'method2', accessedFields: ['field2', 'field3'] },
					{ name: 'method3', accessedFields: ['field1'] },
				],
				fields: [
					{ name: 'field1', accessedBy: ['method1', 'method3'] },
					{ name: 'field2', accessedBy: ['method1', 'method2'] },
					{ name: 'field3', accessedBy: ['method2'] },
				],
			},
		]),
	};
});

describe('LCOM metrics integration test', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should pass when all classes but one meet the cohesion threshold', async () => {
		const violations = await metrics()
			.lcom()
			.lcom96a()
			.shouldBeBelow(0.9) // All classes have LCOM < 0.9
			.check();
		// Only LowCohesionClass has LCOM = 1, which fails the threshold
		expect(violations.length).toBe(1);

		// Check that the violations have the correct class names
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const classNames = violations.map((v) => (v as any).className);
		expect(classNames).toContain('LowCohesionClass');
	});

	it('should detect violations for classes with low cohesion', async () => {
		const violations = await metrics()
			.lcom()
			.lcom96b()
			.shouldBeBelow(0.3) // Requires LCOM < 0.3 (high cohesion)
			.check();
		// Both MediumCohesionClass and LowCohesionClass should fail
		expect(violations.length).toBe(2);

		// Check that the violations have the correct class names
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const classNames = violations.map((v) => (v as any).className);
		expect(classNames).toContain('LowCohesionClass');
		expect(classNames).toContain('MediumCohesionClass');
	});

	it('should not detect violations if LCOM is high', async () => {
		const rule = metrics().lcom().lcom96b().shouldBeBelowOrEqual(1);
		await expect(rule).toPassAsync();
	});

	it('should find violations for classes with poor cohesion', async () => {
		const violations = await metrics()
			.lcom()
			.lcom96b()
			.shouldBeBelow(0.1) // Classes should have LCOM < 0.1 (high cohesion required)
			.check();

		// LowCohesionClass and MediumCohesionClass should fail as they have LCOM > 0.1
		expect(violations.length).toBe(2);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const classNames = violations.map((v) => (v as any).className);
		expect(classNames).toContain('LowCohesionClass');
		expect(classNames).toContain('MediumCohesionClass');
	});
});
