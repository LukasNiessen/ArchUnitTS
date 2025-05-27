# ArchUnitTS

ℹ️ ArchUnitTS is a library for ensuring software architecture rules in TypeScript & JavaScript projects.

💚 As of 2025, it's the #1 architecture testing library for TS and JS, measured by GitHub stars.

⚠️ The library and its name are directly inspired by the amazing ArchUnit library. However, **we are in no way affiliated with ArchUnit or their team.**

Some of the functionality:

- Check dependencies between files, folders and slices
- Check for cyclic dependencies
- Test for code metrics, eg. coupling and cohesion related ones (eg. LCOM96b)
- Test whether the project adheres to a UML architecture diagram
- Automatic integration with popular testing frameworks (Jest, Vitest, Jasmine, Mocha, QUnit, AVA)
- Much more.

## Installation

```bash
npm install archunit --save-dev
```

## Testing Framework Integration

ArchUnitTS automatically integrates with your preferred testing framework, providing a seamless testing experience. No additional configuration is required - just import and use:

```typescript
import { describe, it, expect } from 'vitest';
import { metrics } from 'archunit';

describe('architecture', () => {
  it('cohesion should be high', async () => {
    const rule = metrics().lcom().lcom96b().shouldBeBelow(0.5);
    await expect(rule).toPassAsync();
  });
});
```

Supported frameworks include Jest, Vitest, Jasmine, Mocha, QUnit, and AVA. For detailed documentation on testing framework integration, see the [Testing Framework Integration guide](src/testing/README.md).
