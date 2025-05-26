import { Violation } from '../../common/assertion/violation';
import { Checkable } from '../../common/fluentapi/checkable';
import { gatherMetricViolations } from '../assertion/metric-thresholds';
import {
	LCOM96a,
	LCOM96b,
	LCOM1,
	LCOM2,
	LCOM3,
	LCOM4,
	LCOM5,
	LCOMStar,
	LCOMMetric,
} from '../calculation/lcom';
import { extractClassInfo } from '../extraction/extract-class-info';
import { Metric } from '../extraction/interface';
import { projectToMetricResults } from '../projection/project-metrics';
import { MetricsBuilder } from './metrics';
import { MetricComparison } from './types';

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
