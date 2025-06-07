import { Violation } from '../../common/assertion/violation';
import { ProjectedNode } from '../../common/projection/project-nodes';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { CheckOptions } from '../../..';
import { sharedLogger } from '../../common/util/logger';
import { matchesAllPatterns } from '../../common/pattern-matching';
import { Filter } from '../../common/type';

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
	filters: Filter[],
	condition: CustomFileCondition,
	message: string,
	options?: CheckOptions
): (CustomFileViolation | EmptyTestViolation)[] => {
	const allowEmptyTests = options?.allowEmptyTests || false;
	sharedLogger?.debug(
		`Starting custom file logic validation with ${filters.length} patterns`,
		options?.logging
	);
	sharedLogger?.debug(`Patterns: ${JSON.stringify(filters)}`, options?.logging);
	sharedLogger?.debug(`Allow empty tests: ${allowEmptyTests}`, options?.logging);

	const violations: (CustomFileViolation | EmptyTestViolation)[] = [];

	sharedLogger?.debug(`Filtering nodes to mach regexPatterns`, options?.logging);
	filters.forEach((pattern) =>
		sharedLogger?.debug(`regexPattern: ${pattern}`, options?.logging)
	);

	const projectedNodes = nodes.filter((node) =>
		matchesAllPatterns(node.label, filters)
	);

	sharedLogger?.debug(
		`Found ${projectedNodes.length} matching files from ${nodes.length} total nodes`,
		options?.logging
	);

	// Check for empty test if no files match preconditions
	if (projectedNodes.length === 0 && !allowEmptyTests) {
		sharedLogger?.warn(
			'No files matched patterns and empty tests are not allowed - creating EmptyTestViolation',
			options?.logging
		);
		return [new EmptyTestViolation(filters)];
	}

	for (const node of projectedNodes) {
		const path = node.label;
		sharedLogger?.debug(`Processing file: ${path}`, options?.logging);

		const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
		const directory = lastSlash >= 0 ? path.substring(0, lastSlash) : '';
		const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
		const lastDot = fileName.lastIndexOf('.');
		const name = lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
		const extension = lastDot >= 0 ? fileName.substring(lastDot + 1) : '';

		sharedLogger?.debug(
			`File details: name='${name}', extension='${extension}', directory='${directory}'`,
			options?.logging
		);

		// Read file content and calculate lines of code
		const fs = require('fs');
		let content = '';
		let linesOfCode = 0;
		try {
			content = fs.readFileSync(path, 'utf8');
			linesOfCode = content.split('\n').length;
			sharedLogger?.debug(
				`Successfully read file content: ${linesOfCode} lines of code`,
				options?.logging
			);
		} catch (error) {
			// If file can't be read, use empty content
			content = '';
			linesOfCode = 0;
			sharedLogger?.warn(
				`Failed to read file '${path}': ${error instanceof Error ? error.message : String(error)}`,
				options?.logging
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

		sharedLogger?.debug(
			`Evaluating custom condition for file: ${path}`,
			options?.logging
		);
		const isValid = condition(fileInfo);
		sharedLogger?.debug(
			`Custom condition result for '${path}': ${isValid}`,
			options?.logging
		);

		if (!isValid) {
			sharedLogger?.warn(
				`Custom file condition failed for '${path}' - creating violation`,
				options?.logging
			);
			violations.push(
				new CustomFileViolation(
					message || 'Custom file condition failed',
					fileInfo,
					'custom-condition'
				)
			);
		} else {
			sharedLogger?.debug(
				`File '${path}' passed custom condition`,
				options?.logging
			);
		}
	}

	sharedLogger?.debug(
		`Custom file logic validation completed. Found ${violations.length} violations`,
		options?.logging
	);
	return violations;
};
