import path from 'path';
import { metrics } from '../../src/metrics';
import '../../index';

describe('LCOM metrics project summary', () => {
	const mockProjectPath = path.join(__dirname, 'mock-project', 'tsconfig.json');

	it('should calculate project-wide LCOM metrics summary', async () => {
		// Get project summary for LCOM metrics
		const projectSummary = await metrics(mockProjectPath).lcom().summary();

		// Verify we have valid project metrics
		expect(projectSummary).toBeDefined();
		expect(projectSummary.totalClasses).toBeGreaterThan(0);

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
});
