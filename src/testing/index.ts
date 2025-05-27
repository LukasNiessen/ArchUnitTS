// Auto-detection and setup for different testing frameworks
import { extendJestMatchers } from './jest/jest-adapter';
import { extendJasmineMatchers } from './jasmine/jasmine-adapter';
import { extendVitestMatchers } from './vitest/vitest-adapter';
import { extendMochaMatchers } from './mocha/mocha-adapter';
import { extendQUnitMatchers } from './qunit/qunit-adapter';

// Type declarations for global testing framework detection
interface TestingGlobal {
	describe?: unknown;
	it?: unknown;
	jest?: unknown;
}

declare global {
	const QUnit: unknown;
}

export * from './jest/jest-adapter';
export * from './jasmine/jasmine-adapter';
export * from './vitest/vitest-adapter';

// Export framework-specific functions with aliases to avoid conflicts
export {
	extendMochaMatchers,
	expectToPassAsync as expectToPassAsyncMocha,
} from './mocha/mocha-adapter';
export {
	expectToPassAsync as expectToPassAsyncAva,
	checkArchRule,
} from './ava/ava-adapter';
export {
	extendQUnitMatchers,
	expectToPassAsync as expectToPassAsyncQUnit,
} from './qunit/qunit-adapter';

// Auto-detect and setup the appropriate testing framework
export function autoSetupTestingFramework() {
	// Try to detect and setup Jest
	if (typeof jest !== 'undefined') {
		extendJestMatchers();
		return 'jest';
	}

	// Try to detect and setup Jasmine
	if (typeof jasmine !== 'undefined') {
		extendJasmineMatchers();
		return 'jasmine';
	}

	// Try to detect and setup Vitest
	if (typeof process !== 'undefined' && process.env?.VITEST) {
		extendVitestMatchers();
		return 'vitest';
	} // Try to detect and setup Mocha
	if (typeof global !== 'undefined') {
		const globalObj = global as TestingGlobal;
		if (globalObj.describe && globalObj.it && !globalObj.jest) {
			extendMochaMatchers();
			return 'mocha';
		}
	}

	// Try to detect and setup QUnit
	if (typeof QUnit !== 'undefined') {
		extendQUnitMatchers();
		return 'qunit';
	}

	// Default to generic setup
	return 'unknown';
}

// Convenience function to manually setup specific framework
export function setupTestingFramework(
	framework: 'jest' | 'jasmine' | 'vitest' | 'mocha' | 'qunit'
) {
	switch (framework) {
		case 'jest':
			extendJestMatchers();
			break;
		case 'jasmine':
			extendJasmineMatchers();
			break;
		case 'vitest':
			extendVitestMatchers();
			break;
		case 'mocha':
			extendMochaMatchers();
			break;
		case 'qunit':
			extendQUnitMatchers();
			break;
	}
}
