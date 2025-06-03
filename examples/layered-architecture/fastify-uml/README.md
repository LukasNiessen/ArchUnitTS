# Layered Architecture - Fastify Backend with UML Validation

This example demonstrates how to enforce layered architecture patterns in a Fastify.js backend application using ArchUnitTS with UML diagram validation.

## Architecture Overview

This example uses UML diagrams to define and validate the layered architecture structure:

```
src/
├── api/           # API layer (routes, handlers)
├── application/   # Application services
├── domain/        # Domain models and interfaces
├── infrastructure/ # External services, databases
└── shared/        # Shared utilities
```

## UML Architecture Definition

### Layer Dependencies Diagram

```typescript
import { projectSlices } from 'archunit';

describe('UML-Driven Architecture', () => {
  it('should adhere to layered architecture diagram', async () => {
    const layeredDiagram = `
@startuml
!define API_COLOR #FFE6E6
!define APPLICATION_COLOR #E6F3FF  
!define DOMAIN_COLOR #E6FFE6
!define INFRASTRUCTURE_COLOR #FFF0E6
!define SHARED_COLOR #F0E6FF

package "API" API_COLOR {
  [Controllers]
  [Routes]
  [Handlers]
}

package "Application" APPLICATION_COLOR {
  [Services]
  [UseCases]
  [DTOs]
}

package "Domain" DOMAIN_COLOR {
  [Models]
  [Interfaces]
  [ValueObjects]
}

package "Infrastructure" INFRASTRUCTURE_COLOR {
  [Repositories]
  [ExternalServices]
  [Database]
}

package "Shared" SHARED_COLOR {
  [Utils]
  [Constants]
  [Types]
}

' Define allowed dependencies
[Controllers] --> [Services]
[Routes] --> [Controllers]
[Handlers] --> [Services]

[Services] --> [Models]
[Services] --> [Interfaces]
[UseCases] --> [Models]
[DTOs] --> [ValueObjects]

[Repositories] --> [Models]
[ExternalServices] --> [Interfaces]

[Controllers] --> [Utils]
[Services] --> [Utils]
[Models] --> [Utils]
[Repositories] --> [Utils]

@enduml`;

    const rule = projectSlices()
      .definedBy('src/(**)')
      .should()
      .adhereToDiagram(layeredDiagram);

    await expect(rule).toPassAsync();
  });
});
```

## Layer-Specific Rules

### 1. API Layer Rules

```typescript
describe('API Layer Rules', () => {
  it('routes should only depend on controllers', async () => {
    const rule = projectFiles()
      .inFolder('src/api/routes/**')
      .that()
      .dependOnFiles()
      .inFolder('src/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/api/controllers/**')
      .or()
      .inFolder('src/shared/**');

    await expect(rule).toPassAsync();
  });

  it('controllers should follow Fastify plugin pattern', async () => {
    const rule = projectFiles()
      .inFolder('src/api/controllers/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('FastifyPluginAsync') ||
          file.content.includes('FastifyPluginCallback'),
        'Controllers should be Fastify plugins'
      );

    await expect(rule).toPassAsync();
  });

  it('handlers should not directly access infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('src/api/handlers/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Application Layer Rules

```typescript
describe('Application Layer Rules', () => {
  it('services should not depend on API layer', async () => {
    const rule = projectFiles()
      .inFolder('src/application/services/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/api/**');

    await expect(rule).toPassAsync();
  });

  it('use cases should follow single responsibility', async () => {
    const rule = metrics()
      .inFolder('src/application/usecases/**')
      .count()
      .methodCount()
      .shouldBe(1); // Use cases should have one execute method

    await expect(rule).toPassAsync();
  });

  it('DTOs should be in correct location', async () => {
    const rule = projectFiles()
      .withName('*Dto.ts')
      .should()
      .beInFolder('src/application/dtos/**');

    await expect(rule).toPassAsync();
  });
});
```

### 3. Domain Layer Rules

```typescript
describe('Domain Layer Rules', () => {
  it('domain should not depend on external layers', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/{api,application,infrastructure}/**');

    await expect(rule).toPassAsync();
  });

  it('domain models should have high cohesion', async () => {
    const rule = metrics()
      .inFolder('src/domain/models/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.4);

    await expect(rule).toPassAsync();
  });

  it('value objects should be immutable', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/valueobjects/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('readonly') && !file.content.includes('set '),
        'Value objects should be immutable'
      );

    await expect(rule).toPassAsync();
  });
});
```

### 4. Infrastructure Layer Rules

```typescript
describe('Infrastructure Layer Rules', () => {
  it('repositories should implement domain interfaces', async () => {
    const rule = projectFiles()
      .inFolder('src/infrastructure/repositories/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('implements') && file.content.includes('Repository'),
        'Repositories should implement domain interfaces'
      );

    await expect(rule).toPassAsync();
  });

  it('external services should not leak into domain', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .withName('*Client.ts')
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });
});
```

## Component-Level UML Validation

### Service Dependencies

```typescript
describe('Service-Level Architecture', () => {
  it('should validate service interaction diagram', async () => {
    const serviceDiagram = `
@startuml
component [UserService] as US
component [AuthService] as AS  
component [EmailService] as ES
component [UserRepository] as UR
component [TokenRepository] as TR

US --> UR : uses
US --> AS : authenticates with
AS --> TR : manages tokens
AS --> ES : sends notifications
ES -.-> US : notifies completion

@enduml`;

    const rule = projectSlices()
      .definedBy('src/application/services/(**Service).ts')
      .should()
      .adhereToDiagram(serviceDiagram);

    await expect(rule).toPassAsync();
  });
});
```

## Example Project Structure

```
src/
├── api/
│   ├── controllers/
│   │   ├── UserController.ts
│   │   └── ProductController.ts
│   ├── routes/
│   │   ├── userRoutes.ts
│   │   └── productRoutes.ts
│   └── handlers/
│       ├── authHandler.ts
│       └── errorHandler.ts
├── application/
│   ├── services/
│   │   ├── UserService.ts
│   │   └── ProductService.ts
│   ├── usecases/
│   │   ├── CreateUserUseCase.ts
│   │   └── UpdateProductUseCase.ts
│   └── dtos/
│       ├── CreateUserDto.ts
│       └── UpdateProductDto.ts
├── domain/
│   ├── models/
│   │   ├── User.ts
│   │   └── Product.ts
│   ├── interfaces/
│   │   ├── IUserRepository.ts
│   │   └── IProductRepository.ts
│   └── valueobjects/
│       ├── Email.ts
│       └── Money.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── MongoUserRepository.ts
│   │   └── MongoProductRepository.ts
│   ├── external/
│   │   ├── EmailClient.ts
│   │   └── PaymentClient.ts
│   └── database/
│       └── connection.ts
└── shared/
    ├── utils/
    │   └── logger.ts
    ├── constants/
    │   └── errorCodes.ts
    └── types/
        └── common.ts
```

## Advanced UML Patterns

### Dependency Injection Validation

```typescript
describe('Dependency Injection', () => {
  it('should validate DI container structure', async () => {
    const diDiagram = `
@startuml
interface IUserRepository
interface IEmailService
class UserService
class MongoUserRepository
class SmtpEmailService

UserService --> IUserRepository : depends on
UserService --> IEmailService : depends on
MongoUserRepository ..|> IUserRepository : implements
SmtpEmailService ..|> IEmailService : implements

@enduml`;

    const rule = projectSlices()
      .definedBy('src/(**)')
      .should()
      .adhereToDiagram(diDiagram);

    await expect(rule).toPassAsync();
  });
});
```

### Plugin Architecture Validation

```typescript
describe('Fastify Plugin Architecture', () => {
  it('should validate plugin dependency diagram', async () => {
    const pluginDiagram = `
@startuml
component [AppPlugin] as App
component [AuthPlugin] as Auth
component [UserPlugin] as User
component [DatabasePlugin] as DB

App --> Auth : registers
App --> User : registers  
App --> DB : registers
User --> Auth : depends on
Auth --> DB : depends on

@enduml`;

    const rule = projectSlices()
      .definedBy('src/plugins/(**Plugin).ts')
      .should()
      .adhereToDiagram(pluginDiagram);

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of UML-Driven Architecture

1. **Visual Documentation**: Architecture is documented visually
2. **Automated Validation**: UML diagrams are enforced by tests
3. **Clear Dependencies**: Relationships between components are explicit
4. **Design First**: Architecture is designed before implementation
5. **Living Documentation**: Diagrams stay synchronized with code

## Fastify-Specific Patterns

### Plugin Registration Order

```typescript
describe('Plugin Registration', () => {
  it('database plugins should register before business plugins', async () => {
    const rule = projectFiles()
      .withName('*Plugin.ts')
      .should()
      .adhereTo((file) => {
        if (file.fileName.includes('Database')) {
          return file.content.includes('priority: 100');
        }
        return true;
      }, 'Database plugins should have higher priority');

    await expect(rule).toPassAsync();
  });
});
```

### Schema Validation

```typescript
describe('Schema Validation', () => {
  it('API endpoints should have JSON schemas', async () => {
    const rule = projectFiles()
      .inFolder('src/api/routes/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('schema:') || file.content.includes('preValidation'),
        'Routes should include validation schemas'
      );

    await expect(rule).toPassAsync();
  });
});
```

This UML-driven approach ensures your Fastify application maintains a clean layered architecture with visual documentation that stays synchronized with your code.
