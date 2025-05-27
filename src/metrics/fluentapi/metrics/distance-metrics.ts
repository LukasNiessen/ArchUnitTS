import { Checkable } from '../../../common/fluentapi/checkable';
import { Violation } from '../../../common/assertion/violation';
import {
	Abstractness,
	Instability,
	DistanceFromMainSequence,
	DistanceMetric,
	calculateDistanceMetricsForProject,
	CouplingFactor,
	NormalizedDistance,
} from '../../calculation/distance';
import { extractEnhancedClassInfo } from '../../extraction/extract-class-info';
import { MetricComparison } from '../types';
import type { ExportOptions, ProjectMetricsSummary } from '../export-utils';
import * as path from 'path';

/**
 * Project summary for distance metrics
 */
export interface DistanceMetricsSummary {
	totalFiles: number;
	averageAbstractness: number;
	averageInstability: number;
	averageDistance: number;
	averageCouplingFactor: number;
	averageNormalizedDistance: number;
	filesOnMainSequence: number;
}

/**
 * Builder for distance metrics like abstractness, instability, and distance from main sequence
 */
export class DistanceMetricsBuilder {
	private targetFile?: string;
	private targetFolder?: string;

	constructor(readonly tsConfigFilePath?: string) {}

	/**
	 * Target a specific file for distance metrics analysis
	 */
	public forFile(fileName: string): DistanceMetricsBuilder {
		this.targetFile = fileName;
		return this;
	}

	/**
	 * Target files in a specific folder for distance metrics analysis
	 */
	public inFolder(folderPath: string): DistanceMetricsBuilder {
		this.targetFolder = folderPath;
		return this;
	}

	/**
	 * Configure abstractness metric (A)
	 */
	public abstractness(): DistanceThresholdBuilder {
		return new DistanceThresholdBuilder(
			this.tsConfigFilePath,
			new Abstractness(),
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Configure instability metric (I)
	 */
	public instability(): DistanceThresholdBuilder {
		return new DistanceThresholdBuilder(
			this.tsConfigFilePath,
			new Instability(),
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Configure distance from main sequence metric (D)
	 */
	public distanceFromMainSequence(): DistanceThresholdBuilder {
		return new DistanceThresholdBuilder(
			this.tsConfigFilePath,
			new DistanceFromMainSequence(),
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Configure coupling factor metric (CF)
	 */
	public couplingFactor(): DistanceThresholdBuilder {
		return new DistanceThresholdBuilder(
			this.tsConfigFilePath,
			new CouplingFactor(),
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Configure normalized distance metric (ND)
	 */
	public normalizedDistance(): DistanceThresholdBuilder {
		return new DistanceThresholdBuilder(
			this.tsConfigFilePath,
			new NormalizedDistance(),
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Check if components are not in the Zone of Pain (concrete & stable)
	 */
	public notInZoneOfPain(): ZoneCondition {
		return new ZoneCondition(
			this.tsConfigFilePath,
			'zone-of-pain',
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Check if components are not in the Zone of Uselessness (abstract & unstable)
	 */
	public notInZoneOfUselessness(): ZoneCondition {
		return new ZoneCondition(
			this.tsConfigFilePath,
			'zone-of-uselessness',
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Calculate comprehensive distance metrics summary
	 */
	public async summary(): Promise<DistanceMetricsSummary> {
		const results = await calculateDistanceMetricsForProject(this.tsConfigFilePath);
		return results.projectSummary;
	}

	/**
	 * Export distance metrics summary as HTML file
	 */
	public async exportAsHTML(
		outputPath?: string,
		options?: Partial<ExportOptions>
	): Promise<void> {
		const { MetricsExporter } = await import('../export-utils');
		const summary = await this.summary();

		const projectSummary: ProjectMetricsSummary = {
			distance: summary,
		};

		// Set default output path if not provided
		const defaultPath = path.join('dist', 'distance-metrics-report.html');
		const finalOutputPath = outputPath || defaultPath;

		const exportOptions = {
			outputPath: finalOutputPath.endsWith('.html')
				? finalOutputPath
				: finalOutputPath + '.html',
			title: 'Distance Metrics Report',
			includeTimestamp: true,
			...options,
		};

		await MetricsExporter.exportAsHTML(projectSummary, exportOptions);
	}
}

/**
 * Builder for configuring distance metric thresholds
 */
export class DistanceThresholdBuilder {
	constructor(
		readonly tsConfigFilePath: string | undefined,
		readonly metric: DistanceMetric,
		readonly targetFile?: string,
		readonly targetFolder?: string
	) {}

	/**
	 * Metric should be above the specified threshold (>)
	 */
	public shouldBeAbove(threshold: number): DistanceCondition {
		return new DistanceCondition(
			this.tsConfigFilePath,
			this.metric,
			threshold,
			'above',
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Metric should be below the specified threshold (<)
	 */
	public shouldBeBelow(threshold: number): DistanceCondition {
		return new DistanceCondition(
			this.tsConfigFilePath,
			this.metric,
			threshold,
			'below',
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Metric should be equal to the specified threshold (=)
	 */
	public shouldEqual(threshold: number): DistanceCondition {
		return new DistanceCondition(
			this.tsConfigFilePath,
			this.metric,
			threshold,
			'equal',
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Metric should be at least the specified threshold (>=)
	 */
	public shouldBeAboveOrEqual(threshold: number): DistanceCondition {
		return new DistanceCondition(
			this.tsConfigFilePath,
			this.metric,
			threshold,
			'above-equal',
			this.targetFile,
			this.targetFolder
		);
	}

	/**
	 * Metric should be at most the specified threshold (<=)
	 */
	public shouldBeBelowOrEqual(threshold: number): DistanceCondition {
		return new DistanceCondition(
			this.tsConfigFilePath,
			this.metric,
			threshold,
			'below-equal',
			this.targetFile,
			this.targetFolder
		);
	}
}

/**
 * Final condition class implementing Checkable for distance metrics evaluation
 */
export class DistanceCondition implements Checkable {
	constructor(
		readonly tsConfigFilePath: string | undefined,
		readonly metric: DistanceMetric,
		readonly threshold: number,
		readonly comparison: MetricComparison,
		readonly targetFile?: string,
		readonly targetFolder?: string
	) {}

	/**
	 * Check if files violate the distance metric condition
	 */
	public async check(): Promise<Violation[]> {
		// Analyze the project
		const analysisResults = await extractEnhancedClassInfo(this.tsConfigFilePath);

		// Filter results if needed
		let filteredResults = analysisResults;
		if (this.targetFile) {
			filteredResults = analysisResults.filter((result) =>
				result.filePath.includes(this.targetFile!)
			);
		} else if (this.targetFolder) {
			filteredResults = analysisResults.filter((result) =>
				result.filePath.includes(this.targetFolder!)
			);
		}

		// Calculate metrics for each file and check threshold
		const violations: Violation[] = [];

		for (const result of filteredResults) {
			const metricValue = this.metric.calculateForFile(result);
			let isViolation = false;

			switch (this.comparison) {
				case 'above':
					isViolation = !(metricValue > this.threshold);
					break;
				case 'below':
					isViolation = !(metricValue < this.threshold);
					break;
				case 'equal':
					isViolation = !(metricValue === this.threshold);
					break;
				case 'above-equal':
					isViolation = !(metricValue >= this.threshold);
					break;
				case 'below-equal':
					isViolation = !(metricValue <= this.threshold);
					break;
			}

			if (isViolation) {
				violations.push({
					message: `File ${result.filePath} has a ${this.metric.name} value of ${metricValue.toFixed(2)}, which violates the specified threshold of ${this.threshold} (expected is ${this.comparison})`,
					filePath: result.filePath,
					metric: this.metric.name,
					value: metricValue,
					threshold: this.threshold,
					comparison: this.comparison,
				});
			}
		}

		return violations;
	}
}

/**
 * Condition for checking if components are in architectural zones
 */
export class ZoneCondition implements Checkable {
	constructor(
		readonly tsConfigFilePath: string | undefined,
		readonly zoneType: 'zone-of-pain' | 'zone-of-uselessness',
		readonly targetFile?: string,
		readonly targetFolder?: string
	) {}

	/**
	 * Check if files are in the specified architectural zone
	 */
	public async check(): Promise<Violation[]> {
		// Analyze the project
		const analysisResults = await extractEnhancedClassInfo(this.tsConfigFilePath);

		// Filter results if needed
		let filteredResults = analysisResults;
		if (this.targetFile) {
			filteredResults = analysisResults.filter((result) =>
				result.filePath.includes(this.targetFile!)
			);
		} else if (this.targetFolder) {
			filteredResults = analysisResults.filter((result) =>
				result.filePath.includes(this.targetFolder!)
			);
		}

		const abstractness = new Abstractness();
		const instability = new Instability();
		const violations: Violation[] = [];

		for (const result of filteredResults) {
			const abstractnessValue = abstractness.calculateForFile(result);
			const instabilityValue = instability.calculateForFile(result);
			let isViolation = false;

			if (this.zoneType === 'zone-of-pain') {
				// Zone of Pain: concrete (low abstractness) but stable (low instability)
				isViolation = abstractnessValue < 0.3 && instabilityValue < 0.3;
			} else {
				// Zone of Uselessness: abstract (high abstractness) but unstable (high instability)
				isViolation = abstractnessValue > 0.7 && instabilityValue > 0.7;
			}

			if (isViolation) {
				violations.push({
					message: `File ${result.filePath} is in the ${this.zoneType.replace(/-/g, ' ')} (A=${abstractnessValue.toFixed(2)}, I=${instabilityValue.toFixed(2)})`,
					filePath: result.filePath,
					metric: this.zoneType,
					abstractness: abstractnessValue,
					instability: instabilityValue,
				});
			}
		}

		return violations;
	}
}
