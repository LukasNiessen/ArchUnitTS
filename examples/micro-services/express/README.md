# Express MicroServices using Express and Nx

> **Note**: This is a basic example to demonstrate ArchUnitTS capabilities. Real-world microservices may have more complex architectural patterns and requirements.

This example demonstrates enforcing service boundaries, inter-service communication rules, and shared library constraints in Express microservices using ArchUnitTS with Nx monorepo.

```typescript
import { projectFiles, projectSlices, metrics } from 'archunit';

describe('Express Microservices Architecture Rules', () => {
  it('services should not depend on other services directly', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/order-service/**');
    await expect(rule).toPassAsync();
  });

  it('should respect Nx project boundaries', async () => {
    const rule = nxProjectSlices()
      .matching('user-service')
      .shouldNot()
      .dependOnSlices()
      .matching('order-service');
    await expect(rule).toPassAsync();
  });

  it('shared libraries should be framework agnostic', async () => {
    const rule = projectFiles()
      .inFolder('libs/shared/**')
      .shouldNot()
      .dependOnFiles()
      .matching('express')
      .shouldNot()
      .dependOnFiles()
      .matching('@nestjs/**');
    await expect(rule).toPassAsync();
  });

  it('service APIs should be lightweight', async () => {
    const rule = metrics()
      .inFolder('apps/*-service/src/controllers/**')
      .count()
      .methodCount()
      .shouldBeBelow(8);
    await expect(rule).toPassAsync();
  });

  it('services should maintain reasonable size', async () => {
    const rule = metrics()
      .inFolder('apps/*-service/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(5000);
    await expect(rule).toPassAsync();
  });

  it('should maintain good service cohesion', async () => {
    const rule = metrics()
      .inFolder('apps/*-service/src/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.7);
    await expect(rule).toPassAsync();
  });
});
```
