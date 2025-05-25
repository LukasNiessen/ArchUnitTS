import { Edge } from '../extraction/graph';

export type ProjectedNode = {
	label: string;
	incoming: Edge[];
	outgoing: Edge[];
};

export interface ProjectionOptions {
	includeExternals?: boolean;
}

export const projectToNodes = (
	graph: Edge[],
	options: ProjectionOptions = {}
): ProjectedNode[] => {
	const filteredGraph = options.includeExternals
		? graph
		: graph.filter((e) => !e.external);

	// Get unique file names from both sources and targets
	const uniqueFiles = new Set([
		...filteredGraph.map((edge) => edge.target),
		...filteredGraph.map((edge) => edge.source),
	]);

	// Transform to projected nodes with incoming and outgoing edges
	return Array.from(uniqueFiles).map((fileName) => ({
		label: fileName,
		incoming: filteredGraph.filter((edge) => edge.target === fileName),
		outgoing: filteredGraph.filter((edge) => edge.source === fileName),
	}));
};
