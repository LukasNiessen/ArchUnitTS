import { Checkable } from '../../common/fluentapi/checkable';
import { Violation } from '../../common/assertion/violation';
import { extractClassInfo } from '../extraction/extract-class-info';
import {
	LCOMMetric,
	LCOM96b,
	LCOM96a,
	LCOM1,
	LCOM2,
	LCOM3,
	LCOM4,
	LCOM5,
	LCOMStar,
} from '../calculation/lcom';
import { gatherMetricViolations } from '../assertion/metric-thresholds';
import {
	projectToMetricResults,
	byFolderPath,
	bySingleFile,
	byClassName,
	combineFilters,
} from '../projection/project-metrics';
import { ClassFilter, Metric } from '../extraction/interface';
import { MetricComparison } from './types';

/**
 * Entry point for code metrics analysis.
 *
 * @param tsConfigFilePath Optional path to tsconfig.json file
 * @returns A builder for configuring metrics analysis
 *
 * @example
 * ```typescript
 * // Check class cohesion using LCOM96b metric
 * const violations = await metrics()
 *   .lcom()
 *   .lcom96b()
 *   .shouldHaveCohesionAbove(0.7)
 *   .check();
 *
 * // Check cohesion for specific folder
 * const violations = await metrics()
 *   .inFolder('src/models')
 *   .lcom()
 *   .lcom96b()
 *   .shouldBeAbove(0.5)
 *   .check();
 * ```
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
	 * Get the combined filter for all applied filters
	 */
	public getFilter(): ClassFilter | null {
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
}

/**
 * Builder for LCOM metrics
 */
export class LCOMMetricsBuilder {
	constructor(readonly metricsBuilder: MetricsBuilder) {}

	public lcom96a(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOM96a());
	}

	public lcom96b(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOM96b());
	}

	public lcom1(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOM1());
	}

	public lcom2(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOM2());
	}

	public lcom3(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOM3());
	}

	public lcom4(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOM4());
	}

	public lcom5(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOM5());
	}

	public lcomstar(): LCOMThresholdBuilder {
		return new LCOMThresholdBuilder(this.metricsBuilder, new LCOMStar());
	}
}

/**
 * Builder for configuring LCOM metric thresholds
 */
export class LCOMThresholdBuilder {
	constructor(
		readonly metricsBuilder: MetricsBuilder,
		readonly metric: LCOMMetric
	) {}

	/**
	 * Classes should have cohesion above the specified threshold, strict-above (>)
	 */
	public shouldBeAbove(threshold: number): MetricCondition {
		return new MetricCondition(this.metricsBuilder, this.metric, threshold, 'above');
	}

	/**
	 * Classes should have LCOM below the specified threshold, inclusive-below (<=)
	 */
	public shouldBeBelowOrEqual(threshold: number): MetricCondition {
		return new MetricCondition(
			this.metricsBuilder,
			this.metric,
			threshold,
			'below-equal'
		);
	}

	/**
	 * Classes should have cohesion above the specified threshold, inclusive-above (>=)
	 */
	public shouldBeAboveOrEqual(threshold: number): MetricCondition {
		return new MetricCondition(
			this.metricsBuilder,
			this.metric,
			threshold,
			'above-equal'
		);
	}

	/**
	 * Classes should have LCOM below the specified threshold, strict-below (<)
	 */
	public shouldBeBelow(threshold: number): MetricCondition {
		return new MetricCondition(this.metricsBuilder, this.metric, threshold, 'below');
	}

	/**
	 * Classes should have LCOM equal to the specified threshold
	 */
	public shouldBe(threshold: number): MetricCondition {
		return new MetricCondition(this.metricsBuilder, this.metric, threshold, 'equal');
	}
}

/**
 * Final condition class implementing Checkable for metrics evaluation
 */
export class MetricCondition implements Checkable {
	constructor(
		readonly metricsBuilder: MetricsBuilder,
		readonly metric: Metric,
		readonly threshold: number,
		readonly comparison: MetricComparison
	) {}

	/**
	 * Check if classes violate the metric condition
	 */
	public async check(): Promise<Violation[]> {
		// Extract class information from the codebase
		const allClasses = extractClassInfo(this.metricsBuilder.tsConfigFilePath);

		// Apply filters if any
		const filter = this.metricsBuilder.getFilter();
		const classes = filter ? filter.apply(allClasses) : allClasses;

		// Project classes to metric results through the projection layer
		const metricResults = projectToMetricResults(
			classes,
			this.metric,
			this.threshold,
			this.comparison
		);

		// Return violations using the assertion layer
		return gatherMetricViolations(metricResults);
	}
}
