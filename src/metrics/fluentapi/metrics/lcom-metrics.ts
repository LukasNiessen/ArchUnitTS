import { Violation } from '../../../common/assertion/violation';
import { Checkable } from '../../../common/fluentapi/checkable';
import { gatherMetricViolations } from '../../assertion/metric-thresholds';
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
} from '../../calculation/lcom';
import { extractClassInfo } from '../../extraction/extract-class-info';
import { Metric } from '../../extraction/interface';
import { projectToMetricResults } from '../../projection/project-metrics';
import { MetricsBuilder } from '../metrics';
import { MetricComparison } from '../types';

/**
 * Project summary for LCOM metrics
 */
export interface LCOMMetricsSummary {
	totalClasses: number;
	averageLCOM96a: number;
	averageLCOM96b: number;
	averageLCOM1: number;
	averageLCOM2: number;
	averageLCOM3: number;
	averageLCOM4: number;
	averageLCOM5: number;
	averageLCOMStar: number;
	highCohesionClassCount: number; // Classes with LCOM* < 0.3
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

	/**
	 * Get project-wide LCOM metrics summary
	 */
	public async getProjectSummary(): Promise<LCOMMetricsSummary> {
		// Extract class information from the codebase
		const allClasses = extractClassInfo(this.metricsBuilder.tsConfigFilePath);

		// Apply filters if any
		const filter = this.metricsBuilder.getFilter();
		const classes = filter ? filter.apply(allClasses) : allClasses;

		// Initialize all LCOM metrics
		const lcom96a = new LCOM96a();
		const lcom96b = new LCOM96b();
		const lcom1 = new LCOM1();
		const lcom2 = new LCOM2();
		const lcom3 = new LCOM3();
		const lcom4 = new LCOM4();
		const lcom5 = new LCOM5();
		const lcomStar = new LCOMStar();

		// Calculate metrics for each class
		const totalClasses = classes.length;

		if (totalClasses === 0) {
			return {
				totalClasses: 0,
				averageLCOM96a: 0,
				averageLCOM96b: 0,
				averageLCOM1: 0,
				averageLCOM2: 0,
				averageLCOM3: 0,
				averageLCOM4: 0,
				averageLCOM5: 0,
				averageLCOMStar: 0,
				highCohesionClassCount: 0,
			};
		}

		// Calculate sum of each metric
		let sumLCOM96a = 0;
		let sumLCOM96b = 0;
		let sumLCOM1 = 0;
		let sumLCOM2 = 0;
		let sumLCOM3 = 0;
		let sumLCOM4 = 0;
		let sumLCOM5 = 0;
		let sumLCOMStar = 0;
		let highCohesionCount = 0;

		for (const classInfo of classes) {
			// Calculate all LCOM metrics for each class
			const lcom96aValue = lcom96a.calculate(classInfo);
			const lcom96bValue = lcom96b.calculate(classInfo);
			const lcom1Value = lcom1.calculate(classInfo);
			const lcom2Value = lcom2.calculate(classInfo);
			const lcom3Value = lcom3.calculate(classInfo);
			const lcom4Value = lcom4.calculate(classInfo);
			const lcom5Value = lcom5.calculate(classInfo);
			const lcomStarValue = lcomStar.calculate(classInfo);

			// Add to sums
			sumLCOM96a += lcom96aValue;
			sumLCOM96b += lcom96bValue;
			sumLCOM1 += lcom1Value;
			sumLCOM2 += lcom2Value;
			sumLCOM3 += lcom3Value;
			sumLCOM4 += lcom4Value;
			sumLCOM5 += lcom5Value;
			sumLCOMStar += lcomStarValue;

			// Count classes with high cohesion (LCOM* < 0.3)
			if (lcomStarValue < 0.3) {
				highCohesionCount++;
			}
		}
		// Calculate averages and ensure no negative values
		return {
			totalClasses,
			averageLCOM96a: Math.max(0, sumLCOM96a / totalClasses),
			averageLCOM96b: Math.max(0, sumLCOM96b / totalClasses),
			averageLCOM1: Math.max(0, sumLCOM1 / totalClasses),
			averageLCOM2: Math.max(0, sumLCOM2 / totalClasses),
			averageLCOM3: Math.max(0, sumLCOM3 / totalClasses),
			averageLCOM4: Math.max(0, sumLCOM4 / totalClasses),
			averageLCOM5: Math.max(0, sumLCOM5 / totalClasses),
			averageLCOMStar: Math.max(0, sumLCOMStar / totalClasses),
			highCohesionClassCount: highCohesionCount,
		};
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
