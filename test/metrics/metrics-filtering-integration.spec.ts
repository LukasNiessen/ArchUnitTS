import { metrics } from '../../src/metrics/fluentapi/metrics';

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
			const metricsBuilder = metrics().inFile('src/metrics/calculation/lcom.ts');

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
				.inFile('specific-file.ts');

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
});
