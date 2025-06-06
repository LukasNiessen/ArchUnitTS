import { Filter } from '../../common';
import { matchesPatternClassInfo } from '../../files';
import { ClassInfo, Metric } from '../extraction';
import { MetricComparison } from './types';

/**
 * Filter classes by class name using regex patterns
 */
export class ClassFilter {
	constructor(private readonly filter: Filter) {}
	apply(classes: ClassInfo[]): ClassInfo[] {
		return classes.filter((classInfo) => {
			return matchesPatternClassInfo(classInfo, this.filter);
		});
	}

	getFilter(): Filter {
		return this.filter;
	}
}

/**
 * Combine multiple filters with AND logic
 */
export class CompositeFilter {
	constructor(private readonly filters: ClassFilter[]) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return this.filters.reduce((filteredClasses, filter) => {
			return filter.apply(filteredClasses);
		}, classes);
	}
}

/**
 * Projects class information to calculate specific metrics
 */
export interface MetricProjection {
	apply(classes: ClassInfo[]): { [className: string]: number };
}

/**
 * Creates a projection for a specific metric calculation
 * @param metricCalculation Function that calculates the metric for a single class
 */
export const projectToMetric = (
	metricCalculation: (classInfo: ClassInfo) => number
): MetricProjection => {
	return {
		apply(classes: ClassInfo[]): { [className: string]: number } {
			const result: { [className: string]: number } = {};

			classes.forEach((classInfo) => {
				result[classInfo.name] = metricCalculation(classInfo);
			});

			return result;
		},
	};
};

/**
 * Represents the result of a metric calculation for violation checking
 */
export interface MetricResult {
	className: string;
	filePath: string;
	metricName: string;
	metricValue: number;
	threshold: number;
	comparison: MetricComparison;
	isViolation: boolean;
}

/**
 * Projects class information into metric results for violation checking
 */
export function projectToMetricResults<T extends ClassInfo>(
	classes: T[],
	metric: Metric,
	threshold: number,
	comparison: MetricComparison
): MetricResult[] {
	return classes.map((classInfo) => {
		const metricValue = metric.calculate(classInfo);

		let isViolation = false;
		switch (comparison) {
			case 'above':
				isViolation = metricValue <= threshold;
				break;

			case 'below':
				isViolation = metricValue >= threshold;
				break;

			case 'equal':
				isViolation = metricValue !== threshold;
				break;

			case 'above-equal':
				isViolation = metricValue < threshold;
				break;

			case 'below-equal':
				isViolation = metricValue > threshold;
				break;
		}

		return {
			className: classInfo.name,
			filePath: classInfo.filePath,
			metricName: metric.name,
			metricValue,
			threshold,
			comparison,
			isViolation,
		};
	});
}
