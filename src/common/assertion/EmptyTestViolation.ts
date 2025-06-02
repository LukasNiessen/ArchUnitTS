import { Violation } from './violation';
import { ProjectedEdge } from '../projection/project-edges';

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
