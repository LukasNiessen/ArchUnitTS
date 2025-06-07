# React Clean Architecture with ArchUnitTS

This example demonstrates how to enforce Clean Architecture principles in a React application using ArchUnitTS. Clean Architecture ensures that business logic is independent of frameworks, UI, and external concerns.

## Architecture Overview

```
src/
├── domain/                  # Enterprise Business Rules (Entities)
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   └── Order.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Money.ts
│   │   └── Address.ts
│   └── errors/
│       ├── DomainError.ts
│       └── ValidationError.ts
├── application/             # Application Business Rules (Use Cases)
│   ├── use-cases/
│   │   ├── user/
│   │   │   ├── CreateUser.ts
│   │   │   ├── GetUser.ts
│   │   │   └── UpdateUser.ts
│   │   ├── product/
│   │   └── order/
│   ├── ports/               # Interfaces (Repository contracts)
│   │   ├── repositories/
│   │   │   ├── UserRepository.ts
│   │   │   ├── ProductRepository.ts
│   │   │   └── OrderRepository.ts
│   │   └── services/
│   │       ├── EmailService.ts
│   │       └── PaymentService.ts
│   └── dto/                 # Data Transfer Objects
│       ├── UserDto.ts
│       ├── ProductDto.ts
│       └── OrderDto.ts
├── infrastructure/          # Frameworks & Drivers (External concerns)
│   ├── repositories/        # Repository implementations
│   │   ├── ApiUserRepository.ts
│   │   ├── ApiProductRepository.ts
│   │   └── LocalStorageUserRepository.ts
│   ├── services/           # External service implementations
│   │   ├── HttpEmailService.ts
│   │   └── StripePaymentService.ts
│   ├── http/
│   │   ├── api-client.ts
│   │   └── interceptors.ts
│   └── storage/
│       └── local-storage.ts
├── presentation/           # Interface Adapters (UI Layer)
│   ├── components/         # React Components
│   │   ├── user/
│   │   ├── product/
│   │   └── order/
│   ├── pages/             # Page Components
│   │   ├── UserPage.tsx
│   │   ├── ProductPage.tsx
│   │   └── OrderPage.tsx
│   ├── hooks/             # Custom React Hooks
│   │   ├── useUser.ts
│   │   ├── useProduct.ts
│   │   └── useOrder.ts
│   ├── stores/            # State Management
│   │   ├── userStore.ts
│   │   ├── productStore.ts
│   │   └── orderStore.ts
│   └── presenters/        # View Models
│       ├── UserPresenter.ts
│       ├── ProductPresenter.ts
│       └── OrderPresenter.ts
└── tests/
    └── architecture/
```

## Key Architectural Rules

### 1. Dependency Direction Rules

The core principle of Clean Architecture - dependencies should point inward:

```typescript
import { projectFiles } from 'archunit';

describe('Clean Architecture Dependency Rules', () => {
  it('domain should not depend on any outer layers', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/application/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/presentation/**');

    await expect(rule).toPassAsync();
  });

  it('application should only depend on domain', async () => {
    const rule = projectFiles()
      .inFolder('src/application/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/domain/**')
      .or()
      .inFolder('src/application/**')
      .or()
      .matching('react')
      .or()
      .matching('@types/**');

    await expect(rule).toPassAsync();
  });

  it('infrastructure should not depend on presentation', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/presentation/**');

    await expect(rule).toPassAsync();
  });

  it('presentation can depend on application and infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/application/**')
      .or()
      .inFolder('src/infrastructure/**')
      .or()
      .inFolder('src/presentation/**')
      .or()
      .matching('react')
      .or()
      .matching('@emotion/**')
      .or()
      .matching('@types/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Domain Layer Purity

Domain entities should be pure business objects without framework dependencies:

```typescript
describe('Domain Layer Purity', () => {
  it('domain entities should not depend on React', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/entities/**')
      .shouldNot()
      .dependOnFiles()
      .matching('react');

    await expect(rule).toPassAsync();
  });

  it('domain should not import external libraries', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .matching('axios')
      .and()
      .shouldNot()
      .dependOnFiles()
      .matching('lodash')
      .and()
      .shouldNot()
      .dependOnFiles()
      .matching('moment');

    await expect(rule).toPassAsync();
  });

  it('value objects should be immutable', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/value-objects/**')
      .should()
      .containsText('readonly')
      .or()
      .containsText('Readonly<');

    await expect(rule).toPassAsync();
  });
});
```

### 3. Use Case Rules

Use cases should contain application-specific business rules:

```typescript
describe('Use Case Rules', () => {
  it('use cases should implement single responsibility', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .haveName(/^[A-Z][a-zA-Z]*\.ts$/); // PascalCase single word

    await expect(rule).toPassAsync();
  });

  it('use cases should only depend on ports, not implementations', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/domain/**')
      .or()
      .inFolder('src/application/ports/**')
      .or()
      .inFolder('src/application/dto/**')
      .or()
      .inFolder('src/application/use-cases/**');

    await expect(rule).toPassAsync();
  });

  it('use cases should not directly instantiate infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });
});
```

### 4. Repository Pattern

Repositories should follow the interface segregation principle:

```typescript
describe('Repository Pattern Rules', () => {
  it('repository implementations should be in infrastructure', async () => {
    const rule = projectFiles()
      .withName('*Repository.ts')
      .that()
      .areNotIn('src/application/ports/**')
      .should()
      .beInFolder('src/infrastructure/repositories/**');

    await expect(rule).toPassAsync();
  });

  it('repository interfaces should be in application ports', async () => {
    const rule = projectFiles()
      .inFolder('src/application/ports/repositories/**')
      .should()
      .onlyContainInterfaces();

    await expect(rule).toPassAsync();
  });

  it('repository implementations should implement port interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/repositories/**')
      .should()
      .implementInterfaceFrom()
      .inFolder('src/application/ports/repositories/**');

    await expect(rule).toPassAsync();
  });
});
```

### 5. React Component Rules

React components should be in the presentation layer and follow naming conventions:

```typescript
describe('React Component Rules', () => {
  it('React components should be PascalCase', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/components/**')
      .withName('*.tsx')
      .should()
      .haveName(/^[A-Z][a-zA-Z]*\.tsx$/);

    await expect(rule).toPassAsync();
  });

  it('components should not directly call use cases', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/components/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/application/use-cases/**');

    await expect(rule).toPassAsync();
  });

  it('components should use presenters or hooks', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/components/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/presentation/hooks/**')
      .or()
      .inFolder('src/presentation/presenters/**')
      .or()
      .inFolder('src/presentation/components/**')
      .or()
      .matching('react')
      .or()
      .matching('@emotion/**');

    await expect(rule).toPassAsync();
  });
});
```

### 6. Custom Hook Rules

Custom hooks should mediate between components and use cases:

```typescript
describe('Custom Hook Rules', () => {
  it('hooks should start with "use"', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/hooks/**')
      .should()
      .haveName(/^use[A-Z][a-zA-Z]*\.ts$/);

    await expect(rule).toPassAsync();
  });

  it('hooks can call use cases through dependency injection', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/hooks/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/application/use-cases/**')
      .or()
      .inFolder('src/application/dto/**')
      .or()
      .inFolder('src/infrastructure/**')
      .or()
      .matching('react');

    await expect(rule).toPassAsync();
  });
});
```

## Code Quality Metrics

### Domain Layer Metrics

```typescript
import { metrics } from 'archunit';

describe('Domain Quality Metrics', () => {
  it('domain entities should be cohesive', async () => {
    const rule = metrics()
      .inFolder('src/domain/entities/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.3);

    await expect(rule).toPassAsync();
  });

  it('domain entities should not be too large', async () => {
    const rule = metrics()
      .inFolder('src/domain/entities/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(150);

    await expect(rule).toPassAsync();
  });

  it('value objects should be small', async () => {
    const rule = metrics()
      .inFolder('src/domain/value-objects/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(50);

    await expect(rule).toPassAsync();
  });
});
```

### Use Case Metrics

```typescript
describe('Use Case Quality Metrics', () => {
  it('use cases should have single responsibility', async () => {
    const rule = metrics()
      .inFolder('src/application/use-cases/**')
      .count()
      .methodCount()
      .shouldBe(1); // Should only have execute method

    await expect(rule).toPassAsync();
  });

  it('use cases should not be too complex', async () => {
    const rule = metrics()
      .inFolder('src/application/use-cases/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(100);

    await expect(rule).toPassAsync();
  });
});
```

### Component Metrics

```typescript
describe('Component Quality Metrics', () => {
  it('React components should not be too large', async () => {
    const rule = metrics()
      .inFolder('src/presentation/components/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(200);

    await expect(rule).toPassAsync();
  });

  it('components should have reasonable hook count', async () => {
    const rule = metrics()
      .inFolder('src/presentation/components/**')
      .customMetric('hookCount', 'Number of React hooks used', (classInfo) => {
        const hookPattern = /use[A-Z][a-zA-Z]*/g;
        const matches = classInfo.content.match(hookPattern);
        return matches ? matches.length : 0;
      })
      .shouldBeBelow(5);

    await expect(rule).toPassAsync();
  });
});
```

## Dependency Injection Rules

### Container Configuration

```typescript
describe('Dependency Injection Rules', () => {
  it('infrastructure implementations should be injectable', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/repositories/**')
      .should()
      .implementInterface()
      .fromFolder('src/application/ports/**');

    await expect(rule).toPassAsync();
  });

  it('use cases should receive dependencies through constructor', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .haveConstructorParameters()
      .thatAreInterfacesFrom('src/application/ports/**');

    await expect(rule).toPassAsync();
  });
});
```

## Testing Strategy

### Unit Testing Rules

```typescript
describe('Testing Architecture Rules', () => {
  it('domain entities should have unit tests', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/entities/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('tests/domain/entities/**');

    await expect(rule).toPassAsync();
  });

  it('use cases should have unit tests', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('tests/application/use-cases/**');

    await expect(rule).toPassAsync();
  });

  it('test files should not depend on infrastructure implementations', async () => {
    const rule = projectFiles()
      .withName('*.test.ts')
      .or()
      .withName('*.spec.ts')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });
});
```

## Error Handling Rules

### Domain Error Handling

```typescript
describe('Error Handling Rules', () => {
  it('domain errors should extend base domain error', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/errors/**')
      .should()
      .extendClass('DomainError');

    await expect(rule).toPassAsync();
  });

  it('use cases should handle domain errors', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .importFrom('src/domain/errors/**');

    await expect(rule).toPassAsync();
  });
});
```

## React-Specific Clean Architecture Patterns

### Custom Metrics for React Clean Architecture

```typescript
describe('React Clean Architecture Metrics', () => {
  it('should limit presenter complexity', async () => {
    const rule = metrics()
      .inFolder('src/presentation/presenters/**')
      .customMetric(
        'transformationCount',
        'Number of data transformations',
        (classInfo) => {
          // Count methods that transform data
          const transformMethods = classInfo.methods.filter(
            (method) =>
              method.name.includes('transform') ||
              method.name.includes('map') ||
              method.name.includes('format')
          );
          return transformMethods.length;
        }
      )
      .shouldBeBelow(5);

    await expect(rule).toPassAsync();
  });

  it('should measure hook dependency complexity', async () => {
    const rule = metrics()
      .inFolder('src/presentation/hooks/**')
      .customMetric(
        'dependencyArrayLength',
        'Average length of useEffect dependency arrays',
        (classInfo) => {
          const useEffectPattern = /useEffect\([^,]+,\s*\[([^\]]*)\]/g;
          const matches = [...classInfo.content.matchAll(useEffectPattern)];
          if (matches.length === 0) {
            return 0;
          }

          const totalDeps = matches.reduce((sum, match) => {
            const deps = match[1].split(',').filter((dep) => dep.trim());
            return sum + deps.length;
          }, 0);

          return totalDeps / matches.length;
        }
      )
      .shouldBeBelow(3);

    await expect(rule).toPassAsync();
  });
});
```

## Integration with State Management

### Redux/Zustand Integration Rules

```typescript
describe('State Management Integration', () => {
  it('stores should only contain presentation state', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/stores/**')
      .shouldNot()
      .containsText('businessRule')
      .and()
      .shouldNot()
      .containsText('validation')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domain/entities/**');

    await expect(rule).toPassAsync();
  });

  it('stores should use DTOs from application layer', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/stores/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/application/dto/**')
      .or()
      .inFolder('src/presentation/**')
      .or()
      .matching('zustand')
      .or()
      .matching('@reduxjs/toolkit');

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of This Architecture

1. **Framework Independence**: Business logic is not tied to React
2. **Testability**: Each layer can be tested in isolation
3. **Maintainability**: Clear separation of concerns
4. **Flexibility**: Easy to swap infrastructure implementations
5. **Scalability**: Well-defined boundaries support team scaling

## Common Violations and Solutions

### Direct Database Access from Components

**Problem**: Components directly calling API or accessing storage
**Solution**: Use hooks that call use cases through dependency injection

### Business Logic in Components

**Problem**: Validation or business rules in React components
**Solution**: Move logic to domain entities or use cases

### Infrastructure Leakage

**Problem**: React components importing infrastructure implementations
**Solution**: Use dependency injection and interface abstractions

### Mixed Concerns

**Problem**: Use cases handling UI state or React-specific logic
**Solution**: Keep use cases pure and handle UI concerns in presentation layer

This Clean Architecture setup ensures your React application remains maintainable, testable, and independent of external frameworks while providing clear architectural boundaries.
