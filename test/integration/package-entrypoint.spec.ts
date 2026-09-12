import { metrics } from '../../index';

describe('package entry point', () => {
	it('runs file count metrics without an explicit tsconfig path', async () => {
		const violations = await metrics()
			.count()
			.linesOfCode()
			.shouldBeBelow(100_000)
			.check();

		expect(violations).toEqual([]);
	});
});
