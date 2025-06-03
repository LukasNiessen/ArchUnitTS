import path from 'path';
import { metrics } from '../../src/metrics';
import '../../index';

describe('LCOM metrics project summary', () => {
	const mockProjectPath = path.join(__dirname, 'mock-project', 'tsconfig.json');

	describe('Project-wide LCOM metrics', () => {
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
				.inFile('concrete-service.ts')
				.lcom()
				.summary();

			// This should include just classes in concrete-service.ts
			expect(filteredSummary).toBeDefined();
			expect(filteredSummary.totalClasses).toBeGreaterThanOrEqual(0);
		});
	});
});
