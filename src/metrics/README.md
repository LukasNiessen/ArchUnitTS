# Code Metrics in ArchUnitTS

This module provides support for analyzing and enforcing code metrics in your TypeScript/JavaScript projects with sophisticated pattern matching capabilities.

## Pattern Matching

The metrics module supports the same pattern matching system as the files module, with three targeting options:

- **`withName(pattern)`** - Match only the filename (e.g., 'Service.ts' from 'src/services/Service.ts')
- **`inPath(pattern)`** - Match against the full relative path (e.g., 'src/services/Service.ts')
- **`inFolder(pattern)`** - Match against the path without filename (e.g., 'src/services' from 'src/services/Service.ts')

### Pattern Types

Both string patterns (with glob support) and regular expressions are supported:

```typescript
// String patterns with glob support
.withName('*.service.ts')     // All files ending with .service.ts
.inFolder('**/services')      // All files in any services folder
.inPath('src/api/**/*.ts')    // All TypeScript files under src/api

// Regular expressions
.withName(/^.*Service\.ts$/)  // Same as *.service.ts but as regex
.inFolder(/services$/)        // Folders ending with 'services'
```

## Usage Examples

### Basic Pattern Matching

```typescript
import { metrics } from 'archunit';

// Test only service classes
await metrics().withName('*.service.ts').lcom().lcom96b().shouldBeBelow(0.7).check();

// Test classes in specific folders
await metrics()
  .inFolder('**/controllers')
  .count()
  .methodCount()
  .shouldBeBelow(20)
  .check();

// Test classes matching full path patterns
await metrics().inPath('src/domain/**/*.ts').lcom().lcom96a().shouldBeBelow(0.8).check();
```

### Method Chaining

You can combine multiple pattern matching methods:

```typescript
// Combine folder and filename patterns
await metrics()
  .inFolder('**/services')
  .withName('*.service.ts')
  .lcom()
  .lcom96b()
  .shouldBeBelow(0.6)
  .check();

// Mix pattern matching with class name matching
await metrics()
  .inPath('src/api/**')
  .forClassesMatching(/.*Controller/)
  .count()
  .methodCount()
  .shouldBeBelow(15)
  .check();
```

### Backwards Compatibility

Existing methods continue to work:

```typescript
// Class name matching
await metrics()
  .forClassesMatching(/.*Service/)
  .lcom()
  .lcom96a()
  .shouldBeBelow(0.7)
  .check();
```

```typescript
await expect(metrics().lcom().lcom96b().shouldHaveCohesionAbove(0.7)).toPassAsync();
```

## Integration with Architecture Rules

Code metrics can be combined with architectural rules to ensure not only structural compliance but also code quality:

```typescript
it('core domain has high cohesion', async () => {
  const violations = await metrics()
    .forClasses(/^Core\..*/) // Apply only to core domain classes
    .lcom()
    .lcom96b()
    .shouldHaveCohesionAbove(0.6)
    .check();

  expect(violations).toHaveLength(0);
});
```

## Supported Metrics

### LCOM (Lack of Cohesion of Methods)

The LCOM metrics measure how well the methods and fields of a class are connected, indicating the cohesion level of the class. Lower values indicate better cohesion.

#### LCOM96a (Handerson et al.)

A variant of the LCOM metric that counts method-attribute relationships:

```typescript
await metrics().lcom().lcom96a().shouldBeBelow(0.8).check();
```

#### LCOM96b (Handerson et al.)

The LCOM96b metric, proposed by Handerson et al. in 1996, is calculated as follows:

```
LCOM96b = (m - sum(μ(A))/m)/(1-1/m)
```

Where:

- `m` is the number of methods in the class
- `μ(A)` is the number of methods that access an attribute (field) A
- The formula measures how methods are connected through attributes

The result is a value between 0 and 1:

- 0: perfect cohesion (all methods access all attributes)
- 1: complete lack of cohesion (each method accesses its own attribute)

```typescript
await metrics().lcom().lcom96b().shouldBeBelow(0.7).check();
```

### Count Metrics

Measure various counts within classes:

```typescript
// Method count
await metrics().count().methodCount().shouldBeBelow(20).check();

// Field count
await metrics().count().fieldCount().shouldBeBelow(15).check();

// Lines of code
await metrics().count().linesOfCode().shouldBeBelow(200).check();
```

### Distance Metrics

Measure architectural distance metrics:

```typescript
// Abstractness
await metrics().distance().abstractness().shouldBeAbove(0.3).check();

// Instability
await metrics().distance().instability().shouldBeBelow(0.8).check();

// Distance from main sequence
await metrics().distance().distanceFromMainSequence().shouldBeBelow(0.5).check();
```

### Custom Metrics

Define your own metrics with custom calculation logic:

```typescript
await metrics()
  .customMetric(
    'complexityRatio',
    'Ratio of methods to fields',
    (classInfo) => classInfo.methods.length / Math.max(classInfo.fields.length, 1)
  )
  .shouldBeBelow(3.0)
  .check();
```

## Integration with Testing Frameworks

### Jest

```typescript
import { metrics } from 'archunit';

describe('Code Metrics', () => {
  it('service classes should have high cohesion', async () => {
    const violations = await metrics()
      .withName('*.service.ts')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.7)
      .check();

    expect(violations).toHaveLength(0);
  });
});
```

### Mocha

```typescript
import { metrics } from 'archunit';
import { expect } from 'chai';

describe('Code Metrics', () => {
  it('controller classes should not be too complex', async () => {
    const violations = await metrics()
      .inFolder('**/controllers')
      .count()
      .methodCount()
      .shouldBeBelow(15)
      .check();

    expect(violations).to.have.length(0);
  });
});
```
