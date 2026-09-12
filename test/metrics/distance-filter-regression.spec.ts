import fs from 'fs';
import os from 'os';
import path from 'path';
import { metrics } from '../../src/metrics';

describe('distance metric filters', () => {
	const projectDirectory = path.join(__dirname, 'distance-filter-project');
	const tsConfigPath = path.join(projectDirectory, 'tsconfig.json');
	const libPattern = 'test/metrics/distance-filter-project/src/lib/**';

	it('applies an inherited folder filter to summaries', async () => {
		const summary = await metrics(tsConfigPath)
			.inFolder(libPattern)
			.distance()
			.summary();

		expect(summary.totalFiles).toBe(1);
	});

	it('uses the filtered summary in HTML exports', async () => {
		const outputDirectory = fs.mkdtempSync(
			path.join(os.tmpdir(), 'archunit-distance-filter-')
		);
		const outputPath = path.join(outputDirectory, 'distance.html');

		try {
			await metrics(tsConfigPath)
				.inFolder(libPattern)
				.distance()
				.exportAsHTML(outputPath, { includeTimestamp: false });

			const html = fs.readFileSync(outputPath, 'utf8');
			expect(html).toMatch(
				/<h3>📁 Total Files<\/h3>\s*<div class="metric-value">1<\/div>/
			);
		} finally {
			fs.rmSync(outputDirectory, { recursive: true, force: true });
		}
	});
});
