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

	for (const edge of graph) {
		const mapped = mapper(edge);
		if (mapped === undefined) {
			continue;
		}

		const matchingEdge = builtGraph.find(
			(mappedEdge) =>
				mappedEdge.sourceLabel === mapped.sourceLabel &&
				mappedEdge.targetLabel === mapped.targetLabel
		);

		if (matchingEdge) {
			matchingEdge.cumulatedEdges.push(edge);
		} else {
			builtGraph.push({ ...mapped, cumulatedEdges: [edge] });
		}
	}

	return builtGraph;
};
