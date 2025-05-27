import { Violation } from '../../common/assertion/violation';
import { ViolatingNode } from '../../files/assertion/matching-files';
import { ViolatingEdge } from '../../slices/assertion/admissible-edges';
import { ViolatingCycle } from '../../files/assertion/free-of-cycles';
import { ViolatingFileDependency } from '../../files/assertion/depend-on-files';
import { MetricViolation } from '../../metrics/assertion/metric-thresholds';
import { TestViolation } from './result-factory';

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
		const comparisonText =
			metric.comparison === 'below' ? 'not below threshold' : 'not above threshold';
		return {
			message: `${metric.className} has ${metric.metricName} value of ${metric.metricValue}, which is ${comparisonText} ${metric.threshold}`,
			details: metric,
		};
	}

	private static fromViolatingFile(file: ViolatingNode): TestViolation {
		return {
			message: `${file.projectedNode.label} should match ${file.checkPattern}`,
			details: file,
		};
	}

	private static fromViolatingEdge(edge: ViolatingEdge): TestViolation {
		return {
			message: `${edge.projectedEdge.sourceLabel} -> ${edge.projectedEdge.targetLabel} is not allowed`,
			details: edge,
		};
	}

	private static fromViolatingFileDependency(
		edge: ViolatingFileDependency
	): TestViolation {
		return {
			message: `${edge.dependency.sourceLabel} -> ${edge.dependency.targetLabel} is not allowed`,
			details: edge,
		};
	}

	private static fromViolatingCycle(cycle: ViolatingCycle): TestViolation {
		let cycleText = cycle.cycle[0].sourceLabel;
		cycle.cycle.forEach((c) => {
			cycleText += ' -> ' + c.targetLabel;
		});
		return {
			message: `Found cycle: ${cycleText}`,
			details: cycle,
		};
	}
}
