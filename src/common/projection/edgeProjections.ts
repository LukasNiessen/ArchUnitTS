import { MapFunction } from './projectEdges';

export const perInternalEdge = (): MapFunction => {
	return (edge) => {
		if (edge.external === false) {
			return { sourceLabel: edge.source, targetLabel: edge.target };
		}
	};
};

export const perEdge = (): MapFunction => {
	return (edge) => {
		return { sourceLabel: edge.source, targetLabel: edge.target };
	};
};
