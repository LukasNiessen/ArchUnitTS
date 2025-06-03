import { UserError } from '../../common/error/errors';
import { Violation } from '../../common/assertion/violation';
import { ProjectedEdge } from '../../common/projection/project-edges';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { matchesAllPatterns } from './pattern-matching';
import { Filter } from '../../common/type';

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
	objectPatterns: Filter[],
	subjectPatterns: Filter[],
	isNegated: boolean,
	allowEmptyTests: boolean = false
): (ViolatingFileDependency | EmptyTestViolation)[] => {
	if (objectPatterns.length === 0 && subjectPatterns.length === 0) {
		throw new UserError('object and subject patterns must be set');
	}

	// empty check
	const edgesInSource = projectedEdges.filter((edge) =>
		matchesAllPatterns(edge.sourceLabel, objectPatterns)
	);
	if (edgesInSource.length === 0 && !allowEmptyTests) {
		return [new EmptyTestViolation(objectPatterns)];
	}

	const edgesInTarget = projectedEdges.filter((edge) =>
		matchesAllPatterns(edge.targetLabel, subjectPatterns)
	);
	if (edgesInTarget.length === 0 && !allowEmptyTests) {
		return [new EmptyTestViolation(subjectPatterns)];
	}

	const violatingEdgesFilter = isNegated
		? (edge: ProjectedEdge) => {
				return edgesInSource.includes(edge) && edgesInTarget.includes(edge);
			}
		: (edge: ProjectedEdge) => {
				return !edgesInSource.includes(edge) || !edgesInTarget.includes(edge);
			};

	return projectedEdges
		.filter(violatingEdgesFilter)
		.map((edge) => new ViolatingFileDependency(edge, isNegated));
};
