import { Filter, Logger, matchesPatternClassInfo } from '../../common';
import { ClassInfo, Metric } from '../extraction';
import { MetricComparison } from './types';
import type { CheckOptions } from '../../common/fluentapi';

/**
 * Filter classes by class name using regex patterns
 */
export class ClassFilter {
	constructor(private readonly filter: Filter) {}
	apply(classes: ClassInfo[], logger?: Logger, options?: CheckOptions): ClassInfo[] {
		const beforeCount = classes.length;

		if (logger) {
			logger.info(options?.logging, `Filter pattern: ${this.filter.regExp.source}`);
			logger.info(options?.logging, `Filter target: ${this.filter.options.target}`);
			logger.info(options?.logging, `Applying filter to ${classes.length} classes`);
		}

		const filtered = classes.filter((classInfo) => {
			const matches = matchesPatternClassInfo(classInfo, this.filter, options);
			return matches;
		});

		if (logger && beforeCount !== filtered.length) {
			logger.info(
				options?.logging,
				`  Filter applied: ${beforeCount} -> ${filtered.length} classes (pattern: ${this.filter.regExp.source})`
			);
		}

		return filtered;
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

	apply(classes: ClassInfo[], logger?: Logger, options?: CheckOptions): ClassInfo[] {
		if (logger) {
			logger.debug(
				options?.logging,
				`Applying ${this.filters.length} filter(s) to ${classes.length} classes`
			);
		}

		return this.filters.reduce((filteredClasses, filter, index) => {
			if (logger) {
				logger.debug(
					options?.logging,
					`  Applying filter ${index + 1}/${this.filters.length}`
				);
			}
			return filter.apply(filteredClasses, logger, options);
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
