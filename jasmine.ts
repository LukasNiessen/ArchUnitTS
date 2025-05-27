// Jasmine integration for ArchUnitTS
import './src/testing/setup/jasmine';

// Re-export all core functionality
export * from './index';

// Jasmine-specific exports
export { expectToPassAsync } from './src/testing/jasmine/jasmine-adapter';
