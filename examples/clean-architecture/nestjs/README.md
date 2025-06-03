# Clean Architecture - NestJS Backend

This example demonstrates how to enforce Clean Architecture patterns in a NestJS backend application using ArchUnitTS.

## Architecture Overview

Clean Architecture organizes code in concentric circles where dependencies point inward:

```
src/
├── domain/           # Enterprise Business Rules (innermost)
├── application/      # Application Business Rules
├── infrastructure/   # Frameworks & Drivers (outermost)
└── presentation/     # Interface Adapters
```

## Dependency Rules

### 1. Core Dependency Rule

The fundamental rule of Clean Architecture: dependencies must point inward only.

```typescript
import { projectFiles } from 'archunit';

describe('Clean Architecture Dependency Rules', () => {
  it('domain should not depend on any other layer', async () => {
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

  it('application should not depend on presentation', async () => {
    const rule = projectFiles()
      .inFolder('src/application/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/presentation/**');

    await expect(rule).toPassAsync();
  });

  it('presentation should not depend on infrastructure details', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/controllers/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/{database,external}/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Interface Segregation

Ensure proper use of interfaces and abstractions:

```typescript
describe('Interface Segregation Rules', () => {
  it('application should depend on domain interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/application/services/**')
      .that()
      .dependOnFiles()
      .inFolder('src/domain/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/domain/interfaces/**')
      .or()
      .inFolder('src/domain/entities/**')
      .or()
      .inFolder('src/domain/value-objects/**');

    await expect(rule).toPassAsync();
  });

  it('infrastructure should implement domain interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/repositories/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('implements') && file.content.includes('Repository'),
        'Infrastructure repositories should implement domain interfaces'
      );

    await expect(rule).toPassAsync();
  });

  it('presentation should depend on application interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/controllers/**')
      .that()
      .dependOnFiles()
      .inFolder('src/application/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/application/interfaces/**')
      .or()
      .inFolder('src/application/dtos/**');

    await expect(rule).toPassAsync();
  });
});
```

## Domain Layer Rules

### 1. Enterprise Business Rules

```typescript
describe('Domain Layer Rules', () => {
  it('entities should be rich domain models', async () => {
    const rule = metrics()
      .inFolder('src/domain/entities/**')
      .count()
      .methodCount()
      .shouldBeAbove(3); // Rich models should have behavior

    await expect(rule).toPassAsync();
  });

  it('entities should have high cohesion', async () => {
    const rule = metrics()
      .inFolder('src/domain/entities/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.4);

    await expect(rule).toPassAsync();
  });

  it('value objects should be immutable', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/value-objects/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('readonly') && !file.content.includes('set '),
        'Value objects should be immutable'
      );

    await expect(rule).toPassAsync();
  });

  it('domain services should contain complex business logic', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/services/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('business') || file.content.includes('domain'),
        'Domain services should contain business logic'
      );

    await expect(rule).toPassAsync();
  });

  it('domain should not import framework code', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .importModules(['@nestjs/*', 'typeorm', 'mongoose']);

    await expect(rule).toPassAsync();
  });
});
```

### 2. Domain Events

```typescript
describe('Domain Events', () => {
  it('domain events should be in domain layer', async () => {
    const rule = projectFiles()
      .withName('*Event.ts')
      .should()
      .beInFolder('src/domain/events/**');

    await expect(rule).toPassAsync();
  });

  it('entities should publish domain events', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/entities/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('addDomainEvent') ||
          file.content.includes('publishEvent'),
        'Entities should be able to publish domain events'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Application Layer Rules

### 1. Use Cases

```typescript
describe('Application Layer Rules', () => {
  it('use cases should follow single responsibility', async () => {
    const rule = metrics()
      .inFolder('src/application/use-cases/**')
      .count()
      .methodCount()
      .shouldBe(1); // One execute method per use case

    await expect(rule).toPassAsync();
  });

  it('use cases should be named with verbs', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .haveName(
        /^(Create|Update|Delete|Get|Find|Process|Calculate|Validate).*UseCase\.ts$/
      );

    await expect(rule).toPassAsync();
  });

  it('use cases should not depend on external frameworks', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .shouldNot()
      .importModules(['@nestjs/*', 'express', 'typeorm']);

    await expect(rule).toPassAsync();
  });

  it('application services should orchestrate use cases', async () => {
    const rule = projectFiles()
      .inFolder('src/application/services/**')
      .should()
      .dependOnFiles()
      .inFolder('src/application/use-cases/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. DTOs and Interfaces

```typescript
describe('Application DTOs and Interfaces', () => {
  it('DTOs should be in application layer', async () => {
    const rule = projectFiles()
      .withName('*Dto.ts')
      .should()
      .beInFolder('src/application/dtos/**');

    await expect(rule).toPassAsync();
  });

  it('DTOs should not contain business logic', async () => {
    const rule = metrics()
      .inFolder('src/application/dtos/**')
      .count()
      .methodCount()
      .shouldBe(0); // DTOs should be data containers only

    await expect(rule).toPassAsync();
  });

  it('application interfaces should define contracts', async () => {
    const rule = projectFiles()
      .inFolder('src/application/interfaces/**')
      .should()
      .haveName(/^I[A-Z].*\.ts$/); // Interface naming convention

    await expect(rule).toPassAsync();
  });
});
```

## Infrastructure Layer Rules

### 1. External Dependencies

```typescript
describe('Infrastructure Layer Rules', () => {
  it('database implementations should be in infrastructure', async () => {
    const rule = projectFiles()
      .that()
      .importModules(['typeorm', 'mongoose', 'prisma'])
      .should()
      .beInFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });

  it('external service clients should be in infrastructure', async () => {
    const rule = projectFiles()
      .withName('*Client.ts')
      .should()
      .beInFolder('src/infrastructure/external/**');

    await expect(rule).toPassAsync();
  });

  it('infrastructure should not leak into other layers', async () => {
    const rule = projectFiles()
      .inFolder('src/{domain,application,presentation}/**')
      .shouldNot()
      .importModules(['typeorm', 'mongoose', 'axios', 'redis']);

    await expect(rule).toPassAsync();
  });

  it('repositories should implement domain interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/repositories/**')
      .should()
      .dependOnFiles()
      .inFolder('src/domain/interfaces/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Configuration

```typescript
describe('Infrastructure Configuration', () => {
  it('configuration should be in infrastructure', async () => {
    const rule = projectFiles()
      .withName('*Config.ts')
      .should()
      .beInFolder('src/infrastructure/config/**');

    await expect(rule).toPassAsync();
  });

  it('environment variables should be accessed through config', async () => {
    const rule = projectFiles()
      .inFolder('src/{domain,application,presentation}/**')
      .shouldNot()
      .adhereTo(
        (file) => file.content.includes('process.env'),
        'Environment variables should be accessed through configuration layer'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Presentation Layer Rules

### 1. Controllers

```typescript
describe('Presentation Layer Rules', () => {
  it('controllers should be thin', async () => {
    const rule = metrics()
      .inFolder('src/presentation/controllers/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(100); // Controllers should be thin

    await expect(rule).toPassAsync();
  });

  it('controllers should not contain business logic', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/controllers/**')
      .should()
      .adhereTo(
        (file) =>
          !file.content.includes('business') && !file.content.includes('calculation'),
        'Controllers should not contain business logic'
      );

    await expect(rule).toPassAsync();
  });

  it('controllers should use dependency injection', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/controllers/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('@Inject') || file.content.includes('constructor'),
        'Controllers should use dependency injection'
      );

    await expect(rule).toPassAsync();
  });
});
```

### 2. DTOs and Validation

```typescript
describe('Presentation DTOs and Validation', () => {
  it('request DTOs should have validation', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/dtos/**')
      .withName('*Request*.ts')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('@IsString') ||
          file.content.includes('@IsNumber') ||
          file.content.includes('@IsEmail'),
        'Request DTOs should include validation decorators'
      );

    await expect(rule).toPassAsync();
  });

  it('response DTOs should not expose internal details', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/dtos/**')
      .withName('*Response*.ts')
      .should()
      .adhereTo(
        (file) =>
          !file.content.includes('password') && !file.content.includes('internal'),
        'Response DTOs should not expose sensitive data'
      );

    await expect(rule).toPassAsync();
  });
});
```

## NestJS-Specific Rules

### 1. Module Organization

```typescript
describe('NestJS Module Rules', () => {
  it('each layer should have its own module', async () => {
    const rule = projectFiles()
      .inFolder('src/{domain,application,infrastructure,presentation}/')
      .should()
      .containFile('*.module.ts');

    await expect(rule).toPassAsync();
  });

  it('modules should not import implementation details', async () => {
    const rule = projectFiles()
      .withName('*.module.ts')
      .should()
      .adhereTo(
        (file) =>
          !file.content.includes('Repository') || file.content.includes('interface'),
        'Modules should import interfaces, not implementations'
      );

    await expect(rule).toPassAsync();
  });

  it('feature modules should be self-contained', async () => {
    const rule = projectFiles()
      .inFolder('src/features/*/presentation/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/features/*/application/**')
      .exceptWhen()
      .inSameFeature();

    await expect(rule).toPassAsync();
  });
});
```

### 2. Dependency Injection

```typescript
describe('NestJS Dependency Injection', () => {
  it('services should be injectable', async () => {
    const rule = projectFiles()
      .inFolder('src/application/services/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('@Injectable()'),
        'Application services should be injectable'
      );

    await expect(rule).toPassAsync();
  });

  it('repositories should be provided in modules', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/repositories/**')
      .should()
      .beProvidedIn()
      .modules()
      .inFolder('src/infrastructure/modules/**');

    await expect(rule).toPassAsync();
  });
});
```

## Example Project Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   └── Order.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Money.ts
│   │   └── Address.ts
│   ├── interfaces/
│   │   ├── IUserRepository.ts
│   │   ├── IProductRepository.ts
│   │   └── IOrderRepository.ts
│   ├── services/
│   │   ├── OrderDomainService.ts
│   │   └── PricingDomainService.ts
│   ├── events/
│   │   ├── UserCreatedEvent.ts
│   │   └── OrderPlacedEvent.ts
│   └── domain.module.ts
├── application/
│   ├── use-cases/
│   │   ├── CreateUserUseCase.ts
│   │   ├── PlaceOrderUseCase.ts
│   │   └── CalculatePriceUseCase.ts
│   ├── services/
│   │   ├── UserApplicationService.ts
│   │   └── OrderApplicationService.ts
│   ├── dtos/
│   │   ├── CreateUserDto.ts
│   │   └── PlaceOrderDto.ts
│   ├── interfaces/
│   │   ├── IUserApplicationService.ts
│   │   └── IOrderApplicationService.ts
│   ├── handlers/
│   │   └── OrderEventHandler.ts
│   └── application.module.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── TypeOrmUserRepository.ts
│   │   ├── TypeOrmProductRepository.ts
│   │   └── TypeOrmOrderRepository.ts
│   ├── external/
│   │   ├── PaymentClient.ts
│   │   └── EmailClient.ts
│   ├── config/
│   │   ├── DatabaseConfig.ts
│   │   └── AppConfig.ts
│   ├── persistence/
│   │   ├── UserEntity.ts
│   │   └── ProductEntity.ts
│   └── infrastructure.module.ts
├── presentation/
│   ├── controllers/
│   │   ├── UserController.ts
│   │   ├── ProductController.ts
│   │   └── OrderController.ts
│   ├── dtos/
│   │   ├── CreateUserRequestDto.ts
│   │   ├── CreateUserResponseDto.ts
│   │   ├── PlaceOrderRequestDto.ts
│   │   └── PlaceOrderResponseDto.ts
│   ├── filters/
│   │   └── HttpExceptionFilter.ts
│   ├── guards/
│   │   └── AuthGuard.ts
│   └── presentation.module.ts
├── features/
│   ├── user-management/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── presentation/
│   │   └── user-management.module.ts
│   └── order-processing/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── presentation/
│       └── order-processing.module.ts
├── shared/
│   ├── decorators/
│   ├── pipes/
│   └── shared.module.ts
├── app.module.ts
└── main.ts
```

## Testing Strategy

### 1. Unit Testing

```typescript
describe('Clean Architecture Testing', () => {
  it('domain entities should have unit tests', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/entities/**')
      .should()
      .haveCorrespondingFiles()
      .withName('*.spec.ts');

    await expect(rule).toPassAsync();
  });

  it('use cases should have unit tests', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .haveCorrespondingFiles()
      .withName('*.spec.ts');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Integration Testing

```typescript
describe('Integration Testing', () => {
  it('repositories should have integration tests', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/repositories/**')
      .should()
      .haveCorrespondingFiles()
      .withName('*.integration.spec.ts');

    await expect(rule).toPassAsync();
  });

  it('controllers should have e2e tests', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/controllers/**')
      .should()
      .haveCorrespondingFiles()
      .withName('*.e2e.spec.ts');

    await expect(rule).toPassAsync();
  });
});
```

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
