import { metrics } from '../../src/metrics/fluentapi/metrics';
import { extractClassInfo } from '../../src/metrics/extraction/extract-class-info';
import { MetricViolation } from '../../src/metrics/assertion/metric-thresholds';
import { ClassInfo } from '../../src/metrics/common/interface';

// Mock the extractClassInfo function
jest.mock('../../src/metrics/extraction/extract-class-info');

describe('Metrics fluent API', () => {
	beforeEach(() => {
		// Reset mocks
		jest.resetAllMocks();
	});

	it('should detect violations when LCOM is above threshold', async () => {
		const mockClasses: ClassInfo[] = [
			{
				name: 'ExampleClass',
				filePath: '/path/to/example.ts',
				methods: [
					{ name: 'method1', accessedFields: ['field1'] },
					{ name: 'method2', accessedFields: [''] },
					{ name: 'method3', accessedFields: ['field1'] },
					{ name: 'method4', accessedFields: ['field2, field1'] },
				],
				fields: [
					{ name: 'field1', accessedBy: ['method1'] },
					{ name: 'field2', accessedBy: [] },
					{ name: 'field3', accessedBy: [] },
				],
			},
		];
		(extractClassInfo as jest.Mock).mockReturnValue(mockClasses);

		const violations = await metrics().lcom().lcom96a().shouldBeBelow(0.5).check();

		expect(violations.length).toBe(1);
		const violation = violations[0] as MetricViolation;
		expect(violation.className).toBe('ExampleClass');
		expect(violation.metricName).toBe('LCOM96a');
		expect(violation.metricValue).toBeGreaterThan(1);
		expect(violation.threshold).toBe(0.5);
		expect(violation.comparison).toBe('below');
	});

	it('should detect violations when LCOM is too low', async () => {
		const mockClasses: ClassInfo[] = [
			{
				name: 'ExampleClass',
				filePath: '/path/to/example.ts',
				methods: [
					{ name: 'method1', accessedFields: ['field1', 'field2'] },
					{ name: 'method2', accessedFields: ['field1', 'field2'] },
				],
				fields: [
					{ name: 'field1', accessedBy: ['method1', 'method2'] },
					{ name: 'field2', accessedBy: ['method1', 'method2'] },
				],
			},
		];

		(extractClassInfo as jest.Mock).mockReturnValue(mockClasses);

		const violations = await metrics().lcom().lcom96b().shouldBeBelow(0.5).check();

		expect(violations.length).toBe(0);
	});

	it('should detect violations when LCOM is too high', async () => {
		const mockClasses: ClassInfo[] = [
			{
				name: 'ExampleClass',
				filePath: '/path/to/class.ts',
				methods: [
					{ name: 'method1', accessedFields: [] },
					{ name: 'method2', accessedFields: [] },
				],
				fields: [
					{ name: 'field1', accessedBy: ['method1'] },
					{ name: 'field2', accessedBy: ['method2'] },
				],
			},
		];

		(extractClassInfo as jest.Mock).mockReturnValue(mockClasses);

		const violations = await metrics().lcom().lcom96b().shouldBeBelow(0.5).check();

		expect(violations.length).toBe(1);
		const violation = violations[0] as MetricViolation;
		expect(violation.className).toBe('ExampleClass');
		expect(violation.metricName).toBe('LCOM96b');
		expect(violation.comparison).toBe('below');
	});

	it('should not detect with shouldBeBelowOrEqual if we have equality', async () => {
		const mockClasses: ClassInfo[] = [
			{
				name: 'ExampleClass',
				filePath: '/path/to/highcohesion.ts',
				methods: [
					{ name: 'method1', accessedFields: [] },
					{ name: 'method2', accessedFields: [] },
				],
				fields: [
					{ name: 'field1', accessedBy: ['method1'] },
					{ name: 'field2', accessedBy: ['method2'] },
				],
			},
		];

		(extractClassInfo as jest.Mock).mockReturnValue(mockClasses);

		const violations = await metrics()
			.lcom()
			.lcom96b()
			.shouldBeBelowOrEqual(0.5)
			.check();

		expect(violations.length).toBe(0);
	});
});
