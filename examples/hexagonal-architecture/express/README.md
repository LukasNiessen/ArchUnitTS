# Hexagonal Architecture using Express

> **Note**: This is a basic example to demonstrate ArchUnitTS capabilities. Real-world hexagonal architecture applications may have more complex architectural patterns and requirements.

This example demonstrates enforcing ports and adapters pattern, core isolation, and dependency inversion in Express applications using ArchUnitTS.

```typescript
import { projectFiles, projectSlices, metrics } from 'archunit';

describe('Express Hexagonal Architecture Rules', () => {
  it('core should not depend on adapters', async () => {
    const rule = projectFiles()
      .inFolder('src/core/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/adapters/**');
    await expect(rule).toPassAsync();
  });

  it('core should not depend on infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('src/core/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');
    await expect(rule).toPassAsync();
  });

  it('adapters should implement ports', async () => {
    const rule = projectFiles()
      .inFolder('src/adapters/**')
      .should()
      .dependOnFiles()
      .inFolder('src/ports/**');
    await expect(rule).toPassAsync();
  });

  it('should maintain focused business logic', async () => {
    const rule = metrics()
      .inFolder('src/core/**')
      .count()
      .methodCount()
      .shouldBeBelow(12);
    await expect(rule).toPassAsync();
  });

  it('ports should be simple interfaces', async () => {
    const rule = metrics()
      .inFolder('src/ports/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(100);
    await expect(rule).toPassAsync();
  });

  it('adapters should have good cohesion', async () => {
    const rule = metrics()
      .inFolder('src/adapters/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.6);
    await expect(rule).toPassAsync();
  });
});
```
