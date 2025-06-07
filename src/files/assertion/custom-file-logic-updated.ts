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
		options?.logging,
		`Starting custom file logic validation with ${filters.length} patterns`
	);
	sharedLogger?.debug(options?.logging, `Patterns: ${JSON.stringify(filters)}`);
	sharedLogger?.debug(options?.logging, `Allow empty tests: ${allowEmptyTests}`);

	const violations: (CustomFileViolation | EmptyTestViolation)[] = [];

	sharedLogger?.debug(options?.logging, `Filtering nodes to mach regexPatterns`);
	filters.forEach((pattern) =>
		sharedLogger?.debug(options?.logging, `regexPattern: ${pattern}`)
	);

	const projectedNodes = nodes.filter((node) =>
		matchesAllPatterns(node.label, filters)
	);

	sharedLogger?.debug(
		options?.logging,
		`Found ${projectedNodes.length} matching files from ${nodes.length} total nodes`
	);

	// Check for empty test if no files match preconditions
	if (projectedNodes.length === 0 && !allowEmptyTests) {
		sharedLogger?.warn(
			options?.logging,
			'No files matched patterns and empty tests are not allowed - creating EmptyTestViolation'
		);
		return [new EmptyTestViolation(filters)];
	}

	for (const node of projectedNodes) {
		const path = node.label;
		sharedLogger?.debug(options?.logging, `Processing file: ${path}`);

		const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
		const directory = lastSlash >= 0 ? path.substring(0, lastSlash) : '';
		const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
		const lastDot = fileName.lastIndexOf('.');
		const name = lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
		const extension = lastDot >= 0 ? fileName.substring(lastDot + 1) : '';

		sharedLogger?.debug(
			options?.logging,
			`File details: name='${name}', extension='${extension}', directory='${directory}'`
		);

		// Read file content and calculate lines of code
		const fs = require('fs');
		let content = '';
		let linesOfCode = 0;
		try {
			content = fs.readFileSync(path, 'utf8');
			linesOfCode = content.split('\n').length;
			sharedLogger?.debug(
				options?.logging,
				`Successfully read file content: ${linesOfCode} lines of code`
			);
		} catch (error) {
			// If file can't be read, use empty content
			content = '';
			linesOfCode = 0;
			sharedLogger?.warn(
				options?.logging,
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

		sharedLogger?.debug(
			options?.logging,
			`Evaluating custom condition for file: ${path}`
		);
		const isValid = condition(fileInfo);
		sharedLogger?.debug(
			options?.logging,
			`Custom condition result for '${path}': ${isValid}`
		);

		if (!isValid) {
			sharedLogger?.warn(
				options?.logging,
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
			sharedLogger?.debug(
				options?.logging,
				`File '${path}' passed custom condition`
			);
		}
	}

	sharedLogger?.debug(
		options?.logging,
		`Custom file logic validation completed. Found ${violations.length} violations`
	);
	return violations;
};
