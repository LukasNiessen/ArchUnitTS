import { matchingAllPatterns } from '../../common/util/regex-utils';
import { Violation } from '../../common/assertion/violation';
import { ProjectedNode } from '../../common/projection/project-nodes';
import {
	Pattern,
	EnhancedPattern,
	PatternMatchingOptions,
	matchesPattern,
	matchesAllPatterns as enhancedMatchesAllPatterns,
} from './pattern-matching';

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
 * @param patternOptions - Options for how to apply the pattern matching
 * @returns Array of violations found
 */
export const gatherRegexMatchingViolations = (
	files: ProjectedNode[],
	checkPattern: Pattern | EnhancedPattern,
	preconditionPatterns: string[],
	isNegated: boolean,
	patternOptions?: PatternMatchingOptions
): ViolatingNode[] => {
	const violations: ViolatingNode[] = [];

	// Use legacy matching for precondition patterns to maintain compatibility
	const filteredFiles = files.filter((node) =>
		matchingAllPatterns(node.label, preconditionPatterns)
	);

	filteredFiles.forEach((file) => {
		const matches = matchesPattern(file.label, checkPattern, patternOptions);
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
		return pattern.source;
	} else {
		// EnhancedPattern
		return getPatternString(pattern.pattern);
	}
}

/**
 * Legacy function for backward compatibility - uses partial path matching like before
 * @deprecated Use gatherRegexMatchingViolations with PatternMatchingOptions for better control
 */
export const gatherRegexMatchingViolationsLegacy = (
	files: ProjectedNode[],
	checkPattern: string,
	preconditionPatterns: string[],
	isNegated: boolean
): ViolatingNode[] => {
	return gatherRegexMatchingViolations(
		files,
		checkPattern,
		preconditionPatterns,
		isNegated,
		{ target: 'path', matching: 'partial' } // Legacy behavior: partial path matching
	);
};

/**
 * Enhanced pattern matching with filename-only exact matching (recommended for most use cases)
 *
 * @example
 * ```typescript
 * // Match files that start with "Service" (filename only)
 * gatherFilenamePatternViolations(files, /^Service.*\.ts$/, [], false)
 *
 * // Match files with exact name "Controller.ts"
 * gatherFilenamePatternViolations(files, "Controller.ts", [], false)
 * ```
 */
export const gatherFilenamePatternViolations = (
	files: ProjectedNode[],
	checkPattern: Pattern | EnhancedPattern,
	preconditionPatterns: string[],
	isNegated: boolean
): ViolatingNode[] => {
	return gatherRegexMatchingViolations(
		files,
		checkPattern,
		preconditionPatterns,
		isNegated,
		{ target: 'filename', matching: 'exact' }
	);
};

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
	isNegated: boolean
): ViolatingNode[] => {
	return gatherRegexMatchingViolations(
		files,
		checkPattern,
		preconditionPatterns,
		isNegated,
		{ target: 'path', matching: 'exact' }
	);
};
