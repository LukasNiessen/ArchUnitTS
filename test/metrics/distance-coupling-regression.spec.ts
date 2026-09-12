import path from 'path';
import { metrics } from '../../src/metrics';

describe('distance metric dependency coupling', () => {
	it('counts internal graph edges in project summaries', async () => {
		const tsConfigPath = path.join(
			__dirname,
			'distance-coupling-project',
			'tsconfig.json'
		);

		const summary = await metrics(tsConfigPath).distance().summary();

		expect(summary.totalFiles).toBe(2);
		expect(summary.averageCouplingFactor).toBe(1);
		expect(summary.averageInstability).toBe(0.5);
	});
});
