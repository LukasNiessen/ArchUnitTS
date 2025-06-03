import { Violation, EmptyTestViolation } from '../../common/assertion';
import { MetricComparison } from './types';
import { MetricResult } from '../projection';
import { Filter } from '../../common';

/**
 * Represents a class that violates a metric threshold
 */
export class MetricViolation implements Violation {
	constructor(
		readonly className: string,
		readonly filePath: string,
		readonly metricName: string,
		readonly metricValue: number,
		readonly threshold: number,
		readonly comparison: MetricComparison
	) {}

	toString(): string {
		const comparisonText = this.comparison === 'below' ? 'not below' : 'not above';
		return `Class '${this.className}' in file '${this.filePath}' has ${this.metricName} value of ${this.metricValue}, which is ${comparisonText} threshold ${this.threshold}`;
	}
}

/**
 * Gathers violations from pre-computed metric results
 * @param metricResults The metric results to check for violations
 * @param allowEmptyTests Whether to allow empty tests (when no files match)
 */
export function gatherMetricViolations(
	metricResults: MetricResult[],
	allowEmptyTests?: boolean,
	filters?: Filter[]
): (MetricViolation | EmptyTestViolation)[] {
	// Check for empty test condition
	if (metricResults.length === 0 && !allowEmptyTests) {
		return [new EmptyTestViolation(filters || [])];
	}

	return metricResults
		.filter((result) => result.isViolation)
		.map(
			(result) =>
				new MetricViolation(
					result.className,
					result.filePath,
					result.metricName,
					result.metricValue,
					result.threshold,
					result.comparison
				)
		);
}
