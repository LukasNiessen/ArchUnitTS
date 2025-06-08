# Angular Frontend Architecture

> **Note**: This is a basic example to demonstrate ArchUnitTS capabilities. Real-world Angular applications may have more complex architectural patterns and requirements.

This example demonstrates enforcing layered architecture patterns in Angular applications using ArchUnitTS.

## Folder Structure

```
src/app/
├── presentation/    # Components, directives, pipes
├── core/           # Singletons, guards, interceptors
├── shared/         # Shared components, utilities
├── features/       # Feature modules
└── data/          # Services, models, HTTP clients
```

## Essential Architecture Tests

```typescript
import { projectFiles } from 'archunit';

describe('Angular Architecture Tests', () => {
  it('components should not directly import HTTP services', async () => {
    const rule = projectFiles()
      .inFolder('src/app/presentation/**')
      .shouldNot()
      .dependOnFiles(['**/data/**/*.service.ts']);

    await expect(rule).toPassAsync();
  });

  it('core should not depend on feature modules', async () => {
    const rule = projectFiles()
      .inFolder('src/app/core/**')
      .shouldNot()
      .dependOnFiles(['**/features/**']);

    await expect(rule).toPassAsync();
  });

  it('shared should not depend on features', async () => {
    const rule = projectFiles()
      .inFolder('src/app/shared/**')
      .shouldNot()
      .dependOnFiles(['**/features/**']);

    await expect(rule).toPassAsync();
  });

  it('data layer should not depend on presentation', async () => {
    const rule = projectFiles()
      .inFolder('src/app/data/**')
      .shouldNot()
      .dependOnFiles(['**/presentation/**']);

    await expect(rule).toPassAsync();
  });
});
```
