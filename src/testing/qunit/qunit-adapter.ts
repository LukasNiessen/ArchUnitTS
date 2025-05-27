import { Checkable } from '../../common/fluentapi/checkable';
import { ViolationFactory } from '../common/violation-factory';

// QUnit type declaration
interface QUnitStatic {
	extend: (target: QUnitAssert, mixin: Record<string, unknown>) => void;
	assert: QUnitAssert;
}

interface QUnitAssert {
	pushResult: (result: {
		result: boolean;
		actual: unknown;
		expected: unknown;
		message: string;
	}) => void;
	ok: (state: boolean, message?: string) => void;
}

declare const QUnit: QUnitStatic;

export function extendQUnitMatchers() {
	// QUnit doesn't have built-in matchers, so we provide helper functions
	if (typeof QUnit !== 'undefined') {
		QUnit.extend(QUnit.assert, {
			async toPassAsync(this: QUnitAssert, checkable: Checkable, message?: string) {
				if (!checkable) {
					this.pushResult({
						result: false,
						actual: undefined,
						expected: 'checkable object',
						message:
							message ||
							'expected something checkable as an argument for toPassAsync()',
					});
					return;
				}
				const violations = await checkable.check();
				const testViolations = violations.map((v) => ViolationFactory.from(v));
				const pass = violations.length === 0;

				this.pushResult({
					result: pass,
					actual: violations.length,
					expected: 0,
					message:
						message ||
						(pass
							? 'Architecture rule passed'
							: `Architecture rule violations:\n${testViolations.map((v) => v.message).join('\n')}`),
				});
			},
		});
	}
}

// Helper function for simpler usage
export async function expectToPassAsync(
	checkable: Checkable,
	assert: QUnitAssert,
	message?: string
) {
	if (!checkable) {
		assert.ok(
			false,
			message ||
				'expected something checkable as an argument for expectToPassAsync()'
		);
		return;
	}
	const violations = await checkable.check();
	const testViolations = violations.map((v) => ViolationFactory.from(v));
	const pass = violations.length === 0;

	assert.ok(
		pass,
		message ||
			(pass
				? 'Architecture rule passed'
				: `Architecture rule violations:\n${testViolations.map((v) => v.message).join('\n')}`)
	);
}
