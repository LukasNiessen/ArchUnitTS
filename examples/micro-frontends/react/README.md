# React Micro Frontends using Nx

> **Note**: This is a basic example to demonstrate ArchUnitTS capabilities. Real-world micro-frontend applications may have more complex architectural patterns and requirements.

This example demonstrates enforcing micro-frontend boundaries, module federation rules, and shared dependency constraints in React applications using ArchUnitTS.

```typescript
import { projectFiles, projectSlices, metrics } from 'archunit';

describe('React Micro Frontend Architecture Rules', () => {
  it('shell should not depend on micro-frontend internals', async () => {
    const rule = projectFiles()
      .inFolder('apps/shell/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/micro-frontend-*/**/components/**');
    await expect(rule).toPassAsync();
  });

  it('micro-frontends should not depend on each other', async () => {
    const rule = projectFiles()
      .inFolder('apps/micro-frontend-auth/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/micro-frontend-dashboard/**');
    await expect(rule).toPassAsync();
  });

  it('apps should have module federation configuration', async () => {
    const rule = projectFiles()
      .inFolder('apps/**')
      .should()
      .adhereTo(hasModuleFederationConfig, 'Apps should have Module Federation config');
    await expect(rule).toPassAsync();
  });

  it('shared libraries should not be too large', async () => {
    const rule = metrics()
      .inFolder('libs/shared/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(2000);
    await expect(rule).toPassAsync();
  });

  it('micro-frontend components should have limited complexity', async () => {
    const rule = metrics()
      .inFolder('apps/micro-frontend-*/**/components/**')
      .count()
      .methodCount()
      .shouldBeBelow(12);
    await expect(rule).toPassAsync();
  });

  it('should maintain good cohesion in shared utilities', async () => {
    const rule = metrics().inFolder('libs/shared/**').lcom().lcom96b().shouldBeBelow(0.7);
    await expect(rule).toPassAsync();
  });
});
```
