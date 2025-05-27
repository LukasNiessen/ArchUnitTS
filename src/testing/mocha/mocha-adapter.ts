import { Checkable } from '../../common/fluentapi/checkable';
import { ViolationFactory } from '../common/violation-factory';

// Mocha global type definition
interface MochaGlobal {
	toPassAsync?: (checkable: Checkable) => Promise<void>;
}

export function extendMochaMatchers() {
	// Mocha doesn't have built-in matchers like Jest/Jasmine
	// We'll add a global helper function for users to use
	if (typeof global !== 'undefined') {
		const mochaGlobal = global as unknown as MochaGlobal;
		mochaGlobal.toPassAsync = async (checkable: Checkable) => {
			if (!checkable) {
				throw new Error(
					'expected something checkable as an argument for toPassAsync()'
				);
			}
			const violations = await checkable.check();
			if (violations.length > 0) {
				const testViolations = violations.map((v) => ViolationFactory.from(v));
				const messages = testViolations.map((v) => v.message).join('\n');
				throw new Error(`Architecture rule violations found:\n${messages}`);
			}
		};
	}
}

// Helper function for more natural syntax in Mocha
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
