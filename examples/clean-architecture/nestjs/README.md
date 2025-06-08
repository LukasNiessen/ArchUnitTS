# Clean Architecture implementation using NestJS

> **Note**: This is a basic example to demonstrate ArchUnitTS capabilities. Real-world clean architecture applications may have more complex architectural patterns and requirements.

This example demonstrates enforcing dependency inversion, layer isolation, and domain-driven design principles in NestJS applications using ArchUnitTS.

```typescript
import { projectFiles, projectSlices, metrics } from 'archunit';

describe('NestJS Clean Architecture Rules', () => {
  it('domain should not depend on infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');
    await expect(rule).toPassAsync();
  });

  it('domain should not depend on application layer', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/application/**');
    await expect(rule).toPassAsync();
  });

  it('application should not depend on infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('src/application/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');
    await expect(rule).toPassAsync();
  });

  it('should maintain clean architecture layers', async () => {
    const rule = metrics()
      .inFolder('src/domain/**')
      .count()
      .methodCount()
      .shouldBeBelow(15);
    await expect(rule).toPassAsync();
  });

  it('use cases should be focused and cohesive', async () => {
    const rule = metrics()
      .inFolder('src/application/use-cases/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.5);
    await expect(rule).toPassAsync();
  });

  it('should keep infrastructure adapters lightweight', async () => {
    const rule = metrics()
      .inFolder('src/infrastructure/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(800);
    await expect(rule).toPassAsync();
  });
});
```
