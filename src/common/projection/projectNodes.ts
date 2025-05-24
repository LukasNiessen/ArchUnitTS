import { Edge } from '../extraction/graph';

export type ProjectedNode = {
	// TODO this should have a list of incoming and outgoing edges
	label: string;
};

export const projectToNodes = (graph: Edge[]): ProjectedNode[] => {
	// TODO only internal files are relevant for this projection. maybe it still should be configurable
	const internalGraph = graph.filter((e) => !e.external);

	// Get unique file names from both sources and targets
	const uniqueFiles = new Set([
		...internalGraph.map((edge) => edge.target),
		...internalGraph.map((edge) => edge.source),
	]);

	// Transform to projected nodes
	return Array.from(uniqueFiles).map((fileName) => ({ label: fileName }));
};
