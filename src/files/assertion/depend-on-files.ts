import { matchingAllPatterns } from '../../common/util/regex-utils';
import { UserError } from '../../common/error/errors';
import { Violation } from '../../common/assertion/violation';
import { ProjectedEdge } from '../../common/projection/project-edges';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { Pattern } from './pattern-matching';

export class ViolatingFileDependency implements Violation {
	public dependency: ProjectedEdge;
	public isNegated: boolean;

	constructor(dependency: ProjectedEdge, isNegated: boolean = false) {
		this.dependency = dependency;
		this.isNegated = isNegated;
	}
}

export const gatherDependOnFileViolations = (
	projectedEdges: ProjectedEdge[],
	objectPatterns: Pattern[],
	subjectPatterns: string[],
	isNegated: boolean,
	allowEmptyTests: boolean = false
): (ViolatingFileDependency | EmptyTestViolation)[] => {
	if (objectPatterns.length === 0 && subjectPatterns.length === 0) {
		throw new UserError('object and subject patterns must be set');
	}

	// empty check
	const edgesInSource = projectedEdges.filter((edge) =>
		matchingAllPatterns(edge.sourceLabel, objectPatterns)
	);
	const edgesInTarget = projectedEdges.filter((edge) =>
		matchingAllPatterns(edge.targetLabel, subjectPatterns)
	);
	const empty = edgesInSource.length === 0 || edgesInTarget.length === 0;

	if (empty && !allowEmptyTests) {
		return [new EmptyTestViolation([...objectPatterns, ...subjectPatterns])];
	}

	const violatingEdgesFilter = isNegated
		? (edge: ProjectedEdge) => {
				const sourceMatches = matchingAllPatterns(
					edge.sourceLabel,
					objectPatterns
				);
				const targetMatches = matchingAllPatterns(
					edge.targetLabel,
					subjectPatterns
				);
				return sourceMatches && targetMatches;
			}
		: (edge: ProjectedEdge) => {
				const sourceMatches = matchingAllPatterns(
					edge.sourceLabel,
					objectPatterns
				);
				const targetMatches = matchingAllPatterns(
					edge.targetLabel,
					subjectPatterns
				);
				return !sourceMatches || !targetMatches;
			};

	return projectedEdges
		.filter(violatingEdgesFilter)
		.map((edge) => new ViolatingFileDependency(edge, isNegated));
};
