import { Violation, EmptyTestViolation } from '../../common/assertion';
import { ProjectedNode } from '../../common/projection';
import { sharedLogger } from '../../common/util';
import { CheckOptions } from '../../common/fluentapi';
import { Filter } from '../../common';
import { getPatternString } from '../../common/regex-factory';
import { matchesAllPatterns, matchesPattern } from '../../common/pattern-matching';

export class ViolatingNode implements Violation {
	public checkPattern: string;
	public projectedNode: ProjectedNode;
	public isNegated: boolean;

	constructor(
		checkPattern: string,
		projectedNode: ProjectedNode,
		isNegated: boolean = false
	) {
		this.checkPattern = checkPattern;
		this.projectedNode = projectedNode;
		this.isNegated = isNegated;
	}
}

/**
 * Gather violations for regex pattern matching with enhanced pattern support
 *
 * @param files - Files to check
 * @param checkPattern - Pattern to match files against (can be string, RegExp, or EnhancedPattern)
 * @param preconditionPatterns - Patterns that files must match to be included in the check
 * @param isNegated - Whether this is a negative assertion (files should NOT match)
 * @param allowEmptyTests - Whether to allow empty tests (no violations for empty file sets)
 * @returns Array of violations found
 */
export const gatherRegexMatchingViolations = (
	files: ProjectedNode[],
	filter: Filter,
	preconditionFilters: Filter[],
	isNegated: boolean,
	options?: CheckOptions
): (ViolatingNode | EmptyTestViolation)[] => {
	const violations: ViolatingNode[] = [];

	// Use matching for precondition patterns to maintain compatibility
	const filteredFiles = files.filter((node) =>
		matchesAllPatterns(node.label, preconditionFilters)
	);

	// Check for empty test if no files match preconditions
	const allowEmptyTests = options?.allowEmptyTests || false;
	if (filteredFiles.length === 0 && !allowEmptyTests) {
		return [new EmptyTestViolation(preconditionFilters)];
	}

	filteredFiles.forEach((node) =>
		sharedLogger.info(options?.logging, `File under check: ${node.label}`)
	);

	filteredFiles.forEach((file) => {
		const matches = matchesPattern(file.label, filter);
		const violation = isNegated
			? checkNegativeViolation(matches, file, filter.regExp)
			: checkPositiveViolation(matches, file, filter.regExp);

		if (violation) {
			violations.push(violation);
		}
	});

	return violations;
};

const checkNegativeViolation = (
	matches: boolean,
	file: ProjectedNode,
	pattern: RegExp
): ViolatingNode | null => {
	const patternString = getPatternString(pattern);
	return matches ? new ViolatingNode(patternString, file, true) : null;
};

const checkPositiveViolation = (
	matches: boolean,
	file: ProjectedNode,
	pattern: RegExp
): ViolatingNode | null => {
	const patternString = getPatternString(pattern);
	return !matches ? new ViolatingNode(patternString, file, false) : null;
};
