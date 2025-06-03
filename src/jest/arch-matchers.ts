import { Checkable } from '../common/fluentapi';
import { Violation } from '../common/assertion';
import {
	ViolatingNode,
	ViolatingCycle,
	ViolatingFileDependency,
} from '../files/assertion';
import { ViolatingEdge } from '../slices/assertion';
import { MetricViolation } from '../metrics/assertion';
import { ResultFactory, ViolationFactory } from '../testing/common';

/*
 * Extend Jest
 */
declare global {
	namespace jest {
		// tslint:disable-next-line:interface-name
		interface Matchers<R> {
			toPassAsync(): Promise<R>;
		}
	}
}

interface JestResult {
	pass: boolean;
	message: () => string;
}

/*
 * Matcher - Legacy types for backward compatibility
 */

export interface JestViolation {
	message: string;
	details: Object;
}

export class JestViolationFactory {
	public static from(violation: Violation): JestViolation {
		// Use the generic violation factory and convert to Jest format
		const testViolation = ViolationFactory.from(violation);
		return {
			message: testViolation.message,
			details: testViolation.details,
		};
	}

	// Keep legacy methods for backward compatibility but mark as deprecated
	/** @deprecated Use ViolationFactory.from() instead */
	private static fromMetricViolation(metric: MetricViolation): JestViolation {
		const testViolation = ViolationFactory.from(metric);
		return { message: testViolation.message, details: testViolation.details };
	}

	/** @deprecated Use ViolationFactory.from() instead */
	private static fromViolatingFile(file: ViolatingNode): JestViolation {
		const testViolation = ViolationFactory.from(file);
		return { message: testViolation.message, details: testViolation.details };
	}

	/** @deprecated Use ViolationFactory.from() instead */
	private static fromViolatingEdge(edge: ViolatingEdge): JestViolation {
		const testViolation = ViolationFactory.from(edge);
		return { message: testViolation.message, details: testViolation.details };
	}

	/** @deprecated Use ViolationFactory.from() instead */
	private static fromViolatingFileDependency(
		edge: ViolatingFileDependency
	): JestViolation {
		const testViolation = ViolationFactory.from(edge);
		return { message: testViolation.message, details: testViolation.details };
	}

	/** @deprecated Use ViolationFactory.from() instead */
	private static fromViolatingCycle(cycle: ViolatingCycle): JestViolation {
		const testViolation = ViolationFactory.from(cycle);
		return { message: testViolation.message, details: testViolation.details };
	}
}

export class JestResultFactory {
	public static result(
		shouldNotPass: boolean,
		violations: JestViolation[]
	): JestResult {
		// Use the generic ResultFactory and convert to Jest format
		const testViolations = violations.map((v) => ({
			message: v.message,
			details: v.details,
		}));
		const result = ResultFactory.result(shouldNotPass, testViolations);
		return {
			pass: result.pass,
			message: result.message,
		};
	}

	public static error(message: string): JestResult {
		const result = ResultFactory.error(message);
		return {
			pass: result.pass,
			message: result.message,
		};
	}
}

export function extendJestMatchers() {
	expect.extend({
		async toPassAsync(checkable: Checkable): Promise<JestResult> {
			if (!checkable) {
				return JestResultFactory.error(
					'expected something checkable as an argument for expect()'
				);
			}
			const violations = await checkable.check();
			const jestViolations = violations.map((v) => JestViolationFactory.from(v));
			return JestResultFactory.result(Boolean(this.isNot), jestViolations); // Ensure this.isNot is a boolean
		},
	});
}
