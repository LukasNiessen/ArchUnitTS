import { matchingAllPatterns } from '../../common/util/regex-utils';
import { Violation } from '../../common/assertion/violation';
import { ProjectedNode } from '../../common/projection/project-nodes';
import { Pattern, EnhancedPattern, matchesPattern } from './pattern-matching';
import { ProjectedEdge } from '../../common/projection/project-edges';
import { CheckLogger } from '../../common/util/logger';
import { CheckOptions } from '../../common/fluentapi/checkable';

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
 * EmptyTestViolation represents a violation when no files are found that match the preconditions
 * This helps detect tests that don't actually test anything because they match no files
 */
export class EmptyTestViolation implements Violation {
	public patterns: (string | RegExp)[];
	public message: string;
	public isNegated: boolean;
	public dependency?: ProjectedEdge;

	constructor(
		patterns: (string | RegExp)[],
		customMessage?: string,
		isNegated = false
	) {
		this.patterns = patterns;
		this.message =
			customMessage || `No files found matching pattern(s): ${patterns.join(', ')}`;
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
	checkPattern: Pattern | EnhancedPattern,
	preconditionPatterns: (string | RegExp)[],
	isNegated: boolean,
	options?: CheckOptions
): (ViolatingNode | EmptyTestViolation)[] => {
	const logger = new CheckLogger(options?.logging);

	const violations: ViolatingNode[] = [];

	// Use matching for precondition patterns to maintain compatibility
	const filteredFiles = files.filter((node) =>
		matchingAllPatterns(node.label, preconditionPatterns)
	);
	filteredFiles.forEach((node) => logger.info(`File under check: ${node.label}`));

	// Check for empty test if no files match preconditions
	const allowEmptyTests = options?.allowEmptyTests || false;
	if (filteredFiles.length === 0 && !allowEmptyTests) {
		return [new EmptyTestViolation(preconditionPatterns)];
	}

	filteredFiles.forEach((file) => {
		const matches = matchesPattern(file.label, checkPattern);
		const violation = isNegated
			? checkNegativeViolation(matches, file, checkPattern)
			: checkPositiveViolation(matches, file, checkPattern);

		if (violation) {
			violations.push(violation);
		}
	});

	return violations;
};

const checkNegativeViolation = (
	matches: boolean,
	file: ProjectedNode,
	pattern: Pattern | EnhancedPattern
): ViolatingNode | null => {
	const patternString = getPatternString(pattern);
	return matches ? new ViolatingNode(patternString, file, true) : null;
};

const checkPositiveViolation = (
	matches: boolean,
	file: ProjectedNode,
	pattern: Pattern | EnhancedPattern
): ViolatingNode | null => {
	const patternString = getPatternString(pattern);
	return !matches ? new ViolatingNode(patternString, file, false) : null;
};

function getPatternString(pattern: Pattern | EnhancedPattern): string {
	if (typeof pattern === 'string') {
		return pattern;
	} else if (pattern instanceof RegExp) {
		// For display purposes, return the original regex source without double escaping
		const source = pattern.source;
		// Remove excessive escaping for common cases
		const result = source.replace(/\\\\(.)/g, '\\$1');
		return result;
	} else {
		// EnhancedPattern
		return getPatternString(pattern.pattern);
	}
}

/**
 * Enhanced pattern matching with full path exact matching
 *
 * @example
 * ```typescript
 * // Match files at exact path
 * gatherPathPatternViolations(files, "src/services/UserService.ts", [], false)
 *
 * // Match files in services folder with RegExp
 * gatherPathPatternViolations(files, /^src\/services\/.*\.ts$/, [], false)
 * ```
 */
export const gatherPathPatternViolations = (
	files: ProjectedNode[],
	checkPattern: Pattern | EnhancedPattern,
	preconditionPatterns: string[],
	isNegated: boolean,
	options?: CheckOptions
): (ViolatingNode | EmptyTestViolation)[] => {
	return gatherRegexMatchingViolations(
		files,
		checkPattern,
		preconditionPatterns,
		isNegated,
		options
	);
};
