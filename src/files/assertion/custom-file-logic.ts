import { Violation } from '../../common/assertion/violation';
import { ProjectedNode } from '../../common/projection/project-nodes';
import { matchingAllPatterns } from '../../common/util/regex-utils';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';

// Type definitions for custom logic
export type FileInfo = {
	path: string;
	name: string;
	extension: string;
	directory: string;
	content: string;
	linesOfCode: number;
};

export type CustomFileCondition = (file: FileInfo) => boolean;

// Custom logic violation implementation
export class CustomFileViolation implements Violation {
	constructor(
		readonly message: string,
		readonly fileInfo: FileInfo,
		readonly rule: string
	) {}
}

export const gatherCustomFileViolations = (
	nodes: ProjectedNode[],
	patterns: (string | RegExp)[],
	condition: CustomFileCondition,
	message: string,
	allowEmptyTests: boolean = false
): (CustomFileViolation | EmptyTestViolation)[] => {
	const violations: (CustomFileViolation | EmptyTestViolation)[] = [];

	// Convert glob patterns to regex patterns for consistency with other file operations
	const regexPatterns = patterns.map((pattern) => {
		if (typeof pattern === 'string') {
			// Handle glob patterns by converting them to regex
			if (pattern.includes('*') || pattern.includes('?')) {
				const regexPattern = pattern
					.replace(/\*\*/g, '.*') // ** matches any number of directories
					.replace(/\*/g, '[^/\\\\]*') // * matches any characters except path separators
					.replace(/\?/g, '.') // ? matches any single character
					.replace(/\./g, '\\.'); // Escape literal dots
				return regexPattern;
			}
		}
		return pattern;
	});

	const projectedNodes = nodes.filter((node) =>
		matchingAllPatterns(node.label, regexPatterns)
	);

	// Check for empty test if no files match preconditions
	if (projectedNodes.length === 0 && !allowEmptyTests) {
		return [new EmptyTestViolation(patterns)];
	}

	for (const node of projectedNodes) {
		const path = node.label;

		// Check if this file matches any of the patterns
		if (
			patterns &&
			patterns.length > 0 &&
			!matchingAllPatterns(path, regexPatterns)
		) {
			continue; // Skip files that don't match the patterns
		}

		const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
		const directory = lastSlash >= 0 ? path.substring(0, lastSlash) : '';
		const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
		const lastDot = fileName.lastIndexOf('.');
		const name = lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
		const extension = lastDot >= 0 ? fileName.substring(lastDot + 1) : '';

		// Read file content and calculate lines of code
		const fs = require('fs');
		let content = '';
		let linesOfCode = 0;
		try {
			content = fs.readFileSync(path, 'utf8');
			linesOfCode = content.split('\n').length;
		} catch (error) {
			// If file can't be read, use empty content
			content = '';
			linesOfCode = 0;
		}

		const fileInfo: FileInfo = {
			path,
			name,
			extension,
			directory,
			content,
			linesOfCode,
		};

		const isValid = condition(fileInfo);
		if (!isValid) {
			violations.push(
				new CustomFileViolation(
					message || 'Custom file condition failed',
					fileInfo,
					'custom-condition'
				)
			);
		}
	}

	return violations;
};
