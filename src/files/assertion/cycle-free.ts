import { ProjectedEdge } from '../../common/projection/project-edges';
import { projectCycles } from '../../common/projection/project-cycles';
import { Violation } from '../../common/assertion/violation';
import { CheckLogger } from '../../common/util/logger';
import { CheckOptions } from '../../common/fluentapi/checkable';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { Filter } from '../../common/type';
import { matchesAllPatterns } from '../../common/pattern-matching';

export class ViolatingCycle implements Violation {
	public cycle: ProjectedEdge[];

	constructor(cycle: ProjectedEdge[]) {
		this.cycle = cycle;
	}
}

export const gatherCycleViolations = (
	projectedEdges: ProjectedEdge[],
	preconditionFilters: Filter[],
	options?: CheckOptions
): (ViolatingCycle | EmptyTestViolation)[] => {
	const logger = new CheckLogger(options?.logging);

	// Check for empty test if no edges match preconditions
	/**
	 * Important note. Empty checks are a very difficult topic for cycle free checks.
	 *
	 * Example: folder A has one file, but that file has only one dependency to folder B.
	 * So when we say .inFolder("A").should().haveNoCycles() we don't want to consider the file
	 * since we want to check for cycles inside of folder A only. But if we report an
	 * EmptyTest error, the users are puzzled as the folder has a file.
	 *
	 * So we go the non ideal way of just checking the unfiltered ones for being empty or not.
	 */
	if (projectedEdges.length === 0 && !options?.allowEmptyTests) {
		return [new EmptyTestViolation(preconditionFilters)];
	}

	const filteredEdges = projectedEdges.filter(
		(edge) =>
			// Exclude self-referencing edges (these are added for completeness but aren't considered cycles here)
			edge.sourceLabel !== edge.targetLabel &&
			matchesAllPatterns(edge.sourceLabel, preconditionFilters) &&
			matchesAllPatterns(edge.targetLabel, preconditionFilters)
	);
	filteredEdges.forEach((edge) =>
		logger.info(`Edge under check: From ${edge.sourceLabel} to ${edge.targetLabel}`)
	);

	const projectedCycles = projectCycles(filteredEdges);

	return projectedCycles.map((cycle) => new ViolatingCycle(cycle));
};
