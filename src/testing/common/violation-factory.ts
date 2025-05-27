import { Violation } from '../../common/assertion/violation';
import { ViolatingNode } from '../../files/assertion/matching-files';
import { ViolatingEdge } from '../../slices/assertion/admissible-edges';
import { ViolatingCycle } from '../../files/assertion/free-of-cycles';
import { ViolatingFileDependency } from '../../files/assertion/depend-on-files';
import { MetricViolation } from '../../metrics/assertion/metric-thresholds';
import { TestViolation } from './result-factory';
import { ColorUtils } from './color-utils';

class UnknownTestViolation implements TestViolation {
	details: Object = Object();
	message: string = 'Unknown Violation found';
	constructor(details: Object = Object()) {
		this.details = details;
	}
}

export class ViolationFactory {
	public static from(violation: Violation): TestViolation {
		if (violation instanceof ViolatingNode) {
			return this.fromViolatingFile(violation);
		}
		if (violation instanceof ViolatingEdge) {
			return this.fromViolatingEdge(violation);
		}
		if (violation instanceof ViolatingCycle) {
			return this.fromViolatingCycle(violation);
		}
		if (violation instanceof ViolatingFileDependency) {
			return this.fromViolatingFileDependency(violation);
		}
		if (violation instanceof MetricViolation) {
			return this.fromMetricViolation(violation);
		}
		return new UnknownTestViolation(violation);
	}
	private static fromMetricViolation(metric: MetricViolation): TestViolation {
		const comparisonText = this.getComparisonDescription(metric.comparison);
		const message = `${ColorUtils.formatViolationType('Metric violation')} in class '${ColorUtils.cyan(metric.className)}':
   File: ${ColorUtils.formatFilePath(`${metric.filePath}:1:1`)}
   Metric: ${ColorUtils.formatMetricValue(metric.metricName)}
   Actual value: ${ColorUtils.formatMetricValue(metric.metricValue.toString())}
   Expected: ${ColorUtils.formatRule(`${comparisonText} ${metric.threshold}`)}`;

		return {
			message,
			details: metric,
		};
	}
	private static fromViolatingFile(file: ViolatingNode): TestViolation {
		const action = file.isNegated ? 'should not match' : 'should match';
		const message = `${ColorUtils.formatViolationType('File pattern violation')}:
   File: ${ColorUtils.formatFilePath(`${file.projectedNode.label}:1:1`)}
   Rule: ${ColorUtils.formatRule(`${action} pattern '${file.checkPattern}'`)}`;

		return {
			message,
			details: file,
		};
	}
	private static fromViolatingEdge(edge: ViolatingEdge): TestViolation {
		// Extract actual file paths from cumulatedEdges for more detailed reporting
		const actualFiles = edge.projectedEdge.cumulatedEdges.map((e) => ({
			source: e.source,
			target: e.target,
			importKinds: e.importKinds,
		}));

		// Create a comprehensive violation message
		let message = `${ColorUtils.formatViolationType('Slice dependency violation')}:
   From slice: ${ColorUtils.formatFilePath(`${edge.projectedEdge.sourceLabel}:1:1`)}
   To slice: ${ColorUtils.formatFilePath(`${edge.projectedEdge.targetLabel}:1:1`)}
   Rule: ${ColorUtils.formatRule('This dependency is not allowed')}`;

		// Add detailed file-level information if available
		if (actualFiles.length > 0) {
			message += `\n\n   ${ColorUtils.formatViolationType('Violating dependencies:')}`;
			actualFiles.forEach((file, index) => {
				const importInfo =
					file.importKinds && file.importKinds.length > 0
						? ` (${file.importKinds.join(', ')})`
						: '';
				message += `\n   ${index + 1}. ${ColorUtils.formatFilePath(`${file.source}:1:1`)} → ${ColorUtils.formatFilePath(`${file.target}:1:1`)}${importInfo}`;
			});
		}

		return {
			message,
			details: edge,
		};
	}
	private static fromViolatingFileDependency(
		edge: ViolatingFileDependency
	): TestViolation {
		const ruleDescription = edge.isNegated
			? 'This dependency should not exist'
			: 'This dependency violates the architecture rule';

		// Extract actual file paths from cumulatedEdges for more detailed reporting
		const actualFiles = edge.dependency.cumulatedEdges.map((e) => ({
			source: e.source,
			target: e.target,
			importKinds: e.importKinds,
		}));

		let message = `${ColorUtils.formatViolationType('File dependency violation')}:
   From pattern: ${ColorUtils.formatFilePath(`${edge.dependency.sourceLabel}:1:1`)}
   To pattern: ${ColorUtils.formatFilePath(`${edge.dependency.targetLabel}:1:1`)}
   Rule: ${ColorUtils.formatRule(ruleDescription)}`;

		// Add detailed file-level information if available
		if (actualFiles.length > 0) {
			message += `\n\n   ${ColorUtils.formatViolationType('Violating dependencies:')}`;
			actualFiles.forEach((file, index) => {
				const importInfo =
					file.importKinds && file.importKinds.length > 0
						? ` (${file.importKinds.join(', ')})`
						: '';
				message += `\n   ${index + 1}. ${ColorUtils.formatFilePath(`${file.source}:1:1`)} → ${ColorUtils.formatFilePath(`${file.target}:1:1`)}${importInfo}`;
			});
		}

		return {
			message,
			details: edge,
		};
	}
	private static fromViolatingCycle(cycle: ViolatingCycle): TestViolation {
		// Make each file in the cycle clickable with colors
		const coloredCycle = cycle.cycle
			.map((edge) => ColorUtils.formatFilePath(`${edge.sourceLabel}:1:1`))
			.concat(
				ColorUtils.formatFilePath(
					`${cycle.cycle[cycle.cycle.length - 1].targetLabel}:1:1`
				)
			)
			.join(` ${ColorUtils.gray('→')} `);

		let message = `${ColorUtils.formatViolationType('Circular dependency detected')}:
   Cycle: ${coloredCycle}
   Rule: ${ColorUtils.formatRule('Circular dependencies are not allowed')}`;

		// Add detailed file-level information for each edge in the cycle
		const hasDetailedFiles = cycle.cycle.some(
			(edge) => edge.cumulatedEdges && edge.cumulatedEdges.length > 0
		);
		if (hasDetailedFiles) {
			message += `\n\n   ${ColorUtils.formatViolationType('Detailed cycle dependencies:')}`;
			cycle.cycle.forEach((edge, index) => {
				if (edge.cumulatedEdges && edge.cumulatedEdges.length > 0) {
					message += `\n   ${index + 1}. ${ColorUtils.formatFilePath(`${edge.sourceLabel}:1:1`)} → ${ColorUtils.formatFilePath(`${edge.targetLabel}:1:1`)}`;
					edge.cumulatedEdges.forEach((file, fileIndex) => {
						const importInfo =
							file.importKinds && file.importKinds.length > 0
								? ` (${file.importKinds.join(', ')})`
								: '';
						message += `\n      ${String.fromCharCode(97 + fileIndex)}. ${ColorUtils.formatFilePath(`${file.source}:1:1`)} → ${ColorUtils.formatFilePath(`${file.target}:1:1`)}${importInfo}`;
					});
				}
			});
		}

		return {
			message,
			details: cycle,
		};
	}

	private static getComparisonDescription(comparison: string): string {
		switch (comparison) {
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
