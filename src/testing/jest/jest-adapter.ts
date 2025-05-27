import { Checkable } from '../../common/fluentapi/checkable';
import { ResultFactory, TestResult } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

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

export function extendJestMatchers() {
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
