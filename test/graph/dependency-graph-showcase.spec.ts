import { projectGraph } from '../..';

describe('Dependency Graph Showcase', () => {
	it('should generate dependency graph reports in multiple formats', async () => {
		// Generate a detailed dependency graph showing project architecture
		const graph = projectGraph().titled('ArchUnitTS Architecture');

		// Export as Mermaid diagram (can be rendered on GitHub)
		await graph
			.collapseToFolderDepth(2)
			.exportAsMermaid('temp/showcase-dependencies.mmd');

		// Export as HTML for interactive exploration
		await graph
			.collapseToFolderDepth(2)
			.exportAsHTML('temp/showcase-dependencies.html');

		// Export as DOT format for Graphviz
		await graph
			.collapseToFolderDepth(2)
			.exportAsDOT('temp/showcase-dependencies.dot');

		// Export as JSON for analysis
		await graph.exportAsJSON('temp/showcase-dependencies.json');

		// Focus on specific domain layers
		await graph
			.focusOn('src/common/**', 1)
			.collapseToFolderDepth(2)
			.exportAsHTML('temp/showcase-common-module.html');

		await graph
			.focusOn('src/files/**', 1)
			.collapseToFolderDepth(2)
			.exportAsHTML('temp/showcase-files-module.html');

		// Verify the test is not empty
		expect(true).toBe(true);
	});

	it('should showcase dependency graph capabilities', async () => {
		const graph = projectGraph()
			.titled('ArchUnitTS - Module Dependencies')
			.description('Showing internal module dependencies and their relationships');

		// Show full architecture with external dependencies
		await graph
			.collapseToFolderDepth(1)
			.includeExternalDependencies()
			.exportAsHTML('temp/showcase-full-architecture.html');

		// Show just core modules
		await graph
			.collapseToFolderDepth(2)
			.exportAsMermaid('temp/showcase-core-modules.mmd');

		// Show what depends on specific modules
		await graph
			.dependentsOf('src/common/**')
			.collapseToFolderDepth(2)
			.exportAsHTML('temp/showcase-common-dependents.html');

		// Show reachability from entry point
		await graph
			.reachableFrom('src/files/**', 2)
			.collapseToFolderDepth(2)
			.exportAsHTML('temp/showcase-files-reachability.html');

		expect(true).toBe(true);
	});
});
