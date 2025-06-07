// Auto-setup all testing frameworks
import './src/testing/setup';

// Core functionality exports
export * from './src/slices';
export * from './src/files';
export * from './src/metrics';

// Graph extraction and debugging
export { extractGraph, clearGraphCache } from './src/common/extraction';

// Testing framework integrations
export * from './src/testing';

// Common utilities
export * from './src/common';
