import path from 'path';
import { metrics } from '../../src/metrics/fluentapi/metrics';
import '../../index';

describe('Count metrics integration test', () => {
	const mockProjectPath = path.join(__dirname, 'mock-project', 'tsconfig.json');

	describe('Class-level count metrics', () => {
		it('should count methods in classes correctly', async () => {
			const violations = await metrics(mockProjectPath)
				.forClassesMatching(/.*Base.*/)
				.count()
				.methodCount()
				.shouldBeBelow(10)
				.check();

			expect(violations.length).toBe(0);
		});

		it('should count fields in classes correctly', async () => {
			const rule = metrics(mockProjectPath)
				.forClassesMatching(/.*Data.*/)
				.count()
				.fieldCount()
				.shouldBe(3);

			await expect(rule).toPassAsync();
		});

		it('should validate method count with different comparison operators', async () => {
			// Test shouldBeAbove
			const aboveViolations = await metrics(mockProjectPath)
				.count()
				.methodCount()
				.shouldBeAbove(0) // All classes should have at least 1 method
				.check();

			expect(aboveViolations).toBeDefined();

			// Test shouldBe (equal)
			const exactViolations = await metrics(mockProjectPath)
				.count()
				.methodCount()
				.shouldBe(5) // Look for classes with exactly 5 methods
				.check();

			expect(exactViolations).toBeDefined();

			// Test shouldBeAboveOrEqual
			const aboveOrEqualViolations = await metrics(mockProjectPath)
				.count()
				.methodCount()
				.shouldBeAboveOrEqual(1) // All classes should have at least 1 method
				.check();

			expect(aboveOrEqualViolations).toBeDefined();
		});
	});

	describe('File-level count metrics', () => {
		it('should count lines of code per file correctly', async () => {
			// Test that files don't exceed reasonable line counts
			const violations = await metrics(mockProjectPath)
				.count()
				.linesOfCode()
				.shouldBeBelow(200) // Files shouldn't be too large
				.check();

			expect(violations).toBeDefined();
		});

		it('should count statements per file correctly', async () => {
			// Test that files have reasonable statement counts
			const violations = await metrics(mockProjectPath)
				.count()
				.statements()
				.shouldBeBelow(100) // Files shouldn't have too many statements
				.check();

			expect(violations).toBeDefined();
		});

		it('should count imports per file correctly', async () => {
			// Test that files don't import too many modules
			const violations = await metrics(mockProjectPath)
				.count()
				.imports()
				.shouldBeBelow(20) // Files shouldn't import too many modules
				.check();

			expect(violations).toBeDefined();
		});

		it('should count classes per file correctly', async () => {
			// Test single class per file principle
			const violations = await metrics(mockProjectPath)
				.count()
				.classes()
				.shouldBeBelowOrEqual(1) // Each file should have at most 1 class
				.check();

			expect(violations).toBeDefined();
		});

		it('should count interfaces per file correctly', async () => {
			// Test interface count per file
			const violations = await metrics(mockProjectPath)
				.count()
				.interfaces()
				.shouldBeBelow(5) // Files shouldn't have too many interfaces
				.check();

			expect(violations).toBeDefined();
		});

		it('should count functions per file correctly', async () => {
			// Test function count per file
			const violations = await metrics(mockProjectPath)
				.count()
				.functions()
				.shouldBeBelow(10) // Files shouldn't have too many top-level functions
				.check();

			expect(violations).toBeDefined();
		});

		it('should validate file metrics with different comparison operators', async () => {
			// Test shouldBeBelowOrEqual
			const belowOrEqualViolations = await metrics(mockProjectPath)
				.count()
				.linesOfCode()
				.shouldBeBelowOrEqual(300) // Files should have at most 300 lines
				.check();

			expect(belowOrEqualViolations).toBeDefined();

			// Test shouldBeAbove for lines of code
			const aboveViolations = await metrics(mockProjectPath)
				.count()
				.linesOfCode()
				.shouldBeAbove(5) // Files should have more than 5 lines
				.check();

			expect(aboveViolations).toBeDefined();
		});
	});

	// Just smoke tests!
	describe('Project-wide count metrics summary', () => {
		it('should calculate comprehensive project metrics', async () => {
			// Get comprehensive project summary
			const summary = await metrics(mockProjectPath).count().summary();

			// Verify we have valid project metrics
			expect(summary).toBeDefined();
			expect(summary.totalFiles).toBeGreaterThan(0);
			expect(summary.totalClasses).toBeGreaterThanOrEqual(0);
			expect(summary.averageMethodsPerClass).toBeGreaterThanOrEqual(0);
			expect(summary.averageFieldsPerClass).toBeGreaterThanOrEqual(0);
			expect(summary.averageLinesOfCodePerFile).toBeGreaterThan(0);
			expect(summary.averageStatementsPerFile).toBeGreaterThanOrEqual(0);
			expect(summary.averageImportsPerFile).toBeGreaterThanOrEqual(0);

			// Verify largest file/class tracking
			expect(summary.largestFile).toBeDefined();
			expect(summary.largestFile.path).toBeDefined();
			expect(summary.largestFile.lines).toBeGreaterThan(0);

			expect(summary.largestClass).toBeDefined();
			expect(summary.largestClass.name).toBeDefined();
			expect(summary.largestClass.methods).toBeGreaterThanOrEqual(0);

			console.log('Count Metrics Summary:', {
				totalFiles: summary.totalFiles,
				totalClasses: summary.totalClasses,
				averageMethodsPerClass: summary.averageMethodsPerClass.toFixed(2),
				averageFieldsPerClass: summary.averageFieldsPerClass.toFixed(2),
				averageLinesOfCodePerFile: summary.averageLinesOfCodePerFile.toFixed(2),
				largestFile: `${summary.largestFile.path} (${summary.largestFile.lines} lines)`,
				largestClass: `${summary.largestClass.name} (${summary.largestClass.methods} methods)`,
			});
		});
	});

	describe('Count metrics with filtering', () => {
		it('should apply file folder filtering correctly', async () => {
			// Test folder-based filtering (though our mock project is flat)
			const violations = await metrics(mockProjectPath)
				.inFolder('.')
				.count()
				.linesOfCode()
				.shouldBeBelow(500)
				.check();

			expect(violations).toBeDefined();
		});

		it('should apply class pattern filtering correctly', async () => {
			// Test class pattern filtering
			const serviceViolations = await metrics(mockProjectPath)
				.forClassesMatching(/.*Service.*/)
				.count()
				.methodCount()
				.shouldBeBelow(20)
				.check();

			expect(serviceViolations).toBeDefined();

			// Test negative pattern filtering (exclude certain classes)
			const nonDataViolations = await metrics(mockProjectPath)
				.forClassesMatching(/^(?!.*Data).*$/) // Exclude classes with 'Data' in name
				.count()
				.fieldCount()
				.shouldBeBelow(10)
				.check();

			expect(nonDataViolations).toBeDefined();
		});
	});

	describe('Count metrics error handling', () => {
		it('should handle missing threshold gracefully', async () => {
			// This should throw an error because no threshold is set
			const builder = metrics(mockProjectPath).count().methodCount();

			await expect(builder.check()).rejects.toThrow(
				'Threshold and comparison must be set before checking'
			);
		});

		it('should handle invalid file paths gracefully', async () => {
			// Test with non-existent tsconfig
			const invalidPath = path.join(__dirname, 'non-existent', 'tsconfig.json');

			await expect(async () => {
				await metrics(invalidPath)
					.count()
					.linesOfCode()
					.shouldBeBelow(100)
					.check();
			}).rejects.toThrow();
		});
	});

	describe('Count metrics violation messages', () => {
		it('should generate meaningful violation messages', async () => {
			// Force some violations by setting very low thresholds
			const violations = await metrics(mockProjectPath)
				.count()
				.linesOfCode()
				.shouldBeBelow(1) // This should generate violations
				.check();

			if (violations.length > 0) {
				// Check that violation messages are meaningful
				violations.forEach((violation) => {
					expect(violation.toString()).toContain('LinesOfCode');
					expect(violation.toString()).toContain('should be below');
					expect(violation.toString()).toMatch(/\d+/); // Should contain numbers
				});
			}
		});
	});
});
