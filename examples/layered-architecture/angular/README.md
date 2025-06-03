# Layered Architecture - Angular Frontend

This example demonstrates how to enforce layered architecture patterns in an Angular frontend application using ArchUnitTS.

## Architecture Overview

Angular applications benefit from a clear layered architecture to maintain separation of concerns:

```
src/app/
├── presentation/    # Components, directives, pipes
├── core/           # Singletons, guards, interceptors
├── shared/         # Shared components, utilities
├── features/       # Feature modules
└── data/          # Services, models, state management
```

## Angular-Specific Layer Rules

### 1. Component Layer Rules

```typescript
import { projectFiles, metrics } from 'archunit';

describe('Angular Presentation Layer', () => {
  it('components should not directly import HTTP services', async () => {
    const rule = projectFiles()
      .inFolder('src/app/presentation/components/**')
      .shouldNot()
      .dependOnFiles()
      .withName('*Http*.service.ts');

    await expect(rule).toPassAsync();
  });

  it('components should follow naming convention', async () => {
    const rule = projectFiles()
      .inFolder('src/app/presentation/components/**')
      .withName('*.component.ts')
      .should()
      .haveName(/^[A-Z][a-zA-Z]*Component\.ts$/);

    await expect(rule).toPassAsync();
  });

  it('components should have reasonable complexity', async () => {
    const rule = metrics()
      .inFolder('src/app/presentation/components/**')
      .count()
      .methodCount()
      .shouldBeBelow(15);

    await expect(rule).toPassAsync();
  });

  it('components should not exceed file size limit', async () => {
    const rule = metrics()
      .inFolder('src/app/presentation/components/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(300);

    await expect(rule).toPassAsync();
  });
});
```

### 2. Core Module Rules

```typescript
describe('Angular Core Layer', () => {
  it('core services should be singletons', async () => {
    const rule = projectFiles()
      .inFolder('src/app/core/services/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes("providedIn: 'root'") ||
          (file.content.includes('@Injectable({') && file.content.includes("'root'")),
        'Core services should be provided in root'
      );

    await expect(rule).toPassAsync();
  });

  it('guards should be in core module', async () => {
    const rule = projectFiles()
      .withName('*.guard.ts')
      .should()
      .beInFolder('src/app/core/guards/**');

    await expect(rule).toPassAsync();
  });

  it('interceptors should be in core module', async () => {
    const rule = projectFiles()
      .withName('*.interceptor.ts')
      .should()
      .beInFolder('src/app/core/interceptors/**');

    await expect(rule).toPassAsync();
  });

  it('core should not depend on feature modules', async () => {
    const rule = projectFiles()
      .inFolder('src/app/core/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/app/features/**');

    await expect(rule).toPassAsync();
  });
});
```

### 3. Feature Module Rules

```typescript
describe('Angular Feature Modules', () => {
  it('features should not depend on other features', async () => {
    const rule = projectFiles()
      .inFolder('src/app/features/*/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/app/features/*/**')
      .exceptWhen()
      .inSameFeatureModule();

    await expect(rule).toPassAsync();
  });

  it('feature components should not exceed complexity', async () => {
    const rule = metrics()
      .inFolder('src/app/features/**/components/**')
      .count()
      .methodCount()
      .shouldBeBelow(20);

    await expect(rule).toPassAsync();
  });

  it('feature services should be provided in module', async () => {
    const rule = projectFiles()
      .inFolder('src/app/features/**/services/**')
      .should()
      .adhereTo(
        (file) => !file.content.includes("providedIn: 'root'"),
        'Feature services should not be provided in root'
      );

    await expect(rule).toPassAsync();
  });
});
```

### 4. Data Layer Rules

```typescript
describe('Angular Data Layer', () => {
  it('HTTP services should be in data layer', async () => {
    const rule = projectFiles()
      .withName('*Http*.service.ts')
      .should()
      .beInFolder('src/app/data/services/**');

    await expect(rule).toPassAsync();
  });

  it('models should not contain business logic', async () => {
    const rule = metrics()
      .inFolder('src/app/data/models/**')
      .count()
      .methodCount()
      .shouldBe(0); // Models should be interfaces or simple classes

    await expect(rule).toPassAsync();
  });

  it('state management should be centralized', async () => {
    const rule = projectFiles()
      .withName('*.state.ts')
      .should()
      .beInFolder('src/app/data/state/**');

    await expect(rule).toPassAsync();
  });

  it('data services should not depend on presentation', async () => {
    const rule = projectFiles()
      .inFolder('src/app/data/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/app/presentation/**');

    await expect(rule).toPassAsync();
  });
});
```

## Module Organization Rules

### 1. Shared Module Rules

```typescript
describe('Angular Shared Module', () => {
  it('shared components should be reusable', async () => {
    const rule = projectFiles()
      .inFolder('src/app/shared/components/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('@Input()') || file.content.includes('@Output()'),
        'Shared components should have inputs or outputs'
      );

    await expect(rule).toPassAsync();
  });

  it('shared should not depend on features', async () => {
    const rule = projectFiles()
      .inFolder('src/app/shared/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/app/features/**');

    await expect(rule).toPassAsync();
  });

  it('shared utilities should be pure functions', async () => {
    const rule = projectFiles()
      .inFolder('src/app/shared/utils/**')
      .should()
      .adhereTo(
        (file) => !file.content.includes('@Injectable'),
        'Utilities should be pure functions, not services'
      );

    await expect(rule).toPassAsync();
  });
});
```

### 2. Barrel Exports

```typescript
describe('Module Exports', () => {
  it('modules should have barrel exports', async () => {
    const rule = projectFiles().inFolder('src/app/*/').should().containFile('index.ts');

    await expect(rule).toPassAsync();
  });

  it('barrel exports should not re-export everything', async () => {
    const rule = projectFiles()
      .withName('index.ts')
      .should()
      .adhereTo(
        (file) => !file.content.includes('export * from'),
        'Avoid wildcard exports for better tree-shaking'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Angular-Specific Patterns

### 1. Reactive Forms Pattern

```typescript
describe('Reactive Forms', () => {
  it('components with forms should use reactive forms', async () => {
    const rule = projectFiles()
      .inFolder('src/app/presentation/components/**')
      .that()
      .dependOnFiles()
      .withName('*form*')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('FormBuilder') || file.content.includes('FormGroup'),
        'Forms should use reactive forms pattern'
      );

    await expect(rule).toPassAsync();
  });

  it('form components should have validation', async () => {
    const rule = projectFiles()
      .inFolder('src/app/presentation/components/**')
      .that()
      .haveName('*Form*.component.ts')
      .should()
      .adhereTo(
        (file) => file.content.includes('Validators'),
        'Form components should include validation'
      );

    await expect(rule).toPassAsync();
  });
});
```

### 2. RxJS Usage Patterns

```typescript
describe('RxJS Patterns', () => {
  it('components should unsubscribe from observables', async () => {
    const rule = projectFiles()
      .inFolder('src/app/presentation/components/**')
      .that()
      .dependOnFiles()
      .withName('*.service.ts')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('takeUntil') ||
          file.content.includes('async pipe') ||
          file.content.includes('unsubscribe'),
        'Components should handle observable subscriptions'
      );

    await expect(rule).toPassAsync();
  });

  it('services should return observables', async () => {
    const rule = projectFiles()
      .inFolder('src/app/data/services/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('Observable'),
        'Data services should return observables'
      );

    await expect(rule).toPassAsync();
  });
});
```

### 3. Change Detection Strategy

```typescript
describe('Performance Optimization', () => {
  it('components should use OnPush when possible', async () => {
    const rule = projectFiles()
      .inFolder('src/app/presentation/components/**')
      .withName('*Smart*.component.ts')
      .should()
      .adhereTo(
        (file) => file.content.includes('ChangeDetectionStrategy.OnPush'),
        'Smart components should use OnPush strategy'
      );

    await expect(rule).toPassAsync();
  });

  it('pure components should be marked as such', async () => {
    const rule = projectFiles()
      .inFolder('src/app/shared/components/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('ChangeDetectionStrategy.OnPush'),
        'Shared components should use OnPush strategy'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Example Project Structure

```
src/app/
├── presentation/
│   ├── components/
│   │   ├── header/
│   │   │   ├── header.component.ts
│   │   │   ├── header.component.html
│   │   │   └── header.component.scss
│   │   └── footer/
│   │       ├── footer.component.ts
│   │       ├── footer.component.html
│   │       └── footer.component.scss
│   ├── directives/
│   │   └── highlight.directive.ts
│   └── pipes/
│       └── currency-format.pipe.ts
├── core/
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── theme.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   └── error.interceptor.ts
│   └── core.module.ts
├── shared/
│   ├── components/
│   │   ├── loading-spinner/
│   │   └── confirmation-dialog/
│   ├── utils/
│   │   └── date-utils.ts
│   └── shared.module.ts
├── features/
│   ├── user-management/
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   └── user-management.module.ts
│   └── product-catalog/
│       ├── components/
│       ├── services/
│       ├── models/
│       └── product-catalog.module.ts
└── data/
    ├── services/
    │   ├── user-http.service.ts
    │   └── product-http.service.ts
    ├── models/
    │   ├── user.model.ts
    │   └── product.model.ts
    └── state/
        ├── app.state.ts
        └── reducers/
```

## Testing Integration

### Component Testing Architecture

```typescript
describe('Component Testing Rules', () => {
  it('components should have corresponding test files', async () => {
    const rule = projectFiles()
      .withName('*.component.ts')
      .should()
      .haveCorrespondingFiles()
      .withName('*.component.spec.ts');

    await expect(rule).toPassAsync();
  });

  it('test files should follow naming convention', async () => {
    const rule = projectFiles()
      .withName('*.spec.ts')
      .should()
      .beInSameFolder()
      .asFiles()
      .withName((file) => file.replace('.spec.ts', '.ts'));

    await expect(rule).toPassAsync();
  });
});
```

### Service Testing Architecture

```typescript
describe('Service Testing Rules', () => {
  it('services should have unit tests', async () => {
    const rule = projectFiles()
      .withName('*.service.ts')
      .should()
      .haveCorrespondingFiles()
      .withName('*.service.spec.ts');

    await expect(rule).toPassAsync();
  });

  it('HTTP services should have integration tests', async () => {
    const rule = projectFiles()
      .withName('*Http*.service.ts')
      .should()
      .haveCorrespondingFiles()
      .withName('*.integration.spec.ts');

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of Angular Layered Architecture

1. **Scalability**: Easy to add new features without affecting existing code
2. **Maintainability**: Clear separation of concerns
3. **Testability**: Each layer can be tested in isolation
4. **Reusability**: Shared components and utilities can be reused
5. **Performance**: Optimized change detection and lazy loading

## Common Angular Violations

1. **Smart components in shared module**: Shared components should be dumb/presentational
2. **Feature modules depending on each other**: Features should be independent
3. **Business logic in components**: Logic should be in services
4. **Direct HTTP calls in components**: Use data services as intermediary
5. **Circular dependencies**: Often caused by improper module organization

## CI/CD Integration

```yaml
# .github/workflows/angular-architecture.yml
name: Angular Architecture Tests
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
      - run: npm run build:prod # Ensure architecture works in production
```

This architecture ensures your Angular application remains maintainable and follows Angular best practices at scale.
