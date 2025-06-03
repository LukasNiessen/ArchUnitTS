// Explicit exports to avoid naming conflicts
export type { MetricComparison } from './common';
export type { ClassFilter, ClassInfo, FieldInfo, MethodInfo, Metric } from './common';

// Assertion module
export * from './assertion';

// Calculation module
export * from './calculation';

// Extraction module
export { extractClassInfo } from './extraction';

// Fluent API module
export * from './fluentapi';

// Projection module
export * from './projection';
