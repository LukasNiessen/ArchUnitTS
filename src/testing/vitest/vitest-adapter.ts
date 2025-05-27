import { Checkable } from '../../common/fluentapi/checkable';
import { ResultFactory, TestResult } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

interface VitestExpectExtension {
	toPassAsync(): Promise<TestResult>;
}

// Only declare module augmentation if vitest types are available
declare global {
	interface VitestAssertion extends VitestExpectExtension {}
}

export function extendVitestMatchers() {
	// Check if we're in a Vitest environment
	if (typeof expect === 'undefined' || !expect.extend || !('vi' in globalThis)) {
		return;
	}

	expect.extend({
		async toPassAsync(checkable: Checkable): Promise<TestResult> {
			if (!checkable) {
				return ResultFactory.error(
					'expected something checkable as an argument for expect()'
				);
			}
			const violations = await checkable.check();
			const testViolations = violations.map((v) => ViolationFactory.from(v));
			return ResultFactory.result(Boolean(this.isNot), testViolations);
		},
	});
}
