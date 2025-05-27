// AVA integration for ArchUnitTS
import './src/testing/setup/ava';

// Re-export all core functionality
export * from './index';

// AVA-specific exports
export { expectToPassAsyncAva as expectToPassAsync } from './src/testing/ava/ava-adapter';
