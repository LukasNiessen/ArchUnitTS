import { bySingleFile, byClassName, combineFilters, byFilter } from '../../projection';
import { ClassFilter, ClassInfo, Metric, extractClassInfo } from '../../extraction';
import { DistanceMetricsBuilder } from './distance-metrics';
import { LCOMMetricsBuilder } from './lcom-metrics';
import { CountMetricsBuilder } from './count-metrics';
import { MetricComparison } from '../types';
import { Checkable, CheckOptions } from '../../../common/fluentapi';
import { Violation, EmptyTestViolation } from '../../../common/assertion';
import { CheckLogger } from '../../../common/util';
import { Pattern, RegexFactory } from '../../../common';

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
	 * Filter classes by filename using regex pattern with glob support
	 * @param name String or regex pattern matching filenames only
	 */
	public withName(name: Pattern): MetricsBuilder {
		this.filters.push(byFilter(RegexFactory.fileNameMatcher(name)));
		return this;
	}

	/**
	 * Filter classes by folder path (without filename) using regex pattern with glob support
	 * @param folder String or regex pattern matching folder paths
	 */
	public inFolder(folderPattern: Pattern): MetricsBuilder {
		this.filters.push(byFilter(RegexFactory.folderMatcher(folderPattern)));
		return this;
	}

	/**
	 * Filter classes by full path using regex pattern with glob support
	 * @param path String or regex pattern matching full file paths
	 */
	public inPath(path: Pattern): MetricsBuilder {
		this.filters.push(byFilter(RegexFactory.pathMatcher(path)));
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
	public forClassesMatching(namePattern: Pattern): MetricsBuilder {
		this.filters.push(byClassName(namePattern));
		return this;
	}

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

	async check(options?: CheckOptions): Promise<Violation[]> {
		const logger = new CheckLogger(options?.logging);
		const ruleName = `${this.metricName} custom metric threshold check (${this.comparison} ${this.threshold})`;

		logger.startCheck(ruleName);
		logger.logProgress('Extracting class information from codebase');

		const violations: Violation[] = [];
		const allClasses = extractClassInfo(this.metricsBuilder.tsConfigFilePath);
		logger.logProgress(`Extracted ${allClasses.length} classes from codebase`);

		// Apply filters if any
		const filter = this.metricsBuilder.getFilter();
		const filteredClasses = filter ? filter.apply(allClasses) : allClasses;

		logger.logProgress(
			`Applied filters, ${filteredClasses.length} classes remaining for analysis`
		);

		// Check for empty test condition
		if (filteredClasses.length === 0 && !options?.allowEmptyTests) {
			const emptyViolation = new EmptyTestViolation([], 'extracted classes'); // X-TODO: fix 1st arg (empty array)
			logger.logViolation(emptyViolation.toString());
			logger.endCheck(ruleName, 1);
			return [emptyViolation];
		}

		logger.logProgress('Calculating custom metrics and checking thresholds');
		for (const classInfo of filteredClasses) {
			const metricValue = this.calculation(classInfo);
			logger.logMetric(
				`${this.metricName} (${classInfo.name})`,
				metricValue,
				this.threshold
			);

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
				const violation = new CustomMetricViolation(
					classInfo.name,
					classInfo.filePath,
					this.metricName,
					metricValue,
					`${comparisonText} ${this.threshold}`
				);
				violations.push(violation);
				logger.logViolation(violation.toString());
			}
		}

		logger.endCheck(ruleName, violations.length);
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

	async check(options?: CheckOptions): Promise<Violation[]> {
		const logger = new CheckLogger(options?.logging);
		const ruleName = `${this.metricName} custom metric assertion check`;

		logger.startCheck(ruleName);
		logger.logProgress('Extracting class information from codebase');

		const violations: Violation[] = [];
		const allClasses = extractClassInfo(this.metricsBuilder.tsConfigFilePath);
		logger.logProgress(`Extracted ${allClasses.length} classes from codebase`);

		// Apply filters if any
		const filter = this.metricsBuilder.getFilter();
		const filteredClasses = filter ? filter.apply(allClasses) : allClasses;

		logger.logProgress(
			`Applied filters, ${filteredClasses.length} classes remaining for analysis`
		);

		// Check for empty test condition
		if (filteredClasses.length === 0 && !options?.allowEmptyTests) {
			const emptyViolation = new EmptyTestViolation([], 'extracted classes'); // X-TODO: fix 1st arg (empty array)
			logger.logViolation(emptyViolation.toString());
			logger.endCheck(ruleName, 1);
			return [emptyViolation];
		}

		logger.logProgress('Calculating custom metrics and applying assertion logic');
		for (const classInfo of filteredClasses) {
			const metricValue = this.calculation(classInfo);
			logger.logMetric(`${this.metricName} (${classInfo.name})`, metricValue);

			const passes = this.assertion(metricValue, classInfo);

			if (!passes) {
				const violation = new CustomMetricViolation(
					classInfo.name,
					classInfo.filePath,
					this.metricName,
					metricValue,
					'failed custom assertion'
				);
				violations.push(violation);
				logger.logViolation(violation.toString());
			}
		}

		logger.endCheck(ruleName, violations.length);
		return violations;
	}
}
