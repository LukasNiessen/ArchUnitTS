// Vitest integration for ArchUnitTS
import './src/testing/setup/vitest';

// Re-export all core functionality
export * from './index';

// Vitest-specific exports
export { expectToPassAsync } from './src/testing/vitest/vitest-adapter';
