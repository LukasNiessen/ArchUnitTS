import { Checkable } from '../../common/fluentapi/checkable';
import { ResultFactory, TestResult } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

interface VitestExpectExtension {
	toPassAsync(): TestResult;
}

// Only declare module augmentation if vitest types are available
declare global {
	interface VitestAssertion extends VitestExpectExtension {}
}

export function extendVitestMatchers() {
	// For Vitest, we need to check if expect.extend exists
	if (typeof expect !== 'undefined' && 'extend' in expect) {
		(expect as unknown as { extend: (matchers: Record<string, unknown>) => void }).extend({
			async toPassAsync(checkable: Checkable): Promise<TestResult> {
				if (!checkable) {
					return ResultFactory.error(
						'expected something checkable as an argument for expect()'
					);
				}
				const violations = await checkable.check();
				const testViolations = violations.map((v) => ViolationFactory.from(v));
				return ResultFactory.result(Boolean((this as unknown as { isNot?: boolean }).isNot), testViolations);
			},
		});
	}
}
