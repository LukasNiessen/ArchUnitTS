// Auto-setup all testing frameworks
import './src/testing/setup/auto-detect';

// Core functionality exports
export * from './src/slices/fluentapi/slices';
export * from './src/files/fluentapi/files';
export * from './src/metrics/fluentapi/metrics';
export * from './src/metrics/calculation/count';
export * from './src/metrics/fluentapi/metrics/count-metrics';

// Testing framework integrations
export * from './src/testing/index';

// Legacy Jest export for backward compatibility
export { JestViolationFactory, JestResultFactory } from './src/jest/arch-matchers';
