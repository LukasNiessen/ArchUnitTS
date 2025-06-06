import { Violation } from './violation';
import { ProjectedEdge } from '../projection/project-edges';
import { Filter } from '../type';
import { getPatternString } from '../regex-factory';

/**
 * Helper function to extract all pattern strings from filters
 */
function getFilterPatternStrings(filters: Filter[]): string {
	return filters.map((filter) => getPatternString(filter.regExp)).join(', ');
}

/**
 * EmptyTestViolation represents a violation when no files are found that match the preconditions
 * This helps detect tests that don't actually test anything because they match no files
 */
export class EmptyTestViolation implements Violation {
	public filters: (Filter | string)[];
	public message: string;
	public isNegated: boolean;
	public dependency?: ProjectedEdge;

	constructor(filters: Filter[] | string[], customMessage?: string, isNegated = false) {
		let patternString = '';
		if (filters.length > 0) {
			if (typeof filters[0] === 'string') {
				patternString = filters.join(',');
			} else {
				patternString =
					typeof filters === 'string'
						? filters
						: getFilterPatternStrings(filters as Filter[]);
			}
		}

		this.filters = filters;
		this.message =
			customMessage || `No files found matching pattern(s): ${patternString}`;
		this.isNegated = isNegated;
	}
}
