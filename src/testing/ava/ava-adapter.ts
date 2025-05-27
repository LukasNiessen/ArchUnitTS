/*
import { Checkable } from '../../common/fluentapi/checkable';
import { ViolationFactory } from '../common/violation-factory';

// AVA doesn't support custom matchers, so we provide helper functions
export function extendAvaMatchers() {
	// AVA doesn't support extending matchers, so this is a no-op
	// Users should use expectToPassAsync or checkArchRule directly
}
export async function expectToPassAsync(checkable: Checkable) {
	if (!checkable) {
		throw new Error(
			'expected something checkable as an argument for expectToPassAsync()'
		);
	}
	const violations = await checkable.check();
	if (violations.length > 0) {
		const testViolations = violations.map((v) => ViolationFactory.from(v));
		const messages = testViolations.map((v) => v.message).join('\n');
		throw new Error(`Architecture rule violations found:\n${messages}`);
	}
}

export async function checkArchRule(checkable: Checkable): Promise<string[]> {
	if (!checkable) {
		throw new Error(
			'expected something checkable as an argument for checkArchRule()'
		);
	}
	const violations = await checkable.check();
	const testViolations = violations.map((v) => ViolationFactory.from(v));
	return testViolations.map((v) => v.message);
}
*/
