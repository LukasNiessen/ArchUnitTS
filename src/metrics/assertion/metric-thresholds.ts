import { Violation } from '../../common/assertion/violation';
import { MetricComparison, MetricResult } from '../projection/project-metrics';

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
		const comparisonText = this.comparison === 'below' ? 'less than' : 'greater than';
		return `Class '${this.className}' in file '${this.filePath}' has ${this.metricName} value of ${this.metricValue}, which is ${comparisonText} threshold ${this.threshold}`;
	}
}

/**
 * Gathers violations from pre-computed metric results
 * @param metricResults The metric results to check for violations
 */
export function gatherMetricViolations(metricResults: MetricResult[]): MetricViolation[] {
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
