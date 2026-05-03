import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { projectGraph } from '../../src/graph';

describe('Graph report generation examples', () => {
	const outputDir = path.join(process.cwd(), 'reports', 'graph-examples');
	const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');

	it('generates graph reports for this repository in all supported formats', async () => {
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const fullGraph = projectGraph(tsConfigPath).titled(
			'ArchUnitTS Full Dependency Graph'
		);
		const collapsedGraph = projectGraph(tsConfigPath)
			.titled('ArchUnitTS Folder-Level Dependency Graph')
			.collapseToFolderDepth(2);
		const metricsFocus = projectGraph(tsConfigPath)
			.titled('ArchUnitTS Metrics Focus')
			.focusOn('src/metrics/**', 1);
		const graphFocus = projectGraph(tsConfigPath)
			.titled('ArchUnitTS Graph Module Focus')
			.focusOn('src/graph/**', 1);
		const graphReporterReachable = projectGraph(tsConfigPath)
			.titled('Dependencies Reachable From Graph Reporter')
			.reachableFrom('src/graph/graph-reporter.ts');
		const commonDependents = projectGraph(tsConfigPath)
			.titled('Dependents Of Common Utilities')
			.dependentsOf('src/common/**')
			.collapseToFolderDepth(2);

		await fullGraph.exportAsHTML(path.join(outputDir, 'full.html'));
		await fullGraph.exportAsMermaid(path.join(outputDir, 'full.mmd'));
		await fullGraph.exportAsDOT(path.join(outputDir, 'full.dot'));
		await fullGraph.exportAsD2(path.join(outputDir, 'full.d2'));
		await fullGraph.exportAsCSV(path.join(outputDir, 'full.csv'));
		await fullGraph.exportAsJSON(path.join(outputDir, 'full.json'));

		await collapsedGraph.exportAsHTML(
			path.join(outputDir, 'collapsed-depth-2.html')
		);
		await collapsedGraph.exportAsMermaid(
			path.join(outputDir, 'collapsed-depth-2.mmd')
		);
		await collapsedGraph.exportAsDOT(path.join(outputDir, 'collapsed-depth-2.dot'));

		await metricsFocus.exportAsHTML(path.join(outputDir, 'focus-metrics.html'));
		await metricsFocus.exportAsMermaid(path.join(outputDir, 'focus-metrics.mmd'));

		await graphFocus.exportAsHTML(path.join(outputDir, 'focus-graph.html'));
		await graphFocus.exportAsMermaid(path.join(outputDir, 'focus-graph.mmd'));

		await graphReporterReachable.exportAsHTML(
			path.join(outputDir, 'reachable-from-graph-reporter.html')
		);
		await graphReporterReachable.exportAsJSON(
			path.join(outputDir, 'reachable-from-graph-reporter.json')
		);

		await commonDependents.exportAsHTML(
			path.join(outputDir, 'dependents-of-common.html')
		);
		await commonDependents.exportAsMermaid(
			path.join(outputDir, 'dependents-of-common.mmd')
		);

		const expectedFiles = [
			'full.html',
			'full.mmd',
			'full.dot',
			'full.d2',
			'full.csv',
			'full.json',
			'collapsed-depth-2.html',
			'collapsed-depth-2.mmd',
			'collapsed-depth-2.dot',
			'focus-metrics.html',
			'focus-metrics.mmd',
			'focus-graph.html',
			'focus-graph.mmd',
			'reachable-from-graph-reporter.html',
			'reachable-from-graph-reporter.json',
			'dependents-of-common.html',
			'dependents-of-common.mmd',
		];

		for (const file of expectedFiles) {
			const outputPath = path.join(outputDir, file);
			expect(fs.existsSync(outputPath)).toBe(true);
			expect(fs.statSync(outputPath).size).toBeGreaterThan(0);
		}
	});
});
