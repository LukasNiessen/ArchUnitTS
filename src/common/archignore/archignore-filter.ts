import { ArchIgnoreParser } from './archignore-parser';

interface EdgeLike {
	source: string;
	target: string;
	external?: boolean;
	importKinds?: unknown[];
}

/**
 * Filter edges/graph based on .archignore patterns
 */
export class ArchIgnoreFilter {
	private parser: ArchIgnoreParser;

	constructor(parser: ArchIgnoreParser) {
		this.parser = parser;
	}

	/**
	 * Filter edges to exclude ignored files
	 * Removes any edges where source or target matches ignore patterns
	 */
	public filterGraph<T extends EdgeLike>(edges: T[]): T[] {
		return edges.filter((edge) => {
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
	 * Get count of ignored files in edges
	 */
	public getIgnoredFileCount(edges: EdgeLike[]): number {
		const ignoredFiles = new Set<string>();

		for (const edge of edges) {
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
	 * Get list of ignored files in edges
	 */
	public getIgnoredFiles(edges: EdgeLike[]): string[] {
		const ignoredFiles = new Set<string>();

		for (const edge of edges) {
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
