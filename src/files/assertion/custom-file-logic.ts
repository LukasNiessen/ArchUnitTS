import { Violation } from '../../common/assertion/violation';
import { ProjectedNode } from '../../common/projection/project-nodes';
import { matchingAllPatterns } from '../../common/util/regex-utils';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { CheckOptions } from '../../..';
import { CheckLogger } from '../../common/util/logger';
import { Pattern } from './pattern-matching';

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
	patterns: Pattern[],
	condition: CustomFileCondition,
	message: string,
	options?: CheckOptions
): (CustomFileViolation | EmptyTestViolation)[] => {
	const logger = new CheckLogger(options?.logging);
	const allowEmptyTests = options?.allowEmptyTests || false;
	logger?.debug(
		`Starting custom file logic validation with ${patterns.length} patterns`
	);
	logger?.debug(`Patterns: ${JSON.stringify(patterns)}`);
	logger?.debug(`Allow empty tests: ${allowEmptyTests}`);

	const violations: (CustomFileViolation | EmptyTestViolation)[] = [];

	logger?.debug(`Filtering nodes to mach regexPatterns`);
	patterns.forEach((pattern) => logger?.debug(`regexPattern: ${pattern}`));

	const projectedNodes = nodes.filter((node) =>
		matchingAllPatterns(node.label, patterns)
	);

	logger?.debug(
		`Found ${projectedNodes.length} matching files from ${nodes.length} total nodes`
	);

	// Check for empty test if no files match preconditions
	if (projectedNodes.length === 0 && !allowEmptyTests) {
		logger?.warn(
			'No files matched patterns and empty tests are not allowed - creating EmptyTestViolation'
		);
		return [new EmptyTestViolation(patterns)];
	}

	for (const node of projectedNodes) {
		const path = node.label;
		logger?.debug(`Processing file: ${path}`);

		const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
		const directory = lastSlash >= 0 ? path.substring(0, lastSlash) : '';
		const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
		const lastDot = fileName.lastIndexOf('.');
		const name = lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
		const extension = lastDot >= 0 ? fileName.substring(lastDot + 1) : '';

		logger?.debug(
			`File details: name='${name}', extension='${extension}', directory='${directory}'`
		);

		// Read file content and calculate lines of code
		const fs = require('fs');
		let content = '';
		let linesOfCode = 0;
		try {
			content = fs.readFileSync(path, 'utf8');
			linesOfCode = content.split('\n').length;
			logger?.debug(`Successfully read file content: ${linesOfCode} lines of code`);
		} catch (error) {
			// If file can't be read, use empty content
			content = '';
			linesOfCode = 0;
			logger?.warn(
				`Failed to read file '${path}': ${error instanceof Error ? error.message : String(error)}`
			);
		}

		const fileInfo: FileInfo = {
			path,
			name,
			extension,
			directory,
			content,
			linesOfCode,
		};

		logger?.debug(`Evaluating custom condition for file: ${path}`);
		const isValid = condition(fileInfo);
		logger?.debug(`Custom condition result for '${path}': ${isValid}`);

		if (!isValid) {
			logger?.warn(
				`Custom file condition failed for '${path}' - creating violation`
			);
			violations.push(
				new CustomFileViolation(
					message || 'Custom file condition failed',
					fileInfo,
					'custom-condition'
				)
			);
		} else {
			logger?.debug(`File '${path}' passed custom condition`);
		}
	}

	logger?.debug(
		`Custom file logic validation completed. Found ${violations.length} violations`
	);
	return violations;
};
