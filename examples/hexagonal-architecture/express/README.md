# Express Hexagonal Architecture with ArchUnitTS

This example demonstrates how to enforce Hexagonal Architecture (Ports and Adapters) principles in an Express.js application using ArchUnitTS. Hexagonal Architecture isolates the core business logic from external concerns through well-defined ports and adapters.

## Architecture Overview

```
src/
├── domain/                     # Core Business Logic (Hexagon Center)
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   └── Order.ts
│   ├── value-objects/
│   │   ├── Email.ts
│   │   ├── Money.ts
│   │   └── Address.ts
│   ├── services/               # Domain Services
│   │   ├── UserDomainService.ts
│   │   ├── ProductDomainService.ts
│   │   └── OrderDomainService.ts
│   └── events/
│       ├── UserCreated.ts
│       ├── OrderPlaced.ts
│       └── ProductUpdated.ts
├── application/                # Application Core
│   ├── use-cases/              # Application Services
│   │   ├── user/
│   │   │   ├── CreateUserUseCase.ts
│   │   │   ├── GetUserUseCase.ts
│   │   │   └── UpdateUserUseCase.ts
│   │   ├── product/
│   │   └── order/
│   └── ports/                  # Interfaces (Primary & Secondary Ports)
│       ├── primary/            # Driver Ports (API interfaces)
│       │   ├── UserService.ts
│       │   ├── ProductService.ts
│       │   └── OrderService.ts
│       └── secondary/          # Driven Ports (Repository/External service interfaces)
│           ├── repositories/
│           │   ├── UserRepository.ts
│           │   ├── ProductRepository.ts
│           │   └── OrderRepository.ts
│           ├── services/
│           │   ├── EmailService.ts
│           │   ├── PaymentService.ts
│           │   └── NotificationService.ts
│           └── messaging/
│               ├── EventPublisher.ts
│               └── EventConsumer.ts
├── infrastructure/             # Adapters (Secondary/Driven Adapters)
│   ├── persistence/            # Database Adapters
│   │   ├── mongodb/
│   │   │   ├── MongoUserRepository.ts
│   │   │   ├── MongoProductRepository.ts
│   │   │   └── connection.ts
│   │   └── postgres/
│   │       ├── PostgresUserRepository.ts
│   │       └── connection.ts
│   ├── external-services/      # External Service Adapters
│   │   ├── email/
│   │   │   ├── SendGridEmailService.ts
│   │   │   └── SMTPEmailService.ts
│   │   ├── payment/
│   │   │   ├── StripePaymentService.ts
│   │   │   └── PayPalPaymentService.ts
│   │   └── notification/
│   │       ├── SlackNotificationService.ts
│   │       └── PushNotificationService.ts
│   ├── messaging/              # Message Bus Adapters
│   │   ├── rabbitmq/
│   │   │   ├── RabbitMQEventPublisher.ts
│   │   │   └── RabbitMQEventConsumer.ts
│   │   └── redis/
│   │       ├── RedisEventPublisher.ts
│   │       └── connection.ts
│   └── config/
│       ├── database.ts
│       ├── messaging.ts
│       └── external-services.ts
├── adapters/                   # Primary Adapters (Driver Adapters)
│   ├── web/                    # HTTP/REST Adapters
│   │   ├── controllers/
│   │   │   ├── UserController.ts
│   │   │   ├── ProductController.ts
│   │   │   └── OrderController.ts
│   │   ├── routes/
│   │   │   ├── userRoutes.ts
│   │   │   ├── productRoutes.ts
│   │   │   └── orderRoutes.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── validationMiddleware.ts
│   │   │   └── errorMiddleware.ts
│   │   └── dto/
│   │       ├── CreateUserDto.ts
│   │       ├── UpdateUserDto.ts
│   │       └── UserResponseDto.ts
│   ├── graphql/                # GraphQL Adapters
│   │   ├── resolvers/
│   │   │   ├── UserResolver.ts
│   │   │   └── ProductResolver.ts
│   │   └── schema/
│   │       ├── userSchema.ts
│   │       └── productSchema.ts
│   ├── cli/                    # Command Line Adapters
│   │   ├── commands/
│   │   │   ├── SeedDataCommand.ts
│   │   │   └── MigrateCommand.ts
│   │   └── CommandRunner.ts
│   └── messaging/              # Message Consumer Adapters
│       ├── EventHandler.ts
│       └── CommandHandler.ts
└── tests/
    └── architecture/
```

## Key Architectural Rules

### 1. Hexagonal Architecture Dependency Rules

The core principle - the domain should not depend on anything external:

```typescript
import { projectFiles } from 'archunit';

describe('Hexagonal Architecture Dependency Rules', () => {
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
      .inFolder('src/adapters/**');

    await expect(rule).toPassAsync();
  });

  it('application should only depend on domain and its own ports', async () => {
    const rule = projectFiles()
      .inFolder('src/application/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/domain/**')
      .or()
      .inFolder('src/application/**')
      .or()
      .matching('@types/**')
      .or()
      .matching('node_modules/**');

    await expect(rule).toPassAsync();
  });

  it('infrastructure should not depend on adapters', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/adapters/**');

    await expect(rule).toPassAsync();
  });

  it('adapters should not depend on infrastructure directly', async () => {
    const rule = projectFiles()
      .inFolder('src/adapters/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/application/**')
      .or()
      .inFolder('src/adapters/**')
      .or()
      .matching('express')
      .or()
      .matching('graphql')
      .or()
      .matching('@types/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Port and Adapter Rules

Ensure proper implementation of ports and adapters pattern:

```typescript
describe('Port and Adapter Rules', () => {
  it('primary ports should be interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/application/ports/primary/**')
      .should()
      .onlyContainInterfaces();

    await expect(rule).toPassAsync();
  });

  it('secondary ports should be interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/application/ports/secondary/**')
      .should()
      .onlyContainInterfaces();

    await expect(rule).toPassAsync();
  });

  it('infrastructure adapters should implement secondary ports', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/**')
      .withName('*Repository.ts')
      .or()
      .withName('*Service.ts')
      .should()
      .implementInterfaceFrom()
      .inFolder('src/application/ports/secondary/**');

    await expect(rule).toPassAsync();
  });

  it('web adapters should implement primary ports', async () => {
    const rule = projectFiles()
      .inFolder('src/adapters/web/controllers/**')
      .should()
      .dependOnFiles()
      .inFolder('src/application/ports/primary/**');

    await expect(rule).toPassAsync();
  });
});
```

### 3. Use Case Rules

Use cases should orchestrate business logic without framework dependencies:

```typescript
describe('Use Case Rules', () => {
  it('use cases should not depend on Express', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .shouldNot()
      .dependOnFiles()
      .matching('express');

    await expect(rule).toPassAsync();
  });

  it('use cases should not depend on database libraries', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .shouldNot()
      .dependOnFiles()
      .matching('mongoose')
      .and()
      .shouldNot()
      .dependOnFiles()
      .matching('sequelize')
      .and()
      .shouldNot()
      .dependOnFiles()
      .matching('typeorm');

    await expect(rule).toPassAsync();
  });

  it('use cases should only depend on domain and secondary ports', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/domain/**')
      .or()
      .inFolder('src/application/ports/secondary/**')
      .or()
      .inFolder('src/application/use-cases/**');

    await expect(rule).toPassAsync();
  });
});
```

### 4. Controller Rules

Controllers should be thin and only handle HTTP concerns:

```typescript
describe('Controller Rules', () => {
  it('controllers should not contain business logic', async () => {
    const rule = projectFiles()
      .inFolder('src/adapters/web/controllers/**')
      .shouldNot()
      .containsText('businessRule')
      .and()
      .shouldNot()
      .containsText('domainLogic')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domain/entities/**');

    await expect(rule).toPassAsync();
  });

  it('controllers should only depend on primary ports', async () => {
    const rule = projectFiles()
      .inFolder('src/adapters/web/controllers/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/application/ports/primary/**')
      .or()
      .inFolder('src/adapters/web/dto/**')
      .or()
      .inFolder('src/adapters/web/controllers/**')
      .or()
      .matching('express')
      .or()
      .matching('@types/**');

    await expect(rule).toPassAsync();
  });

  it('controllers should follow naming convention', async () => {
    const rule = projectFiles()
      .inFolder('src/adapters/web/controllers/**')
      .should()
      .haveName('*Controller.ts');

    await expect(rule).toPassAsync();
  });
});
```

### 5. Repository Rules

Repository implementations should be in infrastructure layer:

```typescript
describe('Repository Rules', () => {
  it('repository implementations should be in infrastructure', async () => {
    const rule = projectFiles()
      .withName('*Repository.ts')
      .that()
      .areNotIn('src/application/ports/**')
      .should()
      .beInFolder('src/infrastructure/persistence/**');

    await expect(rule).toPassAsync();
  });

  it('repositories should not leak database concerns', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/persistence/**')
      .shouldNot()
      .exposeType('mongoose.Document')
      .and()
      .shouldNot()
      .exposeType('Sequelize');

    await expect(rule).toPassAsync();
  });

  it('repository interfaces should be database agnostic', async () => {
    const rule = projectFiles()
      .inFolder('src/application/ports/secondary/repositories/**')
      .shouldNot()
      .containsText('mongoose')
      .and()
      .shouldNot()
      .containsText('sequelize')
      .and()
      .shouldNot()
      .containsText('ObjectId');

    await expect(rule).toPassAsync();
  });
});
```

### 6. Domain Service Rules

Domain services should only contain domain logic:

```typescript
describe('Domain Service Rules', () => {
  it('domain services should not depend on infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/services/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/adapters/**');

    await expect(rule).toPassAsync();
  });

  it('domain services should only work with domain objects', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/services/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/domain/**');

    await expect(rule).toPassAsync();
  });
});
```

## Code Quality Metrics

### Domain Layer Metrics

```typescript
import { metrics } from 'archunit';

describe('Domain Quality Metrics', () => {
  it('domain entities should be highly cohesive', async () => {
    const rule = metrics()
      .inFolder('src/domain/entities/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.2);

    await expect(rule).toPassAsync();
  });

  it('domain entities should not be too large', async () => {
    const rule = metrics()
      .inFolder('src/domain/entities/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(200);

    await expect(rule).toPassAsync();
  });

  it('value objects should be small and focused', async () => {
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
      .shouldBeBelowOrEqual(3); // execute, validate, and maybe one helper

    await expect(rule).toPassAsync();
  });

  it('use cases should not be too complex', async () => {
    const rule = metrics()
      .inFolder('src/application/use-cases/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(150);

    await expect(rule).toPassAsync();
  });
});
```

### Controller Metrics

```typescript
describe('Controller Quality Metrics', () => {
  it('controllers should be thin', async () => {
    const rule = metrics()
      .inFolder('src/adapters/web/controllers/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(100);

    await expect(rule).toPassAsync();
  });

  it('controllers should have low complexity', async () => {
    const rule = metrics()
      .inFolder('src/adapters/web/controllers/**')
      .count()
      .methodCount()
      .shouldBeBelow(8);

    await expect(rule).toPassAsync();
  });
});
```

## Advanced Hexagonal Architecture Rules

### Event-Driven Architecture Rules

```typescript
describe('Event-Driven Architecture Rules', () => {
  it('domain events should be published through ports', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .that()
      .publishEvents()
      .should()
      .usePort()
      .fromFolder('src/application/ports/secondary/messaging/**');

    await expect(rule).toPassAsync();
  });

  it('event handlers should be in application layer', async () => {
    const rule = projectFiles()
      .withName('*EventHandler.ts')
      .should()
      .beInFolder('src/application/**')
      .or()
      .beInFolder('src/adapters/messaging/**');

    await expect(rule).toPassAsync();
  });
});
```

### Configuration and Dependency Injection

```typescript
describe('Dependency Injection Rules', () => {
  it('configuration should be in infrastructure', async () => {
    const rule = projectFiles()
      .withName('*Config.ts')
      .or()
      .withName('config.ts')
      .should()
      .beInFolder('src/infrastructure/config/**');

    await expect(rule).toPassAsync();
  });

  it('dependency injection container should wire adapters to ports', async () => {
    const rule = projectFiles()
      .withName('*Container.ts')
      .or()
      .withName('dependencies.ts')
      .should()
      .beInFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });
});
```

## Testing Strategy

### Unit Testing Rules

```typescript
describe('Testing Architecture Rules', () => {
  it('domain entities should have pure unit tests', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/entities/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('tests/unit/domain/entities/**');

    await expect(rule).toPassAsync();
  });

  it('use cases should be tested with mock adapters', async () => {
    const rule = projectFiles()
      .inFolder('src/application/use-cases/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('tests/unit/application/use-cases/**');

    await expect(rule).toPassAsync();
  });

  it('adapters should have integration tests', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('tests/integration/infrastructure/**');

    await expect(rule).toPassAsync();
  });

  it('test files should not depend on concrete adapters', async () => {
    const rule = projectFiles()
      .withName('*.test.ts')
      .that()
      .areNotIn('tests/integration/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });
});
```

## Custom Metrics for Hexagonal Architecture

### Port Usage Analysis

```typescript
describe('Hexagonal Architecture Metrics', () => {
  it('should measure port interface segregation', async () => {
    const rule = metrics()
      .inFolder('src/application/ports/**')
      .customMetric(
        'interfaceMethodCount',
        'Number of methods per interface',
        (classInfo) => {
          // Count interface methods
          const interfaces = classInfo.interfaces || [];
          return interfaces.reduce((sum, iface) => sum + (iface.methods?.length || 0), 0);
        }
      )
      .shouldBeBelow(5); // Keep interfaces small

    await expect(rule).toPassAsync();
  });

  it('should measure adapter implementation complexity', async () => {
    const rule = metrics()
      .inFolder('src/infrastructure/**')
      .customMetric(
        'adapterComplexity',
        'Complexity of adapter implementations',
        (classInfo) => {
          // Measure by counting external dependencies
          const externalDependencies = classInfo.imports.filter(
            (imp) =>
              !imp.startsWith('../') && !imp.startsWith('./') && !imp.startsWith('src/')
          );
          return externalDependencies.length;
        }
      )
      .shouldBeBelow(3);

    await expect(rule).toPassAsync();
  });
});
```

## Framework-Specific Rules

### Express.js Integration Rules

```typescript
describe('Express Integration Rules', () => {
  it('Express types should only be in web adapters', async () => {
    const rule = projectFiles()
      .that()
      .importFrom('express')
      .should()
      .beInFolder('src/adapters/web/**');

    await expect(rule).toPassAsync();
  });

  it('middleware should not contain business logic', async () => {
    const rule = projectFiles()
      .inFolder('src/adapters/web/middleware/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domain/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/application/use-cases/**');

    await expect(rule).toPassAsync();
  });
});
```

### Database Integration Rules

```typescript
describe('Database Integration Rules', () => {
  it('database connections should be isolated', async () => {
    const rule = projectFiles()
      .withName('connection.ts')
      .or()
      .withName('*Connection.ts')
      .should()
      .beInFolder('src/infrastructure/persistence/**');

    await expect(rule).toPassAsync();
  });

  it('database models should not leak into domain', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .matching('mongoose')
      .and()
      .shouldNot()
      .dependOnFiles()
      .matching('sequelize');

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of Hexagonal Architecture

1. **Framework Independence**: Business logic is isolated from frameworks
2. **Testability**: Easy to test with mock adapters
3. **Flexibility**: Can swap implementations without changing business logic
4. **Maintainability**: Clear separation of concerns
5. **Portability**: Can move to different frameworks easily

## Common Violations and Solutions

### Framework Leakage into Domain

**Problem**: Domain entities depending on Express or database libraries
**Solution**: Use ports to abstract external dependencies

### Business Logic in Controllers

**Problem**: Controllers containing validation or business rules
**Solution**: Move logic to use cases and domain services

### Direct Database Access from Use Cases

**Problem**: Use cases directly calling database libraries
**Solution**: Use repository ports and dependency injection

### Circular Dependencies Between Layers

**Problem**: Adapters depending on each other or infrastructure depending on adapters
**Solution**: Follow the dependency rule - dependencies point inward

This Hexagonal Architecture setup ensures your Express application maintains clear boundaries, proper isolation, and high testability while keeping business logic independent of external frameworks and libraries.
