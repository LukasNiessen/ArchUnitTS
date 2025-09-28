import { Checkable, CheckOptions } from '../../common/fluentapi';
import { ResultFactory, TestResult } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

// Only declare module augmentation if vitest types are available
declare global {
	interface VitestAssertion {
		toPassAsync(options?: CheckOptions): Promise<TestResult>;
	}
}

function isVitestProject(): boolean {
	//return typeof process !== 'undefined' && !!process.env.VITEST;
	return 'vi' in globalThis;
}

export function extendVitestMatchers(force: boolean = true) {
	// Unless we force it, only apply extend logic if its a vitest project
	if (!force && !isVitestProject()) {
		return;
	}

	expect.extend({
		async toPassAsync(
			checkable: Checkable,
			options?: CheckOptions
		): Promise<TestResult> {
			if (!checkable) {
				return ResultFactory.error(
					'expected something checkable as an argument for expect()'
				);
			}
			const violations = await checkable.check(options);
			const testViolations = violations.map((v) => ViolationFactory.from(v));
			return ResultFactory.result(Boolean(this.isNot), testViolations);
		},
	});
}
