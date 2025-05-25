import { matchingAllPatterns } from '../../common/util/regex-utils';
import { UserError } from '../../common/error/errors';
import { Violation } from '../../common/assertion/violation';
import { ProjectedEdge } from '../../common/projection/project-edges';

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
	objectPatterns: string[],
	subjectPatterns: string[],
	isNegated: boolean
): ViolatingFileDependency[] => {
	if (objectPatterns.length === 0 && subjectPatterns.length === 0) {
		throw new UserError('object and subject patterns must be set');
	}

	if (isNegated) {
		const filteredEdges = projectedEdges.filter(
			(edge) =>
				matchingAllPatterns(edge.sourceLabel, objectPatterns) &&
				matchingAllPatterns(edge.targetLabel, subjectPatterns)
		);
		return filteredEdges.map((edge) => new ViolatingFileDependency(edge, true));
	} else {
		const filteredEdges = projectedEdges.filter(
			(edge) =>
				!matchingAllPatterns(edge.sourceLabel, objectPatterns) ||
				!matchingAllPatterns(edge.targetLabel, subjectPatterns)
		);
		return filteredEdges.map((edge) => new ViolatingFileDependency(edge, false));
	}
};
