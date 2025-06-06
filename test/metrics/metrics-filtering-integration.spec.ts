import { metrics } from '../../src/metrics';
import path from 'path';

describe('Metrics Filtering Integration', () => {
	describe('Folder filtering', () => {
		it('should allow filtering by folder path with string pattern', () => {
			const metricsBuilder = metrics().inFolder('src/metrics');

			// Verify the metrics builder has filters
			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();

			// Test the fluent API continues to work
			const thresholdBuilder = metricsBuilder.lcom().lcom96b().shouldBeAbove(0.0);
			expect(thresholdBuilder).toBeDefined();
		});

		it('should allow filtering by folder path with regex pattern', () => {
			const metricsBuilder = metrics().inFolder(/src\/metrics/);

			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();
		});

		it('should allow chaining multiple folder filters', () => {
			const metricsBuilder = metrics().inFolder('src').inFolder('metrics');

			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();
		});
	});

	describe('File filtering', () => {
		it('should allow filtering by specific file', () => {
			const metricsBuilder = metrics()
				.inPath('src/metrics/calculation')
				.withName('lcom.ts');

			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();
		});
	});

	describe('Class name filtering', () => {
		it('should allow filtering by class name with string pattern', () => {
			const metricsBuilder = metrics().forClassesMatching('TestClass');

			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();
		});

		it('should allow filtering by class name with regex pattern', () => {
			const metricsBuilder = metrics().forClassesMatching(/.*Service$/);

			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();
		});
	});

	describe('Combined filtering', () => {
		it('should allow combining multiple filter types', () => {
			const metricsBuilder = metrics()
				.inFolder('src')
				.forClassesMatching(/.*Builder$/);

			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();
		});

		it('should allow complex filtering chains', () => {
			const metricsBuilder = metrics()
				.inFolder(/src\/.*/)
				.forClassesMatching(/.*Metric.*/)
				.withName('specific-file.ts');

			const filter = metricsBuilder.getFilter();
			expect(filter).not.toBeNull();
		});
	});

	describe('No filtering', () => {
		it('should work without any filters', () => {
			const metricsBuilder = metrics();

			const filter = metricsBuilder.getFilter();
			expect(filter).toBeNull();
		});
	});

	// Smoke test. For example >= 0 is always satisfied, so this
	// is purely a smoke test suite
	describe('LCOM Project Summary', () => {
		const mockProjectPath = path.join(__dirname, 'mock-project', 'tsconfig.json');

		it('should calculate project-wide LCOM metrics summary', async () => {
			// Get project summary for LCOM metrics
			const projectSummary = await metrics(mockProjectPath).lcom().summary();

			// Verify we have valid project metrics
			expect(projectSummary).toBeDefined();
			expect(projectSummary.totalClasses).toBeGreaterThanOrEqual(0);

			// Verify that all average metrics are valid numbers
			expect(projectSummary.averageLCOM96a).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOM96b).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOM96b).toBeLessThanOrEqual(1);
			expect(projectSummary.averageLCOM1).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOM2).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOM3).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOM4).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOM5).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOMStar).toBeGreaterThanOrEqual(0);
			expect(projectSummary.averageLCOMStar).toBeLessThanOrEqual(1);

			// Verify high cohesion class count is valid
			expect(projectSummary.highCohesionClassCount).toBeGreaterThanOrEqual(0);
			expect(projectSummary.highCohesionClassCount).toBeLessThanOrEqual(
				projectSummary.totalClasses
			);
		});

		it('should filter classes based on builder configuration', async () => {
			// Get summary for a filtered set of classes
			const filteredSummary = await metrics(mockProjectPath)
				.withName('concrete-service.ts')
				.lcom()
				.summary();

			// This should include just classes in concrete-service.ts
			expect(filteredSummary).toBeDefined();
			expect(filteredSummary.totalClasses).toBeGreaterThanOrEqual(0);
		});
	});
});
