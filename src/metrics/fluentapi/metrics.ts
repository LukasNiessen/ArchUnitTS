import { Checkable } from '../../common/fluentapi/checkable';
import { Violation } from '../../common/assertion/violation';
import { ClassInfo, extractClassInfo } from '../extraction/extract-class-info';
import { LCOMMetric, LCOM96b, LCOM96a } from '../calculation/lcom';
import { gatherMetricViolations } from '../assertion/metric-thresholds';

export type MetricComparison =
	| 'below'
	| 'above'
	| 'equal'
	| 'above-equal'
	| 'below-equal';

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
 * ```
 */
export const metrics = (tsConfigFilePath?: string): MetricsBuilder => {
	return new MetricsBuilder(tsConfigFilePath);
};

/**
 * Builder for metrics analysis
 */
export class MetricsBuilder {
	constructor(readonly tsConfigFilePath?: string) {}

	/**
	 * Configure LCOM (Lack of Cohesion of Methods) metrics
	 */
	public lcom(): LCOMMetricsBuilder {
		return new LCOMMetricsBuilder(this);
	}

	/**
	 * Configure metrics for specific classes
	 * @param pattern Regular expression pattern to match class names
	 */
	public forClasses(pattern: string): MetricsBuilder {
		// This will be implemented for class filtering
		return this;
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
}

/**
 * Builder for configuring metric thresholds
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
		readonly metric: LCOMMetric,
		readonly threshold: number,
		readonly comparison: MetricComparison
	) {}

	/**
	 * Check if classes violate the metric condition
	 */
	public async check(): Promise<Violation[]> {
		// Extract class information from the codebase
		const classes = extractClassInfo(this.metricsBuilder.tsConfigFilePath);

		//console.log('XXX classes:', classes);

		// Return violations for classes that don't meet the metric threshold
		return gatherMetricViolations(
			classes,
			this.metric,
			this.threshold,
			this.comparison
		);
	}
}
