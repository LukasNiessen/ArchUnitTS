import { Edge, Graph } from '../extraction/graph';
import { ArchIgnoreParser } from './archignore-parser';

/**
 * Filter graph edges based on .archignore patterns
 */
export class ArchIgnoreFilter {
	private parser: ArchIgnoreParser;

	constructor(parser: ArchIgnoreParser) {
		this.parser = parser;
	}

	/**
	 * Filter graph to exclude ignored files
	 * Removes any edges where source or target matches ignore patterns
	 */
	public filterGraph(graph: Graph): Graph {
		return graph.filter((edge) => {
			const sourceIgnored = this.parser.shouldIgnore(edge.source);
			const targetIgnored = this.parser.shouldIgnore(edge.target);

			// Keep edge only if neither source nor target is ignored
			return !sourceIgnored && !targetIgnored;
		});
	}

	/**
	 * Check if a single file should be ignored
	 */
	public shouldIgnore(filePath: string): boolean {
		return this.parser.shouldIgnore(filePath);
	}

	/**
	 * Get count of ignored files in graph
	 */
	public getIgnoredFileCount(graph: Graph): number {
		const ignoredFiles = new Set<string>();

		for (const edge of graph) {
			if (this.parser.shouldIgnore(edge.source)) {
				ignoredFiles.add(edge.source);
			}
			if (this.parser.shouldIgnore(edge.target)) {
				ignoredFiles.add(edge.target);
			}
		}

		return ignoredFiles.size;
	}

	/**
	 * Get list of ignored files in graph
	 */
	public getIgnoredFiles(graph: Graph): string[] {
		const ignoredFiles = new Set<string>();

		for (const edge of graph) {
			if (this.parser.shouldIgnore(edge.source)) {
				ignoredFiles.add(edge.source);
			}
			if (this.parser.shouldIgnore(edge.target)) {
				ignoredFiles.add(edge.target);
			}
		}

		return Array.from(ignoredFiles).sort();
	}
}
