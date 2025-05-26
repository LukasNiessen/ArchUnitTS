import { Violation } from '../../common/assertion/violation';
import { LCOMMetric } from '../calculation/lcom';
import { ClassInfo } from '../extraction/extract-class-info';
import { MetricComparison } from '../fluentapi/metrics';
import { projectToMetricResults } from '../projection/project-metrics';

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
 * Gathers violations from metric results
 * @param metricResults The metric results to check for violations
 */
export function gatherMetricViolations(
	classes: ClassInfo[],
	metric: LCOMMetric,
	threshold: number,
	comparison: MetricComparison
): MetricViolation[] {
	const metricResults = projectToMetricResults(classes, metric, threshold, comparison);

	console.log('XXX res:', metricResults);

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
