// Mocha integration for ArchUnitTS
import './src/testing/setup/mocha';

// Re-export all core functionality
export * from './index';

// Mocha-specific exports
export {
	extendMochaMatchers,
	expectToPassAsync,
} from './src/testing/mocha/mocha-adapter';
