import { matchingAllPatterns } from '../../common/util/regex-utils';
import { ProjectedEdge } from '../../common/projection/project-edges';
import { projectCycles } from '../../common/projection/project-cycles';
import { Violation } from '../../common/assertion/violation';

export class ViolatingCycle implements Violation {
	public cycle: ProjectedEdge[];
	// Note: For cycles, negation doesn't make sense
	// as we're only checking for presence of cycles
	public isNegated: boolean = false;

	constructor(cycle: ProjectedEdge[]) {
		this.cycle = cycle;
	}
}

export const gatherCycleViolations = (
	projectedEdges: ProjectedEdge[],
	preconditionPatterns: string[]
): ViolatingCycle[] => {
	const filteredEdges = projectedEdges.filter(
		(edge) =>
			matchingAllPatterns(edge.sourceLabel, preconditionPatterns) &&
			matchingAllPatterns(edge.targetLabel, preconditionPatterns)
	);

	const projectedCycles = projectCycles(filteredEdges);

	return projectedCycles.map((cycle) => new ViolatingCycle(cycle));
};
