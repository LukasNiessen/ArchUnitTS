import { Edge } from '../extraction/graph';

export type ProjectedEdge = {
	sourceLabel: string;
	targetLabel: string;
	cumulatedEdges: Edge[];
};

export type ProjectedGraph = ProjectedEdge[];

export type MappedEdge = { sourceLabel: string; targetLabel: string };

export type MapFunction = (edge: Edge) => MappedEdge | undefined;

export const projectEdges = (graph: Edge[], mapper: MapFunction): ProjectedEdge[] => {
	const builtGraph: ProjectedEdge[] = [];
	// Index by label pair: a linear find over builtGraph made projection
	// quadratic in the number of edges.
	const bySource = new Map<string, Map<string, ProjectedEdge>>();

	for (const edge of graph) {
		const mapped = mapper(edge);
		if (mapped === undefined) {
			continue;
		}

		let byTarget = bySource.get(mapped.sourceLabel);
		if (byTarget === undefined) {
			byTarget = new Map();
			bySource.set(mapped.sourceLabel, byTarget);
		}
		const matchingEdge = byTarget.get(mapped.targetLabel);

		if (matchingEdge) {
			matchingEdge.cumulatedEdges.push(edge);
		} else {
			const projected: ProjectedEdge = { ...mapped, cumulatedEdges: [edge] };
			byTarget.set(mapped.targetLabel, projected);
			builtGraph.push(projected);
		}
	}

	return builtGraph;
};
