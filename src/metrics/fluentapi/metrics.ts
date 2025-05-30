import {
	byFolderPath,
	bySingleFile,
	byClassName,
	combineFilters,
} from '../projection/project-metrics';
import { ClassFilter, ClassInfo, Metric } from '../extraction/interface';
import { DistanceMetricsBuilder } from './metrics/distance-metrics';
import { LCOMMetricsBuilder } from './metrics/lcom-metrics';
import { CountMetricsBuilder } from './metrics/count-metrics';
import { MetricComparison } from './types';
import { Checkable } from '../../common/fluentapi/checkable';
import { Violation } from '../../common/assertion/violation';
import { extractClassInfo } from '../extraction/extract-class-info';

/**
 * Type for user-defined custom metric calculation functions
 */
export type CustomMetricCalculation = (classInfo: ClassInfo) => number;

/**
 * Type for user-defined custom assertion functions
 */
export type CustomMetricAssertion = (value: number, classInfo: ClassInfo) => boolean;

/**
 * Custom metric violation
 */
export class CustomMetricViolation implements Violation {
	constructor(
		readonly className: string,
		readonly filePath: string,
		readonly metricName: string,
		readonly metricValue: number,
		readonly message: string
	) {}

	toString(): string {
		return `Class '${this.className}' in file '${this.filePath}' failed custom metric '${this.metricName}': ${this.message} (value: ${this.metricValue})`;
	}
}

/**
 * Custom metric implementation
 */
export class CustomMetric implements Metric {
	constructor(
		readonly name: string,
		readonly description: string,
		private calculation: CustomMetricCalculation
	) {}

	calculate(classInfo: ClassInfo): number {
		return this.calculation(classInfo);
	}
}

/**
 * Entry point for code metrics analysis.
 *
 * @param tsConfigFilePath Optional path to tsconfig.json file
 * @returns A builder for configuring metrics analysis
 *
 */
export const metrics = (tsConfigFilePath?: string): MetricsBuilder => {
	return new MetricsBuilder(tsConfigFilePath);
};

/**
 * Builder for metrics analysis
 */
export class MetricsBuilder {
	private filters: ClassFilter[] = [];

	constructor(readonly tsConfigFilePath?: string) {}

	/**
	 * Filter classes by folder path using regex pattern
	 * @param folderPattern String or regex pattern matching folder paths
	 */
	public inFolder(folderPattern: string | RegExp): MetricsBuilder {
		this.filters.push(byFolderPath(folderPattern));
		return this;
	}

	/**
	 * Filter classes to a specific file
	 * @param filePath Path to the specific file
	 */
	public inFile(filePath: string): MetricsBuilder {
		this.filters.push(bySingleFile(filePath));
		return this;
	}

	/**
	 * Filter classes by name using regex pattern
	 * @param namePattern String or regex pattern matching class names
	 */
	public forClassesMatching(namePattern: string | RegExp): MetricsBuilder {
		this.filters.push(byClassName(namePattern));
		return this;
	}

	/**
	 * XXX-TODO: this was public before. should not though right?
	 * Get the combined filter for all applied filters
	 */
	getFilter(): ClassFilter | null {
		if (this.filters.length === 0) {
			return null;
		}
		return combineFilters(this.filters);
	}

	/**
	 * Configure LCOM (Lack of Cohesion of Methods) metrics
	 */
	public lcom(): LCOMMetricsBuilder {
		return new LCOMMetricsBuilder(this);
	}

	/**
	 * Configure distance metrics (Abstractness, Instability, Distance from Main Sequence)
	 */
	public distance(): DistanceMetricsBuilder {
		return new DistanceMetricsBuilder(this.tsConfigFilePath);
	}

	/**
	 * Configure count metrics (Lines of Code, Methods, Fields, etc.)
	 */
	public count(): CountMetricsBuilder {
		return new CountMetricsBuilder(this);
	}

	/**
	 * Configure custom metrics with user-defined calculation and assertion logic
	 */
	public customMetric(
		name: string,
		description: string,
		calculation: CustomMetricCalculation
	): CustomMetricsBuilder {
		return new CustomMetricsBuilder(this, name, description, calculation);
	}
}

/**
 * Builder for custom metrics
 */
export class CustomMetricsBuilder {
	constructor(
		readonly metricsBuilder: MetricsBuilder,
		readonly metricName: string,
		readonly metricDescription: string,
		readonly calculation: CustomMetricCalculation
	) {}

	/**
	 * Create a threshold-based assertion for the custom metric
	 */
	public shouldBeBelow(threshold: number): CustomMetricThresholdBuilder {
		return new CustomMetricThresholdBuilder(
			this.metricsBuilder,
			this.metricName,
			this.metricDescription,
			this.calculation,
			threshold,
			'below'
		);
	}

	/**
	 * Create a threshold-based assertion for the custom metric
	 */
	public shouldBeBelowOrEqual(threshold: number): CustomMetricThresholdBuilder {
		return new CustomMetricThresholdBuilder(
			this.metricsBuilder,
			this.metricName,
			this.metricDescription,
			this.calculation,
			threshold,
			'below-equal'
		);
	}

	/**
	 * Create a threshold-based assertion for the custom metric
	 */
	public shouldBeAbove(threshold: number): CustomMetricThresholdBuilder {
		return new CustomMetricThresholdBuilder(
			this.metricsBuilder,
			this.metricName,
			this.metricDescription,
			this.calculation,
			threshold,
			'above'
		);
	}

	/**
	 * Create a threshold-based assertion for the custom metric
	 */
	public shouldBeAboveOrEqual(threshold: number): CustomMetricThresholdBuilder {
		return new CustomMetricThresholdBuilder(
			this.metricsBuilder,
			this.metricName,
			this.metricDescription,
			this.calculation,
			threshold,
			'above-equal'
		);
	}

	/**
	 * Create a threshold-based assertion for the custom metric
	 */
	public shouldBe(threshold: number): CustomMetricThresholdBuilder {
		return new CustomMetricThresholdBuilder(
			this.metricsBuilder,
			this.metricName,
			this.metricDescription,
			this.calculation,
			threshold,
			'equal'
		);
	}

	/**
	 * Create a custom assertion for the metric
	 */
	public shouldSatisfy(assertion: CustomMetricAssertion): CustomMetricCondition {
		return new CustomMetricCondition(
			this.metricsBuilder,
			this.metricName,
			this.metricDescription,
			this.calculation,
			assertion
		);
	}
}

/**
 * Builder for custom metric threshold-based conditions
 */
export class CustomMetricThresholdBuilder implements Checkable {
	constructor(
		readonly metricsBuilder: MetricsBuilder,
		readonly metricName: string,
		readonly metricDescription: string,
		readonly calculation: CustomMetricCalculation,
		readonly threshold: number,
		readonly comparison: MetricComparison
	) {}

	async check(): Promise<Violation[]> {
		const violations: Violation[] = [];
		const allClasses = extractClassInfo(this.metricsBuilder.tsConfigFilePath);

		// Apply filters if any
		const filter = this.metricsBuilder.getFilter();
		const filteredClasses = filter ? filter.apply(allClasses) : allClasses;

		for (const classInfo of filteredClasses) {
			const metricValue = this.calculation(classInfo);
			let passes = false;

			switch (this.comparison) {
				case 'below':
					passes = metricValue < this.threshold;
					break;
				case 'below-equal':
					passes = metricValue <= this.threshold;
					break;
				case 'above':
					passes = metricValue > this.threshold;
					break;
				case 'above-equal':
					passes = metricValue >= this.threshold;
					break;
				case 'equal':
					passes = metricValue === this.threshold;
					break;
			}

			if (!passes) {
				const comparisonText = this.getComparisonDescription();
				violations.push(
					new CustomMetricViolation(
						classInfo.name,
						classInfo.filePath,
						this.metricName,
						metricValue,
						`${comparisonText} ${this.threshold}`
					)
				);
			}
		}

		return violations;
	}

	private getComparisonDescription(): string {
		switch (this.comparison) {
			case 'below':
				return 'should be below';
			case 'below-equal':
				return 'should be below or equal to';
			case 'above':
				return 'should be above';
			case 'above-equal':
				return 'should be above or equal to';
			case 'equal':
				return 'should be equal to';
			default:
				return 'should be';
		}
	}
}

/**
 * Builder for custom metric assertion-based conditions
 */
export class CustomMetricCondition implements Checkable {
	constructor(
		readonly metricsBuilder: MetricsBuilder,
		readonly metricName: string,
		readonly metricDescription: string,
		readonly calculation: CustomMetricCalculation,
		readonly assertion: CustomMetricAssertion
	) {}

	async check(): Promise<Violation[]> {
		const violations: Violation[] = [];
		const allClasses = extractClassInfo(this.metricsBuilder.tsConfigFilePath);

		// Apply filters if any
		const filter = this.metricsBuilder.getFilter();
		const filteredClasses = filter ? filter.apply(allClasses) : allClasses;

		for (const classInfo of filteredClasses) {
			const metricValue = this.calculation(classInfo);
			const passes = this.assertion(metricValue, classInfo);

			if (!passes) {
				violations.push(
					new CustomMetricViolation(
						classInfo.name,
						classInfo.filePath,
						this.metricName,
						metricValue,
						'failed custom assertion'
					)
				);
			}
		}

		return violations;
	}
}
