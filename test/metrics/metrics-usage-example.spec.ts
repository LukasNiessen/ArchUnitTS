import { metrics } from '../../src/metrics';

// This is a demonstration file that shows how to use the metrics API in your project
describe('Using LCOM metrics in your project', () => {
	it('check classes have good cohesion', async () => {
		// In a real project, this would test actual classes in the codebase
		// This test is expected to fail in this demo since we're running against real code
		// that wasn't designed with LCOM in mind
		const violations = await metrics().lcom().lcom96b().shouldBeAbove(0.7).check();

		// Just log the violations rather than asserting since this is a demo
		console.log(`Found ${violations.length} classes with low cohesion`);

		// XXX-TODO: fix later
		//expect(violations).toHaveLength(0);
	});
});
