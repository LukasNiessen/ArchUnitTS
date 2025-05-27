# ArchUnitTS

ℹ️ ArchUnitTS is a library for ensuring software architecture rules in TypeScript & JavaScript projects.

💚 As of 2025, it's the #1 architecture testing library for TS and JS, measured by GitHub stars.

⚠️ The library and its name are directly inspired by the amazing ArchUnit library. However, **we are in no way affiliated with ArchUnit or their team.**

Some of the functionality:

- Check dependencies between files, folders and slices
- Check for cyclic dependencies
- Test for code metrics, eg. coupling and cohesion related ones (eg. LCOM96b)
- Test whether the project adheres to a UML architecture diagram
- Much more.

## Installation

```bash
npm install archunit --save-dev
```

## Testing Framework Integration

ArchUnitTS supports multiple testing frameworks out of the box:

### Jest

```typescript
import 'archunit/jest';
// or manually: import { extendJestMatchers } from 'archunit'; extendJestMatchers();

await expect(myArchRule).toPassAsync();
```

### Jasmine

```typescript
import 'archunit/jasmine';
// or manually: import { extendJasmineMatchers } from 'archunit'; extendJasmineMatchers();

await expect(myArchRule).toPassAsync();
```

### Vitest

```typescript
import 'archunit/vitest';
// or manually: import { extendVitestMatchers } from 'archunit'; extendVitestMatchers();

await expect(myArchRule).toPassAsync();
```

### Mocha

```typescript
import 'archunit/mocha';
// or manually: import { expectToPassAsync } from 'archunit';

await expectToPassAsync(myArchRule);
```

### AVA

```typescript
import { expectToPassAsync } from 'archunit';

await expectToPassAsync(myArchRule);
```

### QUnit

```typescript
import 'archunit/qunit';
// or manually: import { expectToPassAsync } from 'archunit';

await expectToPassAsync(myArchRule, assert);
```
