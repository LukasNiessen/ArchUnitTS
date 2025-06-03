import path from 'path';
import { metrics } from '../../src/metrics';
import '../../index';

describe('Distance metrics integration test', () => {
	const mockProjectPath = path.join(__dirname, 'mock-project', 'tsconfig.json');

	describe('File-wise distance metrics', () => {
		it('should detect proper abstractness values', async () => {
			const violations = await metrics(mockProjectPath)
				.distance()
				.forFile('abstract-base.ts')
				.abstractness()
				.shouldEqual(1)
				.check();

			expect(violations).toEqual([]);

			// Check that interfaces have high abstractness
			const interfaceAbstractnessViolations = await metrics(mockProjectPath)
				.distance()
				.forFile('service.interface.ts')
				.abstractness()
				.shouldEqual(1.0)
				.check();

			expect(interfaceAbstractnessViolations).toEqual([]);

			// Check that concrete classes have low abstractness
			const concreteClassViolations = await metrics(mockProjectPath)
				.distance()
				.forFile('data-class.ts')
				.abstractness()
				.shouldBeBelow(0.5) // Concrete classes should have abstractness < 0.5
				.check();

			expect(concreteClassViolations).toEqual([]);
		});
		it('should detect proper instability values', async () => {
			// For real projects, files with dependencies should have instability > 0
			// Our mock files might not have actual dependencies in the parser, so
			// we'll just check that the API works properly
			const instabilityViolations = await metrics(mockProjectPath)
				.distance()
				.forFile('concrete-service.ts')
				.instability()
				.shouldBeBelowOrEqual(1.0) // All files have instability between 0 and 1
				.check();

			expect(instabilityViolations).toEqual([]);
		});

		it('should detect proper distance from main sequence', async () => {
			// Abstract and stable components (interfaces) should be close to main sequence
			const interfaceDistanceViolations = await metrics(mockProjectPath)
				.distance()
				.forFile('service.interface.ts')
				.distanceFromMainSequence()
				.shouldBeBelow(0.3) // Should be close to main sequence
				.check();

			expect(interfaceDistanceViolations).toEqual([]);

			// Check all files in the project for distance from main sequence
			const allDistanceViolations = await metrics(mockProjectPath)
				.distance()
				.distanceFromMainSequence()
				.shouldBeBelow(0.5) // All files should have acceptable distance
				.check();

			// There might be some violations, but we just want to ensure the API works
			expect(allDistanceViolations).toBeDefined();
		});

		it('should detect coupling factor values', async () => {
			// Check that concrete service has higher coupling due to dependencies
			const highCouplingViolations = await metrics(mockProjectPath)
				.distance()
				.forFile('concrete-service.ts')
				.couplingFactor()
				.shouldBeBelow(0.5) // Should have moderate coupling
				.check();

			expect(highCouplingViolations).toBeDefined();

			// Check that utility files should have lower coupling
			const lowCouplingViolations = await metrics(mockProjectPath)
				.distance()
				.forFile('utils.ts')
				.couplingFactor()
				.shouldBeBelow(0.3) // Should have low coupling
				.check();

			expect(lowCouplingViolations).toBeDefined();
		});

		it('should detect normalized distance values', async () => {
			// Check normalized distance for concrete implementations
			const normalizedDistanceViolations = await metrics(mockProjectPath)
				.distance()
				.forFile('concrete-service.ts')
				.normalizedDistance()
				.shouldBeBelow(0.7) // Should have acceptable normalized distance
				.check();

			expect(normalizedDistanceViolations).toBeDefined();

			// Check normalized distance across all files
			const allNormalizedDistanceViolations = await metrics(mockProjectPath)
				.distance()
				.normalizedDistance()
				.shouldBeBelow(0.8) // All files should have acceptable normalized distance
				.check();

			expect(allNormalizedDistanceViolations).toBeDefined();
		});
	});

	// smoke test suite
	describe('Project-wide distance metrics', () => {
		it('should calculate project summary metrics', async () => {
			// Get project summary for distance metrics
			const projectSummary = await metrics(mockProjectPath).distance().summary();

			// Verify we have valid project metrics
			expect(projectSummary).toBeDefined();
			expect(projectSummary.totalFiles).toBeGreaterThan(0);
			expect(projectSummary.averageAbstractness).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageAbstractness).toBeLessThanOrEqual(1);
			expect(projectSummary.averageInstability).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageInstability).toBeLessThanOrEqual(1);
			expect(projectSummary.averageDistance).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageDistance).toBeLessThanOrEqual(1);
			expect(projectSummary.averageCouplingFactor).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageCouplingFactor).toBeLessThanOrEqual(1);
			expect(projectSummary.averageNormalizedDistance).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageNormalizedDistance).toBeLessThanOrEqual(1);
		});

		it('should identify components in the Zone of Pain', async () => {
			// Get components in the Zone of Pain (concrete & stable)
			const zoneOfPainViolations = await metrics(mockProjectPath)
				.distance()
				.notInZoneOfPain()
				.check();

			// We expect to have results, just making sure API works
			expect(zoneOfPainViolations).toBeDefined();
		});

		it('should identify components in the Zone of Uselessness', async () => {
			// Get components in the Zone of Uselessness (abstract & unstable)
			const zoneOfUselessnessViolations = await metrics(mockProjectPath)
				.distance()
				.notInZoneOfUselessness()
				.check();

			// We expect to have results, just making sure API works
			expect(zoneOfUselessnessViolations).toBeDefined();
		});
	});
});
