# Clean Architecture - NestJS Backend

This example demonstrates how to enforce Clean Architecture patterns in a NestJS backend application using ArchUnitTS.

_Note: This is a brief and incomplete introduction to Clean Architecture. The focus here is on showing how to test architectural rules with ArchUnitTS._

## Architecture Overview

Clean Architecture organizes code in concentric circles where dependencies point inward:

```
src/
├── domain/           # Enterprise Business Rules (innermost)
├── application/      # Application Business Rules
├── infrastructure/   # Frameworks & Drivers (outermost)
└── presentation/     # Interface Adapters
```

## Essential Architecture Tests

````typescript
import { projectFiles, projectSlices } from 'archunit';

describe('Clean Architecture Tests', () => {
  it('domain should not depend on outer layers', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/{application,infrastructure,presentation}/**');

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

  it('should adhere to dependency direction', async () => {
    const diagram = `
@startuml
component [presentation]
component [application]
component [domain]
component [infrastructure]

[presentation] --> [application]
[application] --> [domain]
[infrastructure] --> [domain]
@enduml`;

    const rule = projectSlices()
      .definedBy('src/(**)')
      .should()
      ```

    await expect(rule).toPassAsync();
  });
});
````

## Benefits of Clean Architecture with NestJS

1. **Independence**: Business logic is independent of frameworks
2. **Testability**: Each layer can be tested in isolation
3. **Flexibility**: Easy to change infrastructure without affecting business logic
4. **Maintainability**: Clear separation of concerns
5. **NestJS Integration**: Leverages NestJS DI and modular structure

## Common Clean Architecture Violations

1. **Framework dependencies in domain**: Domain layer importing framework code
2. **Business logic in controllers**: Controllers should be thin
3. **Direct database access from application**: Should use repository interfaces
4. **Infrastructure leaking**: Infrastructure details in outer layers
5. **Circular dependencies**: Often caused by improper interface design

This architecture ensures your NestJS application follows Clean Architecture principles while leveraging NestJS's powerful features and ArchUnitTS's enforcement capabilities.
