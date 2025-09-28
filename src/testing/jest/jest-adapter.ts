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

function isJestProject(): boolean {
	return typeof jest !== 'undefined';
}

export function extendJestMatchers(force: boolean = true) {
	// Unless we force it, only apply extend logic if its a jest project
	if (!force && !isJestProject()) {
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
