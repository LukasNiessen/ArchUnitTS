import { ProjectedNode } from './projection';
import { Filter } from '.';
import { ClassInfo } from '../metrics';
import { sharedLogger } from './util';
import type { CheckOptions } from './fluentapi';

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

export function matchesPattern(
	file: ProjectedNode | string,
	filter: Filter,
	options?: CheckOptions
): boolean {
	const filePath = typeof file === 'string' ? file : file.label;

	let targetString: string;
	switch (filter.options.target) {
		case 'filename':
			targetString = extractFilename(filePath);
			break;
		case 'path':
			targetString = normalizePath(filePath);
			break;
		case 'path-no-filename':
			targetString = pathWithoutFilename(filePath);
			break;
		default:
			targetString = normalizePath(filePath);
			break;
	}

	const matches = filter.regExp.test(targetString);

	sharedLogger.info(options?.logging, `Testing file: ${filePath}`);
	sharedLogger.info(
		options?.logging,
		`  Target string (${filter.options.target}): "${targetString}"`
	);
	sharedLogger.info(options?.logging, `  Pattern: ${filter.regExp.source}`);
	sharedLogger.info(options?.logging, `  Matches: ${matches}`);

	return matches;
}

export function matchesPatternClassInfo(
	classInfo: ClassInfo,
	filter: Filter,
	options?: CheckOptions
): boolean {
	const filePath = classInfo.filePath;

	let targetString: string;
	switch (filter.options.target) {
		case 'filename':
			targetString = extractFilename(filePath);
			break;
		case 'path':
			targetString = normalizePath(filePath);
			break;
		case 'path-no-filename':
			targetString = pathWithoutFilename(filePath);
			break;
		case 'classname':
			targetString = classInfo.name;
			break;
		default:
			targetString = normalizePath(filePath);
			break;
	}

	const matches = filter.regExp.test(targetString);

	sharedLogger.info(
		options?.logging,
		`Testing class: ${classInfo.name} from ${filePath}`
	);
	sharedLogger.info(
		options?.logging,
		`  Target string (${filter.options.target}): "${targetString}"`
	);
	sharedLogger.info(options?.logging, `  Pattern: ${filter.regExp.source}`);
	sharedLogger.info(options?.logging, `  Matches: ${matches}`);

	return matches;
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
