// QUnit integration for ArchUnitTS
import './src/testing/setup/qunit';

// Re-export all core functionality
export * from './index';

// QUnit-specific exports
export {
	extendQUnitMatchers,
	expectToPassAsync,
} from './src/testing/qunit/qunit-adapter';
