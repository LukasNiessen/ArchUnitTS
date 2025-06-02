import { Checkable, CheckOptions } from '../../common/fluentapi/checkable';
import { ResultFactory } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

export function extendJasmineMatchers() {
	// Check if we're in a Jasmine environment before extending
	if (typeof jasmine !== 'undefined') {
		const jasmineObj = jasmine as unknown as {
			addMatchers?: (matchers: Record<string, unknown>) => void;
		};

		const beforeEachFn = (
			globalThis as unknown as { beforeEach?: (fn: () => void) => void }
		).beforeEach;

		if (jasmineObj.addMatchers && beforeEachFn) {
			beforeEachFn(() => {
				jasmineObj.addMatchers!({
					toPassAsync: () => ({
						compare: async (checkable: Checkable, options?: CheckOptions) => {
							if (!checkable) {
								return {
									pass: false,
									message:
										'expected something checkable as an argument for expect()',
								};
							}
							const violations = await checkable.check(options);
							const testViolations = violations.map((v) =>
								ViolationFactory.from(v)
							);
							const result = ResultFactory.result(false, testViolations);
							return {
								pass: result.pass,
								message: result.message(),
							};
						},
					}),
				});
			});
		}
	}
}
