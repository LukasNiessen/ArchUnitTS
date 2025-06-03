import { matchesPattern } from '../../..';
import { Pattern, Filter } from '../../common';
import { ClassFilter, ClassInfo, Metric } from '../extraction';
import { MetricComparison } from './types';
import * as path from 'path';

/**
 * Filter classes by folder path using regex patterns
 */
export class FolderPathFilter implements ClassFilter {
	constructor(private readonly pathPattern: RegExp) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return classes.filter((classInfo) => {
			// Normalize the file path to use forward slashes for consistency
			const normalizedPath = classInfo.filePath.replace(/\\/g, '/');
			return this.pathPattern.test(normalizedPath);
		});
	}
}

/**
 * Filter classes by exact file path
 */
export class SingleFileFilter implements ClassFilter {
	constructor(private readonly exactFilePath: string) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return classes.filter((classInfo) => {
			// Normalize both paths for comparison
			const normalizedClassPath = path.resolve(classInfo.filePath);
			const normalizedTargetPath = path.resolve(this.exactFilePath);
			return normalizedClassPath === normalizedTargetPath;
		});
	}
}

/**
 * Filter classes by class name using regex patterns
 */
export class ClassNameFilter implements ClassFilter {
	constructor(private readonly namePattern: RegExp) {}
	apply(classes: ClassInfo[]): ClassInfo[] {
		return classes.filter((classInfo) => {
			return this.namePattern.test(classInfo.name);
		});
	}
}

/**
 * Filter classes using the same pattern matching logic as the files module
 */
export class FilterBasedClassFilter implements ClassFilter {
	constructor(private readonly filter: Filter) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return classes.filter((classInfo) => {
			return matchesPattern(classInfo.filePath, this.filter);
		});
	}
}

/**
 * Combine multiple filters with AND logic
 */
export class CompositeFilter implements ClassFilter {
	constructor(private readonly filters: ClassFilter[]) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return this.filters.reduce((filteredClasses, filter) => {
			return filter.apply(filteredClasses);
		}, classes);
	}
}

/**
 * Helper function to create a folder path filter
 * @param pathPattern String or regex pattern matching folder paths
 * @returns ClassFilter instance
 */
export const byFolderPath = (pathPattern: Pattern): ClassFilter => {
	const regex = typeof pathPattern === 'string' ? new RegExp(pathPattern) : pathPattern;
	return new FolderPathFilter(regex);
};

/**
 * Helper function to create a single file filter
 * @param filePath Exact file path to match
 * @returns ClassFilter instance
 */
export const bySingleFile = (filePath: string): ClassFilter => {
	return new SingleFileFilter(filePath);
};

/**
 * Helper function to create a class name filter
 * @param namePattern String or regex pattern matching class names
 * @returns ClassFilter instance
 */
export const byClassName = (namePattern: Pattern): ClassFilter => {
	const regex = typeof namePattern === 'string' ? new RegExp(namePattern) : namePattern;
	return new ClassNameFilter(regex);
};

/**
 * Helper function to create a filter using the common Filter type
 * @param filter Filter object with pattern matching options
 * @returns ClassFilter instance
 */
export const byFilter = (filter: Filter): ClassFilter => {
	return new FilterBasedClassFilter(filter);
};

/**
 * Helper function to combine multiple filters with AND logic
 * @param filters Array of filters to combine
 * @returns Combined ClassFilter instance
 */
export const combineFilters = (filters: ClassFilter[]): ClassFilter => {
	return new CompositeFilter(filters);
};

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
