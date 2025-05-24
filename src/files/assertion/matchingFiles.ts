import { matchingAllPatterns } from '../../common/util/regexUtils';
import { Violation } from '../../common/assertion/violation';
import { ProjectedNode } from '../../common/projection/projectNodes';

export class ViolatingNode implements Violation {
	public checkPattern: string;
	public projectedNode: ProjectedNode;

	constructor(checkPattern: string, projectedNode: ProjectedNode) {
		this.checkPattern = checkPattern;
		this.projectedNode = projectedNode;
	}
}

export const gatherRegexMatchingViolations = (
	files: ProjectedNode[],
	checkPattern: string,
	preconditionPatterns: string[],
	isNegated: boolean
): ViolatingNode[] => {
	const violations: ViolatingNode[] = [];

	const filteredFiles = files.filter((node) =>
		matchingAllPatterns(node.label, preconditionPatterns)
	);

	filteredFiles.forEach((file) => {
		const match = file.label.match(checkPattern);
		const violation = isNegated
			? checkNegativeViolation(match, file, checkPattern)
			: checkPositiveViolation(match, file, checkPattern);

		if (violation) {
			violations.push(violation);
		}
	});

	return violations;
};

const checkNegativeViolation = (
	match: RegExpMatchArray | null,
	file: ProjectedNode,
	pattern: string
): ViolatingNode | null => {
	return match && match.length > 0 ? new ViolatingNode(pattern, file) : null;
};

const checkPositiveViolation = (
	match: RegExpMatchArray | null,
	file: ProjectedNode,
	pattern: string
): ViolatingNode | null => {
	return !match || match.length === 0 ? new ViolatingNode(pattern, file) : null;
};
