import { Violation } from './violation';
import { ProjectedEdge } from '../projection/project-edges';
import { Filter } from '../type';

/**
 * EmptyTestViolation represents a violation when no files are found that match the preconditions
 * This helps detect tests that don't actually test anything because they match no files
 */
export class EmptyTestViolation implements Violation {
	public filters: Filter[] | string;
	public message: string;
	public isNegated: boolean;
	public dependency?: ProjectedEdge;

	constructor(filters: Filter[] | string, customMessage?: string, isNegated = false) {
		const patternString =
			typeof filters === 'string'
				? filters
				: filters.map((filter) => filter.regExp).join(', ');

		this.filters = filters;
		this.message =
			customMessage || `No files found matching pattern(s): ${patternString}`;
		this.isNegated = isNegated;
	}
}
