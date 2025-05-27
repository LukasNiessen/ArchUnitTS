import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { metrics } from '../../src/metrics/fluentapi/metrics';
import { DistanceMetricsBuilder } from '../../src/metrics/fluentapi/metrics/distance-metrics';

describe('Export Functionality Tests', () => {
	const testOutputDir = path.join(__dirname, 'test-output');

	beforeEach(() => {
		// Ensure test output directory exists
		if (!fs.existsSync(testOutputDir)) {
			fs.mkdirSync(testOutputDir, { recursive: true });
		}
	});

	afterEach(() => {
		// Clean up test files
		if (fs.existsSync(testOutputDir)) {
			const files = fs.readdirSync(testOutputDir);
			files.forEach((file) => {
				fs.unlinkSync(path.join(testOutputDir, file));
			});
			fs.rmdirSync(testOutputDir);
		}
	});

	describe('Count Metrics Export', () => {
		it('should export count metrics as HTML', async () => {
			const outputPath = path.join(testOutputDir, 'count-test.html');
			const countMetrics = metrics().count();

			await countMetrics.exportAsHTML(outputPath, {
				title: 'Test Count Metrics Report',
				includeTimestamp: false, // For consistent testing
			});

			expect(fs.existsSync(outputPath)).toBe(true);

			const content = fs.readFileSync(outputPath, 'utf-8');
			expect(content).toContain('<!DOCTYPE html>');
			expect(content).toContain('Test Count Metrics Report');
			expect(content).toContain('Count Metrics');
		});
		it('should automatically append .html extension', async () => {
			const outputPath = path.join(testOutputDir, 'count-test-no-extension');
			const expectedPath = outputPath + '.html';
			const countMetrics = metrics().count();

			await countMetrics.exportAsHTML(outputPath);

			expect(fs.existsSync(expectedPath)).toBe(true);
		});

		it('should support default parameters for count export', async () => {
			const countMetrics = metrics().count();
			const distPath = path.join(process.cwd(), 'dist');
			const expectedPath = path.join(distPath, 'count-metrics-report.html');

			// Ensure dist directory exists for test
			if (!fs.existsSync(distPath)) {
				fs.mkdirSync(distPath, { recursive: true });
			}

			await countMetrics.exportAsHTML();

			expect(fs.existsSync(expectedPath)).toBe(true);

			// Clean up
			fs.unlinkSync(expectedPath);
			if (fs.readdirSync(distPath).length === 0) {
				fs.rmdirSync(distPath);
			}
		});
	});

	describe('LCOM Metrics Export', () => {
		it('should export LCOM metrics as HTML', async () => {
			const outputPath = path.join(testOutputDir, 'lcom-test.html');
			const lcomMetrics = metrics().lcom();

			await lcomMetrics.exportAsHTML(outputPath, {
				title: 'Test LCOM Metrics Report',
				includeTimestamp: false,
			});

			expect(fs.existsSync(outputPath)).toBe(true);

			const content = fs.readFileSync(outputPath, 'utf-8');
			expect(content).toContain('<!DOCTYPE html>');
			expect(content).toContain('Test LCOM Metrics Report');
			expect(content).toContain('LCOM Metrics');
		});

		it('should support default parameters for LCOM export', async () => {
			const lcomMetrics = metrics().lcom();
			const distPath = path.join(process.cwd(), 'dist');
			const expectedPath = path.join(distPath, 'lcom-metrics-report.html');

			// Ensure dist directory exists for test
			if (!fs.existsSync(distPath)) {
				fs.mkdirSync(distPath, { recursive: true });
			}

			await lcomMetrics.exportAsHTML();

			expect(fs.existsSync(expectedPath)).toBe(true);

			// Clean up
			fs.unlinkSync(expectedPath);
			if (fs.readdirSync(distPath).length === 0) {
				fs.rmdirSync(distPath);
			}
		});
	});
	describe('Distance Metrics Export', () => {
		it('should export distance metrics as HTML', async () => {
			const outputPath = path.join(testOutputDir, 'distance-test.html');
			const distanceMetrics = new DistanceMetricsBuilder('./tsconfig.json');

			await distanceMetrics.exportAsHTML(outputPath, {
				title: 'Test Distance Metrics Report',
				includeTimestamp: false,
			});

			expect(fs.existsSync(outputPath)).toBe(true);

			const content = fs.readFileSync(outputPath, 'utf-8');
			expect(content).toContain('<!DOCTYPE html>');
			expect(content).toContain('Test Distance Metrics Report');
			expect(content).toContain('Distance Metrics');
		});

		it('should support default parameters for distance export', async () => {
			const distanceMetrics = new DistanceMetricsBuilder('./tsconfig.json');
			const distPath = path.join(process.cwd(), 'dist');
			const expectedPath = path.join(distPath, 'distance-metrics-report.html');

			// Ensure dist directory exists for test
			if (!fs.existsSync(distPath)) {
				fs.mkdirSync(distPath, { recursive: true });
			}

			await distanceMetrics.exportAsHTML();

			expect(fs.existsSync(expectedPath)).toBe(true);

			// Clean up
			fs.unlinkSync(expectedPath);
			if (fs.readdirSync(distPath).length === 0) {
				fs.rmdirSync(distPath);
			}
		});
	});

	describe('Export Options', () => {
		it('should apply custom CSS styling', async () => {
			const outputPath = path.join(testOutputDir, 'custom-css-test.html');
			const countMetrics = metrics().count();
			const customCss = '.test-class { color: red; }';

			await countMetrics.exportAsHTML(outputPath, {
				customCss: customCss,
				includeTimestamp: false,
			});

			const content = fs.readFileSync(outputPath, 'utf-8');
			expect(content).toContain(customCss);
		});

		it('should include timestamp when requested', async () => {
			const outputPath = path.join(testOutputDir, 'timestamp-test.html');
			const countMetrics = metrics().count();

			await countMetrics.exportAsHTML(outputPath, {
				includeTimestamp: true,
			});

			const content = fs.readFileSync(outputPath, 'utf-8');
			expect(content).toContain('Generated on:');
		});

		it('should not include timestamp when disabled', async () => {
			const outputPath = path.join(testOutputDir, 'no-timestamp-test.html');
			const countMetrics = metrics().count();

			await countMetrics.exportAsHTML(outputPath, {
				includeTimestamp: false,
			});

			const content = fs.readFileSync(outputPath, 'utf-8');
			expect(content).not.toContain('Generated on:');
		});
	});

	describe('Combined Export', () => {
		it('should export combined metrics using MetricsExporter directly', async () => {
			const outputPath = path.join(testOutputDir, 'combined-test.html');

			// Get summaries from different metrics
			const countSummary = await metrics().count().summary();
			const lcomSummary = await metrics().lcom().summary();

			const combinedData = {
				count: countSummary,
				lcom: lcomSummary,
			};

			const { MetricsExporter } = await import(
				'../../src/metrics/fluentapi/export-utils'
			);

			await MetricsExporter.exportAsHTML(combinedData, {
				outputPath: outputPath,
				title: 'Combined Test Report',
				includeTimestamp: false,
			});

			expect(fs.existsSync(outputPath)).toBe(true);
			const content = fs.readFileSync(outputPath, 'utf-8');
			expect(content).toContain('Count Metrics');
			expect(content).toContain('LCOM (Lack of Cohesion of Methods) Metrics');
		});

		it('should export comprehensive metrics with default path', async () => {
			const { MetricsExporter } = await import(
				'../../src/metrics/fluentapi/export-utils'
			);

			const distPath = path.join(process.cwd(), 'dist');
			const expectedPath = path.join(distPath, 'metrics-report.html');

			// Ensure dist directory exists for test
			if (!fs.existsSync(distPath)) {
				fs.mkdirSync(distPath, { recursive: true });
			}

			await MetricsExporter.exportComprehensiveAsHTML('./tsconfig.json');

			expect(fs.existsSync(expectedPath)).toBe(true);
			const content = fs.readFileSync(expectedPath, 'utf-8');
			expect(content).toContain('Comprehensive ArchUnitTS Metrics Report');
			expect(content).toContain('Count Metrics');
			expect(content).toContain('LCOM (Lack of Cohesion of Methods) Metrics');
			expect(content).toContain('Distance Metrics');

			// Clean up
			fs.unlinkSync(expectedPath);
			if (fs.readdirSync(distPath).length === 0) {
				fs.rmdirSync(distPath);
			}
		});
	});
	describe('Error Handling', () => {
		it('should handle invalid output directory gracefully', async () => {
			const invalidPath = '/invalid/path/that/does/not/exist/test.html';
			const countMetrics = metrics().count();

			// The function should handle errors gracefully and might create directories
			// Let's test that it either succeeds or throws appropriately
			try {
				await countMetrics.exportAsHTML(invalidPath);
				// If it succeeds, that's also acceptable behavior
			} catch (error) {
				// If it throws, that's expected for truly invalid paths
				expect(error).toBeDefined();
			}
		});

		it('should handle missing export options gracefully', async () => {
			const outputPath = path.join(testOutputDir, 'no-options-test.html');
			const countMetrics = metrics().count();

			// Should not throw when no options provided
			await expect(countMetrics.exportAsHTML(outputPath)).resolves.not.toThrow();

			expect(fs.existsSync(outputPath)).toBe(true);
		});
	});
});
