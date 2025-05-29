# ArchUnitTS Testing Framework Integration

This document describes how ArchUnitTS integrates with various testing frameworks to make architecture testing more natural and idiomatic.

## Compatible Testing Frameworks

ArchUnitTS provides seamless integration with the following testing frameworks:

- **Jest** - First-class integration with custom matchers
- **Jasmine** - Custom matchers for idiomatic assertions
- **Vitest** - Fully supported with Jest-compatible syntax
- **Mocha** - Helper functions for assertion support
- **QUnit** - Custom assertions for QUnit tests
- **AVA** - Helpers for AVA's asynchronous test style

## Using ArchUnitTS with Any Testing Framework

Even without direct integration, ArchUnitTS can be used with any JavaScript/TypeScript testing framework by checking the violations array manually:

```typescript
// Example with any testing framework
import { projectFiles } from 'archunit';

test('architecture rule test', async () => {
  const rule = projectFiles()
    .inFolder('src/domain')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/presentation');

  const violations = await rule.check();

  // Manually assert that there are no violations
  assert(violations.length === 0, 'Architecture rule violated');
});
```

## Automatic Framework Integration

ArchUnitTS automatically detects and sets up integration with your testing framework when you import the main package. No additional setup is required - just import ArchUnitTS and start using it with your preferred testing framework.

## How the Integration Works

### Automatic Detection and Setup

When you import the main `archunit` package, it automatically sets up integration with your testing framework:

```typescript
// This import runs the auto-detection code behind the scenes
import { ... } from 'archunit';
```

The auto-detection is performed through the `auto-detect.ts` module that's imported by the main package. This module:

1. Automatically tries to extend all supported testing frameworks
2. Each adapter function checks if its framework is present in the environment
3. If present, the framework gets extended with custom matchers or helpers
4. No additional imports or setup are required from the user

Here's how the auto-detection works (simplified from `auto-detect.ts`):

```typescript
// Auto-detect and setup all available testing frameworks
// Each adapter function has built-in checks for framework availability
extendJestMatchers(); // Only sets up if Jest is available
extendJasmineMatchers(); // Only sets up if Jasmine is available
extendVitestMatchers(); // Only sets up if Vitest is available
```

### TypeScript Type Declaration Extension

When ArchUnitTS integrates with a testing framework, it extends the framework's type declarations to provide proper IDE and TypeScript compiler support:

1. **For Jest/Jasmine/Vitest**: The `expect` function's matchers are extended with a `toPassAsync()` method using declaration merging in TypeScript.

```typescript
declare global {
  namespace jest {
    interface Matchers<R> {
      toPassAsync(): Promise<R>;
    }
  }
}
```

2. **For Mocha/QUnit/AVA**: Helper functions like `expectToPassAsync()` are provided since these frameworks don't have built-in matcher systems like Jest/Jasmine.

### Custom Matcher Implementation

For each framework, ArchUnitTS implements:

1. **Extension Functions**: Each adapter (e.g., `extendJestMatchers()`) injects the custom matchers into the testing framework.

2. **Violation Processing**: When a test runs, the architecture rule `.check()` method is called, and violations are processed through the `ViolationFactory` to generate appropriate test failures.

3. **Assertion Results**: Test failures include detailed information about which architecture rules were violated and where.

### Under the Hood

Here's what happens when you use one of the custom matchers:

1. The matcher calls the `.check()` method on your architecture rule object
2. This returns an array of violations (if any)
3. Violations are processed through the ViolationFactory to create framework-specific error objects
4. The testing framework's result system is used to report passes/failures

## Framework-Specific Usage Examples

### Real-World Vitest Example

```typescript
import { describe, it, expect } from 'vitest';
import { metrics } from 'archunit';

describe('architecture', () => {
	// architecture tests can take a while to finish
	// Vitest default timeout is 5000ms. If needed, configure in vitest.config.ts or use test.setTimeout

	it('lcom should be below 0.5 in business', async () => {
		const rule = metrics()
			.inFolder('business')
			.lcom()
			.lcom96b()
			.shouldBeBelowOrEqual(0.5);
		await expect(rule).toPassAsync();
	});

	it('lcom should be below 0.5 ui', async () => {
		const rule = metrics().inFolder('ui').lcom().lcom96b().shouldBeBelow(0.5);
		await expect(rule).toPassAsync();
	});
});
```

### Jest/Jasmine Example

```typescript
import { describe, it, expect } from 'jest'; // or jasmine setup
import { projectFiles } from 'archunit';

describe('Architecture Tests', () => {
	it('tests layer dependencies', async () => {
		const rule = projectFiles()
			.inFolder('src/domain')
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/presentation');

		await expect(rule).toPassAsync();
	});
});
```

### Mocha

```typescript
import { describe, it } from 'mocha';
import { strict as assert } from 'assert';
import { projectFiles } from 'archunit';

describe('Architecture Tests', () => {
	it('tests layer dependencies', async () => {
		const rule = projectFiles()
			.inFolder('src/domain')
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/presentation');

		const violations = await rule.check();
		assert.equal(violations.length, 0, 'Architecture rule violated');
	});
});
```

### QUnit

```typescript
import { projectFiles } from 'archunit';

QUnit.test('architecture test', async (assert) => {
	const rule = projectFiles()
		.inFolder('src/domain')
		.shouldNot()
		.dependOnFiles()
		.inFolder('src/presentation');

	const violations = await rule.check();
	assert.equal(violations.length, 0, 'Architecture rule should pass');
});
```

### AVA

```typescript
import test from 'ava';
import { projectFiles } from 'archunit';

test('architecture test', async (t) => {
	const rule = projectFiles()
		.inFolder('src/domain')
		.shouldNot()
		.dependOnFiles()
		.inFolder('src/presentation');

	// AVA requires checking violations manually or using the checkArchRule helper
	const violations = await rule.check();
	t.is(violations.length, 0, 'Architecture rule should pass');
});
```

## Benefits of Framework Integration

- **Idiomatic Testing**: Write architecture tests that follow the patterns and practices of your chosen testing framework
- **Better Error Messages**: Get clear, detailed error messages that explain which architecture rules were violated
- **IDE Support**: Get full IDE autocomplete and type checking for architecture testing assertions
- **Simplified Syntax**: Use more readable, fluent assertion syntax instead of manually checking violation arrays
