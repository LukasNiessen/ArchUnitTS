import { matchingAllPatterns } from '../../common/util/regex-utils';
import { ProjectedEdge } from '../../common/projection/project-edges';
import { projectCycles } from '../../common/projection/project-cycles';
import { Violation } from '../../common/assertion/violation';
import { CheckLogger } from '../../common/util/logger';
import { CheckOptions } from '../../common/fluentapi/checkable';

export class ViolatingCycle implements Violation {
	public cycle: ProjectedEdge[];

	constructor(cycle: ProjectedEdge[]) {
		this.cycle = cycle;
	}
}

export const gatherCycleViolations = (
	projectedEdges: ProjectedEdge[],
	preconditionPatterns: (string | RegExp)[],
	options?: CheckOptions
): ViolatingCycle[] => {
	const logger = new CheckLogger(options?.logging);

	const filteredEdges = projectedEdges.filter(
		(edge) =>
			// Exclude self-referencing edges (these are added for completeness but aren't real cycles)
			edge.sourceLabel !== edge.targetLabel &&
			matchingAllPatterns(edge.sourceLabel, preconditionPatterns) &&
			matchingAllPatterns(edge.targetLabel, preconditionPatterns)
	);
	filteredEdges.forEach((edge) =>
		logger.info(`Edge under check: From ${edge.sourceLabel} to ${edge.targetLabel}`)
	);

	const projectedCycles = projectCycles(filteredEdges);

	return projectedCycles.map((cycle) => new ViolatingCycle(cycle));
};
