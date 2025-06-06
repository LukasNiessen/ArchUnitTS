import { metrics } from '../..';

// This is a demonstration file that shows how to use the metrics API in your project
describe('Using LCOM metrics in your project', () => {
	it('check classes have good cohesion', async () => {
		// passes always since LCOM is max 1
		const rule = metrics().lcom().lcom96b().shouldBeBelowOrEqual(1);
		await expect(rule).toPassAsync();
	});
});
