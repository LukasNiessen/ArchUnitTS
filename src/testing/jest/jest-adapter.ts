import { Checkable, CheckOptions } from '../../common/fluentapi';
import { ResultFactory, TestResult } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

/*
 * Extend Jest
 */
declare global {
	namespace jest {
		// tslint:disable-next-line:interface-name
		interface Matchers<R> {
			toPassAsync(options?: CheckOptions): Promise<R>;
		}
	}
}

export function extendJestMatchers() {
	// Check if we're in a Jest environment (not Vitest)
	if (typeof expect === 'undefined' || !expect.extend || typeof jest === 'undefined') {
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
