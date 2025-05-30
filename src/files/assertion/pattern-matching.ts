import { ProjectedNode } from '../../common/projection/project-nodes';

/**
 * Pattern matching configuration for file checks
 */
export interface PatternMatchingOptions {
	/**
	 * Whether to match against filename only or full relative path
	 * - 'filename': Only match against the filename (e.g., 'Service.ts' from 'src/services/Service.ts')
	 * - 'path': Match against the full relative path (e.g., 'src/services/Service.ts')
	 * @default 'filename'
	 */
	target?: 'filename' | 'path';

	/**
	 * Whether to require the pattern to match the entire string or allow partial matches
	 * - 'exact': Pattern must match the entire target string
	 * - 'partial': Pattern can match any part of the target string
	 * @default 'exact'
	 */
	matching?: 'exact' | 'partial';
}

const patternDefaultOptions: PatternMatchingOptions = {
	target: 'filename',
	matching: 'exact',
};

/**
 * Pattern types supported by the matching system
 */
export type Pattern = string | RegExp;

/**
 * Enhanced pattern matching configuration
 */
export interface EnhancedPattern {
	/** The pattern to match (string or RegExp) */
	pattern: Pattern;
	/** Matching options */
	options?: PatternMatchingOptions;
}

/**
 * Extract filename from a file path
 */
export function extractFilename(filePath: string): string {
	const normalized = filePath.replace(/\\/g, '/');
	const parts = normalized.split('/');
	return parts[parts.length - 1];
}

/**
 * Apply pattern matching with enhanced options
 */
export function matchesPattern(
	file: ProjectedNode | string,
	pattern: Pattern | EnhancedPattern
): boolean {
	const filePath = typeof file === 'string' ? file : file.label;
	let actualPattern: Pattern;
	let options: PatternMatchingOptions;

	if (typeof pattern === 'object' && 'pattern' in pattern) {
		actualPattern = pattern.pattern;
		options = { ...patternDefaultOptions, ...pattern.options };
	} else {
		actualPattern = pattern;
		options = patternDefaultOptions;
	}
	// Determine target string to match against
	const normalizedPath = filePath.replace(/\\/g, '/');
	const targetString =
		options.target === 'filename' ? extractFilename(normalizedPath) : normalizedPath;
	// Apply the pattern
	if (actualPattern instanceof RegExp) {
		// For regex patterns, just use test() - let the regex itself handle exact vs partial matching
		return actualPattern.test(targetString);
	} else {
		// String pattern - check if it contains glob wildcards
		const hasWildcards = actualPattern.includes('*') || actualPattern.includes('?');

		if (hasWildcards) {
			// Convert glob pattern to regex
			const globRegex = new RegExp(`^${convertGlobToRegex(actualPattern)}$`);
			return globRegex.test(targetString);
		} else if (options.matching === 'exact') {
			// Exact matching for literal strings
			const exactRegex = new RegExp(`^${escapeRegexSpecialChars(actualPattern)}$`);
			return exactRegex.test(targetString);
		} else {
			// Partial matching for literal strings
			const partialRegex = new RegExp(escapeRegexSpecialChars(actualPattern));
			return partialRegex.test(targetString);
		}
	}
}

/**
 * Convert glob pattern (with * and ?) to regex pattern
 */
function convertGlobToRegex(pattern: string): string {
	// Escape all special regex characters except * and ?
	let regexPattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

	// Convert glob wildcards to regex
	regexPattern = regexPattern.replace(/\*/g, '.*'); // * matches any characters
	regexPattern = regexPattern.replace(/\?/g, '.'); // ? matches single character

	return regexPattern;
}

/**
 * Escape special regex characters in a string (for exact matching)
 */
function escapeRegexSpecialChars(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Enhanced pattern matching for multiple patterns (all must match)
 */
export function matchesAllPatterns(
	file: ProjectedNode | string,
	patterns: (Pattern | EnhancedPattern)[]
): boolean {
	return patterns.every((pattern) => matchesPattern(file, pattern));
}

/**
 * Enhanced pattern matching for multiple patterns (at least one must match)
 */
export function matchesAnyPattern(
	file: ProjectedNode | string,
	patterns: (Pattern | EnhancedPattern)[]
): boolean {
	return patterns.some((pattern) => matchesPattern(file, pattern));
}
