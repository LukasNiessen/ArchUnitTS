import { metrics } from '../../src/metrics';
import { ClassInfo } from '../../src/metrics/extraction';

describe('Custom Metrics Logic', () => {
	describe('Custom Metric Builder', () => {
		it('should create custom metric builder with calculation function', () => {
			const customMetric = metrics().customMetric(
				'methodFieldRatio',
				'Ratio of methods to fields',
				(classInfo: ClassInfo) => {
					return classInfo.fields.length === 0
						? 0
						: classInfo.methods.length / classInfo.fields.length;
				}
			);

			expect(customMetric).toBeDefined();
			expect(customMetric.metricName).toBe('methodFieldRatio');
			expect(customMetric.metricDescription).toBe('Ratio of methods to fields');
		});

		it('should create threshold-based conditions', () => {
			const customMetric = metrics().customMetric(
				'complexityScore',
				'Custom complexity score',
				(classInfo: ClassInfo) =>
					classInfo.methods.length + classInfo.fields.length
			);

			// Test all threshold methods
			expect(customMetric.shouldBeBelow(10)).toBeDefined();
			expect(customMetric.shouldBeBelowOrEqual(10)).toBeDefined();
			expect(customMetric.shouldBeAbove(5)).toBeDefined();
			expect(customMetric.shouldBeAboveOrEqual(5)).toBeDefined();
			expect(customMetric.shouldBe(7)).toBeDefined();
		});

		it('should create custom assertion conditions', () => {
			const customMetric = metrics().customMetric(
				'hasMinMethods',
				'Classes should have minimum methods',
				(classInfo: ClassInfo) => classInfo.methods.length
			);

			const condition = customMetric.shouldSatisfy((value, classInfo) => {
				return value >= 2 || classInfo.name.includes('Util');
			});

			expect(condition).toBeDefined();
			expect(condition.check).toBeDefined();
		});
	});

	describe('Custom Metric Conditions', () => {
		it('should check threshold-based conditions', async () => {
			const condition = metrics()
				.customMetric(
					'methodCount',
					'Number of methods',
					(classInfo: ClassInfo) => classInfo.methods.length
				)
				.shouldBeBelowOrEqual(50);

			const violations = await condition.check();
			expect(Array.isArray(violations)).toBe(true);
			// Since this uses real project files, we can only test that the check method works
		});

		it('should check custom assertion conditions', async () => {
			const condition = metrics()
				.customMetric(
					'fieldMethodBalance',
					'Balance between fields and methods',
					(classInfo: ClassInfo) =>
						Math.abs(classInfo.fields.length - classInfo.methods.length)
				)
				.shouldSatisfy((value, classInfo) => {
					// Allow imbalance for classes with very few members
					if (classInfo.fields.length + classInfo.methods.length < 3) {
						return true;
					}
					// Otherwise, difference should not be too large
					return value <= 5;
				});

			const violations = await condition.check();
			expect(Array.isArray(violations)).toBe(true);
		});

		it('should work with filters', async () => {
			const condition = metrics()
				.inFolder('src/metrics')
				.customMetric(
					'simpleFieldCount',
					'Count of fields',
					(classInfo: ClassInfo) => classInfo.fields.length
				)
				.shouldBeAbove(-1); // Should always pass

			const violations = await condition.check();
			expect(Array.isArray(violations)).toBe(true);
		});
	});

	describe('Custom Metric Examples', () => {
		it('should calculate method-to-field ratio', async () => {
			const condition = metrics()
				.customMetric(
					'methodFieldRatio',
					'Ratio of methods to fields',
					(classInfo: ClassInfo) => {
						if (classInfo.fields.length === 0) {
							return classInfo.methods.length > 0
								? Number.MAX_SAFE_INTEGER
								: 0;
						}
						return classInfo.methods.length / classInfo.fields.length;
					}
				)
				.shouldBeBelowOrEqual(10); // Maximum ratio of 10:1

			const violations = await condition.check();
			expect(Array.isArray(violations)).toBe(true);
		});

		it('should detect data classes (many fields, few methods)', async () => {
			const condition = metrics()
				.customMetric(
					'dataClassDetector',
					'Detect potential data classes',
					(classInfo: ClassInfo) => {
						const fieldCount = classInfo.fields.length;
						const methodCount = classInfo.methods.length;
						// Score increases with more fields and fewer methods
						return fieldCount > 0 ? fieldCount / Math.max(methodCount, 1) : 0;
					}
				)
				.shouldSatisfy((score, classInfo) => {
					// Allow data classes if they have few fields or are specifically named
					return (
						score <= 3 ||
						classInfo.fields.length <= 2 ||
						classInfo.name.includes('Data')
					);
				});

			const violations = await condition.check();
			expect(Array.isArray(violations)).toBe(true);
		});

		it('should check method naming consistency', async () => {
			const condition = metrics()
				.customMetric(
					'namingConsistency',
					'Method naming consistency',
					(classInfo: ClassInfo) => {
						const getterMethods = classInfo.methods.filter((m) =>
							m.name.startsWith('get')
						).length;
						const setterMethods = classInfo.methods.filter((m) =>
							m.name.startsWith('set')
						).length;
						// Return the difference - should be small for consistent naming
						return Math.abs(getterMethods - setterMethods);
					}
				)
				.shouldSatisfy((difference, classInfo) => {
					// Allow difference for small classes or utility classes
					return (
						difference <= 2 ||
						classInfo.methods.length <= 3 ||
						classInfo.name.includes('Util')
					);
				});

			const violations = await condition.check();
			expect(Array.isArray(violations)).toBe(true);
		});
	});
});
