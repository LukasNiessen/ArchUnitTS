import { Checkable, CheckOptions } from '../../common/fluentapi';
import { ResultFactory, TestResult } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';

/*
 * Extend Vitest. Vitest <5 also reads jest.Matchers (see jest-adapter), Vitest >=5 only reads vitest.Matchers.
 * No type params on purpose: Vitest 4 declares Matchers<T>, Vitest 5 Matchers<R, T>. All have defaults,
 * so a param-less declaration merges with both. Ignored if vitest is not installed.
 */
declare module 'vitest' {
	interface Matchers {
		toPassAsync(options?: CheckOptions): Promise<void>;
	}
}

function isVitestProject(): boolean {
	return typeof process !== 'undefined' && !!process.env.VITEST;
}

export function extendVitestMatchers(force: boolean = true) {
	// Unless we force it, only apply extend logic if its a vitest project
	if (!force && !isVitestProject()) {
		return;
	}

	if (typeof expect === 'undefined') {
		throw Error(`ArchUnitTS Vitest Integration Error: 'expect' is not defined globally.

**Vitest Hint:**

If you're using Vitest, you must have configured Vitest with \`globals: true\` in your \`vitest.config.ts\`. This means you need a \`vitest.config.ts\` file at project root with content that may look like this:

\`\`\`ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,  // This line matters !!
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
		include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
	},
});
\`\`\`

Without \`globals: true\`, the global \`expect\` function is not available, which prevents ArchUnitTS from extending Vitest with custom matchers like \`toPassAsync()\`.`);
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
