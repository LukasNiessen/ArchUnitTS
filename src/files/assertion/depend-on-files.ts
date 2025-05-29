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
