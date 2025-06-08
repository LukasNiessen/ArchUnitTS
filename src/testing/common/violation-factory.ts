import { Violation, EmptyTestViolation } from '../../common/assertion';
import {
	ViolatingNode,
	ViolatingCycle,
	ViolatingFileDependency,
	CustomFileViolation,
} from '../../files/assertion';
import { ViolatingEdge } from '../../slices/assertion';
import { MetricViolation } from '../../metrics/assertion';
import { FileCountViolation } from '../../metrics/fluentapi/metrics/count-metrics';
import { TestViolation } from './result-factory';
import { ColorUtils } from './color-utils';
import { getPatternString } from '../../common/regex-factory';
import { Filter } from '../../common';
import path from 'path';

class UnknownTestViolation implements TestViolation {
	details: Object = Object();
	message: string = 'Unknown Violation found';
	constructor(details: Object = Object()) {
		this.details = details;
	}
}

export class ViolationFactory {
	// Convert relative path to absolute path
	private static preparePath(relativePath: string): string {
		const makePathAbsolute = true;
		if (!makePathAbsolute) {
			return path.normalize(relativePath);
		}
		// If the path is already absolute (contains : or starts with /), return it
		if (relativePath.includes(':') || relativePath.startsWith('/')) {
			return path.normalize(relativePath);
		}

		// For relative paths, use Node.js path handling
		// This will resolve against the current working directory
		try {
			const path = require('path');
			const cwd = process.cwd();
			// Convert to forward slashes for better IDE clickability
			return path.normalize(path.resolve(cwd, relativePath));
		} catch (error) {
			// Fallback in case we're not in Node environment
			return path.normalize(relativePath);
		}
	}

	public static from(violation: Violation): TestViolation {
		if (violation instanceof ViolatingNode) {
			return this.fromViolatingFile(violation);
		}
		if (violation instanceof EmptyTestViolation) {
			return this.fromEmptyTestViolation(violation);
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
		if (violation instanceof FileCountViolation) {
			return this.fromFileCountViolation(violation);
		}
		if (violation instanceof CustomFileViolation) {
			return this.fromCustomFileViolation(violation);
		}
		return new UnknownTestViolation(violation);
	}
	private static fromMetricViolation(metric: MetricViolation): TestViolation {
		const comparisonText = this.getComparisonDescription(metric.comparison);
		const message = `${ColorUtils.formatViolationType('Metric violation')} in class '${ColorUtils.cyan(metric.className)}':
   File: ${ColorUtils.formatFilePath(`${this.preparePath(metric.filePath)}:1:1`)}
   Metric: ${ColorUtils.formatMetricValue(metric.metricName)}
   Actual value: ${ColorUtils.formatMetricValue(metric.metricValue.toString())}
   Expected: ${ColorUtils.formatRule(`${comparisonText} ${metric.threshold}`)}`;

		return {
			message,
			details: metric,
		};
	}
	private static fromFileCountViolation(violation: FileCountViolation): TestViolation {
		const comparisonText = this.getComparisonDescription(violation.comparison);
		const message = `${ColorUtils.formatViolationType('File count violation')}:
   File: ${ColorUtils.formatFilePath(`${this.preparePath(violation.filePath)}:1:1`)}
   Metric: ${ColorUtils.formatMetricValue(violation.metricName)}
   Actual value: ${ColorUtils.formatMetricValue(violation.metricValue.toString())}
   Expected: ${ColorUtils.formatRule(`${comparisonText} ${violation.threshold}`)}`;

		return {
			message,
			details: violation,
		};
	}
	private static fromCustomFileViolation(
		violation: CustomFileViolation
	): TestViolation {
		const message = `${ColorUtils.formatViolationType('Custom file condition violation')}:
   File: ${ColorUtils.formatFilePath(`${this.preparePath(violation.fileInfo.path)}:1:1`)}
   Rule: ${ColorUtils.formatRule(violation.message)}
   
   ${ColorUtils.dim('File details:')}
   ${ColorUtils.dim(`• Name: ${violation.fileInfo.name}`)}
   ${ColorUtils.dim(`• Extension: ${violation.fileInfo.extension}`)}
   ${ColorUtils.dim(`• Directory: ${this.preparePath(violation.fileInfo.directory)}`)}
   ${ColorUtils.dim(`• Lines of code: ${violation.fileInfo.linesOfCode}`)}`;

		return {
			message,
			details: violation,
		};
	}
	private static fromViolatingFile(file: ViolatingNode): TestViolation {
		const action = file.isNegated ? 'should not match' : 'should match';
		const message = `${ColorUtils.formatViolationType('File pattern violation')}:
   File: ${ColorUtils.formatFilePath(`${this.preparePath(file.projectedNode.label)}:1:1`)}
   Rule: ${ColorUtils.formatRule(`${action} pattern '${file.checkPattern}'`)}`;

		return {
			message,
			details: file,
		};
	}

	private static fromEmptyTestViolation(emptyTest: EmptyTestViolation): TestViolation {
		let patternString = '';
		const filters = emptyTest.filters;
		if (filters.length > 0) {
			if (typeof filters[0] === 'string') {
				patternString = filters.join(',');
			} else {
				patternString = (filters as Filter[])
					.map((filter) => getPatternString(filter.regExp))
					.join(', ');
			}
		}

		const message = `${ColorUtils.formatViolationType('Empty test violation')}:
   ${ColorUtils.formatRule('No files found matching the specified pattern(s)')}
   Patterns: ${ColorUtils.formatMetricValue(patternString)}
   
   ${ColorUtils.yellow('This usually indicates:')}
   ${ColorUtils.dim('• Pattern is too restrictive or incorrect')}
   ${ColorUtils.dim('• Files might not exist in the expected location')}
   ${ColorUtils.dim('• Test is not actually testing anything')}
   
   ${ColorUtils.cyan('To fix:')}
   ${ColorUtils.dim('• Verify the patterns match existing files')}
   ${ColorUtils.dim('• Use .check({ allowEmptyTests: true }) to disable this check')}`;

		return {
			message,
			details: emptyTest,
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
   From slice: ${ColorUtils.formatFilePath(`${this.preparePath(edge.projectedEdge.sourceLabel)}:1:1`)}
   To slice: ${ColorUtils.formatFilePath(`${this.preparePath(edge.projectedEdge.targetLabel)}:1:1`)}
   Rule: ${ColorUtils.formatRule('This dependency is not allowed')}`;

		// Add detailed file-level information if available
		if (actualFiles.length > 0) {
			message += `\n\n   ${ColorUtils.formatViolationType('Violating dependencies:')}`;
			actualFiles.forEach((file, index) => {
				const importInfo =
					file.importKinds && file.importKinds.length > 0
						? ` (${file.importKinds.join(', ')})`
						: '';
				message += `\n   ${index + 1}. ${ColorUtils.formatFilePath(`${this.preparePath(file.source)}:1:1`)} → ${ColorUtils.formatFilePath(`${this.preparePath(file.target)}:1:1`)}${importInfo}`;
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
   From pattern: ${ColorUtils.formatFilePath(`${this.preparePath(edge.dependency.sourceLabel)}:1:1`)}
   To pattern: ${ColorUtils.formatFilePath(`${this.preparePath(edge.dependency.targetLabel)}:1:1`)}
   Rule: ${ColorUtils.formatRule(ruleDescription)}`;

		// Add detailed file-level information if available
		if (actualFiles.length > 0) {
			message += `\n\n   ${ColorUtils.formatViolationType('Violating dependencies:')}`;
			actualFiles.forEach((file, index) => {
				const importInfo =
					file.importKinds && file.importKinds.length > 0
						? ` (${file.importKinds.join(', ')})`
						: '';
				message += `\n   ${index + 1}. ${ColorUtils.formatFilePath(`${this.preparePath(file.source)}:1:1`)} → ${ColorUtils.formatFilePath(`${this.preparePath(file.target)}:1:1`)}${importInfo}`;
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
			.map((edge) =>
				ColorUtils.formatFilePath(`${this.preparePath(edge.sourceLabel)}:1:1`)
			)
			.concat(
				ColorUtils.formatFilePath(
					`${this.preparePath(cycle.cycle[cycle.cycle.length - 1].targetLabel)}:1:1`
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
					message += `\n   ${index + 1}. ${ColorUtils.formatFilePath(`${this.preparePath(edge.sourceLabel)}:1:1`)} → ${ColorUtils.formatFilePath(`${this.preparePath(edge.targetLabel)}:1:1`)}`;
					edge.cumulatedEdges.forEach((file, fileIndex) => {
						const importInfo =
							file.importKinds && file.importKinds.length > 0
								? ` (${file.importKinds.join(', ')})`
								: '';
						message += `\n      ${String.fromCharCode(97 + fileIndex)}. ${ColorUtils.formatFilePath(`${this.preparePath(file.source)}:1:1`)} → ${ColorUtils.formatFilePath(`${this.preparePath(file.target)}:1:1`)}${importInfo}`;
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
