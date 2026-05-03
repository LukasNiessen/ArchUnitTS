import { ProjectedNode } from './projection';
import { Filter } from '.';
import { ClassInfo } from '../metrics';
import { sharedLogger } from './util';
import type { CheckOptions } from './fluentapi';
import { PatternTarget } from './type';

/**
 * Extract filename from a file path
 */
export function extractFilename(filePath: string): string {
	const normalized = filePath.replace(/\\/g, '/');
	const parts = normalized.split('/');
	return parts[parts.length - 1];
}

function normalizePath(inp: string): string {
	return inp.replace(/\\/g, '/');
}

function pathWithoutFilename(inp: string): string {
	const normalized = inp.replace(/\\/g, '/');
	const parts = normalized.split('/');
	parts.pop();
	return parts.join('/');
}

function getTargetString(
	filePath: string,
	target: PatternTarget | undefined,
	classInfo?: ClassInfo
): string {
	switch (target) {
		case 'filename':
			return extractFilename(filePath);
		case 'path':
			return normalizePath(filePath);
		case 'path-no-filename':
			return pathWithoutFilename(filePath);
		case 'classname':
			return classInfo ? classInfo.name : normalizePath(filePath);
		default:
			return normalizePath(filePath);
	}
}

function regexMatches(regExp: RegExp, target: string): boolean {
	regExp.lastIndex = 0;
	return regExp.test(target);
}

function matchesFilter(
	filePath: string,
	filter: Filter,
	options?: CheckOptions,
	classInfo?: ClassInfo
): boolean {
	const targetString = getTargetString(filePath, filter.options.target, classInfo);
	const matches = regexMatches(filter.regExp, targetString);
	const excluded =
		matches &&
		filter.exclusions?.some((exclusion) =>
			matchesFilter(filePath, exclusion, options, classInfo)
		);

	sharedLogger.info(options?.logging, `Testing file: ${filePath}`);
	sharedLogger.info(
		options?.logging,
		`  Target string (${filter.options.target}): "${targetString}"`
	);
	sharedLogger.info(options?.logging, `  Pattern: ${filter.regExp.source}`);
	sharedLogger.info(options?.logging, `  Matches: ${matches}`);
	sharedLogger.info(options?.logging, `  Excluded: ${Boolean(excluded)}`);

	return matches && !excluded;
}

export function matchesPattern(
	file: ProjectedNode | string,
	filter: Filter,
	options?: CheckOptions
): boolean {
	const filePath = typeof file === 'string' ? file : file.label;
	return matchesFilter(filePath, filter, options);
}

export function matchesPatternClassInfo(
	classInfo: ClassInfo,
	filter: Filter,
	options?: CheckOptions
): boolean {
	return matchesFilter(classInfo.filePath, filter, options, classInfo);
}

/**
 * Enhanced pattern matching for multiple patterns (all must match)
 *
 * If a pattern is a string, glob logic is handled automatically. Do not handle glob logic yourself.
 */
export function matchesAllPatterns(
	file: ProjectedNode | string,
	filters: Filter[]
): boolean {
	return filters.every((filter) => matchesPattern(file, filter));
}

/**
 * Enhanced pattern matching for multiple patterns (at least one must match)
 */
export function matchesAnyPattern(
	file: ProjectedNode | string,
	filters: Filter[]
): boolean {
	return filters.some((filter) => matchesPattern(file, filter));
}

/**
 * OLD
 */
export const matchingAllPatterns_OLD = (
	input: string,
	patterns: Array<string | RegExp>
): boolean => {
	return patterns.every((pattern) => {
		if (typeof pattern === 'string') {
			const regex = new RegExp(pattern);
			return regex.test(input);
		}
		return pattern.test(input);
	});
};
