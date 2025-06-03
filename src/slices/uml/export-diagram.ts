import { ProjectedGraph } from '../../common/projection';

export const exportDiagram = (graph: ProjectedGraph): string => {
	let output = '@startuml\n';

	// Extract all unique vertices from edges
	const vertices = new Set<string>(
		graph.flatMap((edge) => [edge.sourceLabel, edge.targetLabel])
	);

	// Add component declarations
	for (const vertex of vertices.values()) {
		output += `component [${vertex}]\n`;
	}

	// Add relationships between components, excluding self-referencing edges
	for (const edge of graph) {
		if (edge.sourceLabel !== edge.targetLabel) {
			output += `[${edge.sourceLabel}] --> [${edge.targetLabel}]\n`;
		}
	}

	output += '@enduml';
	return output;
};
