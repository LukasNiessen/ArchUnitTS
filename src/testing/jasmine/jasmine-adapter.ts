import { Checkable, CheckOptions } from '../../common/fluentapi';
import { ResultFactory } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

function isJasmineProject(): boolean {
	return typeof jasmine !== 'undefined';
}

export function extendJasmineMatchers(force: boolean = true) {
	// Unless we force it, only apply extend logic if its a jasmine project
	if (!force && !isJasmineProject()) {
		return;
	}

	const jasmineObj = jasmine as unknown as {
		addMatchers?: (matchers: Record<string, unknown>) => void;
	};

	// const beforeEachFn = (
	// 	globalThis as unknown as { beforeEach?: (fn: () => void) => void }
	// ).beforeEach;

	const beforeEachFn = (
		beforeEach as unknown as { beforeEach?: (fn: () => void) => void }
	).beforeEach;

	if (jasmineObj && beforeEachFn) {
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
