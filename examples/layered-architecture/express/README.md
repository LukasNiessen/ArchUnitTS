# Layered Architecture - Express Backend

This example demonstrates how to enforce layered architecture patterns in an Express.js backend application using ArchUnitTS.

## Architecture Overview

A typical layered architecture for an Express backend follows this structure:

```
src/
├── presentation/     # Controllers, middlewares, routes
├── business/         # Business logic, services
├── data/            # Data access layer, repositories
└── infrastructure/  # External integrations, utilities
```

## Architecture Rules

### 1. Layer Dependencies

Each layer should only depend on layers below it, never on layers above:

```typescript
import { projectFiles } from 'archunit';

describe('Layered Architecture Rules', () => {
  it('presentation layer should not depend on infrastructure details', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });

  it('business layer should not depend on presentation layer', async () => {
    const rule = projectFiles()
      .inFolder('src/business/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/presentation/**');

    await expect(rule).toPassAsync();
  });

  it('business layer should not depend on infrastructure details', async () => {
    const rule = projectFiles()
      .inFolder('src/business/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });

  it('data layer should not depend on business or presentation layers', async () => {
    const rule = projectFiles()
      .inFolder('src/data/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/{business,presentation}/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Naming Conventions

Enforce consistent naming patterns across layers:

```typescript
describe('Naming Convention Rules', () => {
  it('controllers should follow naming pattern', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/controllers/**')
      .should()
      .haveName('*Controller.ts');

    await expect(rule).toPassAsync();
  });

  it('services should follow naming pattern', async () => {
    const rule = projectFiles()
      .inFolder('src/business/services/**')
      .should()
      .haveName('*Service.ts');

    await expect(rule).toPassAsync();
  });

  it('repositories should follow naming pattern', async () => {
    const rule = projectFiles()
      .inFolder('src/data/repositories/**')
      .should()
      .haveName('*Repository.ts');

    await expect(rule).toPassAsync();
  });

  it('middlewares should be in correct location', async () => {
    const rule = projectFiles()
      .withName('*Middleware.ts')
      .should()
      .beInFolder('src/presentation/middlewares/**');

    await expect(rule).toPassAsync();
  });
});
```

### 3. Circular Dependencies

Prevent circular dependencies within and between layers:

```typescript
describe('Circular Dependencies', () => {
  it('should have no cycles in presentation layer', async () => {
    const rule = projectFiles().inFolder('src/presentation/**').should().haveNoCycles();

    await expect(rule).toPassAsync();
  });

  it('should have no cycles in business layer', async () => {
    const rule = projectFiles().inFolder('src/business/**').should().haveNoCycles();

    await expect(rule).toPassAsync();
  });

  it('should have no cycles across all layers', async () => {
    const rule = projectFiles().inFolder('src/**').should().haveNoCycles();

    await expect(rule).toPassAsync();
  });
});
```

## Example Project Structure

```
src/
├── presentation/
│   ├── controllers/
│   │   ├── UserController.ts
│   │   └── ProductController.ts
│   ├── middlewares/
│   │   ├── AuthMiddleware.ts
│   │   └── ValidationMiddleware.ts
│   └── routes/
│       ├── userRoutes.ts
│       └── productRoutes.ts
├── business/
│   ├── services/
│   │   ├── UserService.ts
│   │   └── ProductService.ts
│   └── models/
│       ├── User.ts
│       └── Product.ts
├── data/
│   ├── repositories/
│   │   ├── UserRepository.ts
│   │   └── ProductRepository.ts
│   └── entities/
│       ├── UserEntity.ts
│       └── ProductEntity.ts
└── infrastructure/
    ├── database/
    │   └── connection.ts
    ├── external/
    │   └── emailService.ts
    └── utils/
        └── logger.ts
```

## Advanced Rules

### Interface Segregation

Ensure interfaces are properly segregated by layer:

```typescript
describe('Interface Segregation', () => {
  it('business interfaces should not depend on data implementation', async () => {
    const rule = projectFiles()
      .inFolder('src/business/interfaces/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/data/**');

    await expect(rule).toPassAsync();
  });

  it('presentation should only depend on business interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/**')
      .that()
      .dependOnFiles()
      .inFolder('src/business/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/business/interfaces/**');

    await expect(rule).toPassAsync();
  });
});
```

### External Dependencies

Control external library usage by layer:

```typescript
describe('External Dependencies', () => {
  it('business layer should not import express directly', async () => {
    const rule = projectFiles()
      .inFolder('src/business/**')
      .shouldNot()
      .importModules(['express', '@types/express']);

    await expect(rule).toPassAsync();
  });

  it('presentation layer should not import database libraries', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/**')
      .shouldNot()
      .importModules(['mongoose', 'typeorm', 'prisma']);

    await expect(rule).toPassAsync();
  });
});
```

## Benefits

- **Separation of Concerns**: Each layer has a clear responsibility
- **Maintainability**: Changes in one layer don't affect others
- **Testability**: Easier to mock dependencies and test in isolation
- **Scalability**: New features can be added without breaking existing structure

## Common Violations

1. **Controllers accessing databases directly**: Controllers should only call services
2. **Services importing Express types**: Business logic should be framework-agnostic
3. **Circular dependencies**: Often occurs when models reference each other incorrectly
4. **Infrastructure leaking into business**: Database-specific code in service layer

## Integration with CI/CD

Add these tests to your CI pipeline to ensure architectural consistency:

```yaml
# .github/workflows/architecture.yml
name: Architecture Tests
on: [push, pull_request]

jobs:
  architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:architecture
```

This ensures that every code change respects your layered architecture principles.
