# Micro-Services Architecture - Express with Nx

This example demonstrates how to enforce micro-services architecture patterns in an Express.js monorepo using Nx and ArchUnitTS.

## Architecture Overview

Nx workspaces provide excellent support for micro-services architecture with clear boundaries between services:

```
apps/
├── user-service/        # User management service
├── product-service/     # Product catalog service
├── order-service/       # Order processing service
└── gateway-service/     # API Gateway
libs/
├── shared-models/       # Common data models
├── shared-utils/        # Utility functions
└── event-bus/          # Event-driven communication
```

## Service Boundary Rules

### 1. Service Independence

```typescript
import { projectFiles } from 'archunit';

describe('Micro-Services Boundaries', () => {
  it('services should not directly depend on other services', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/{product-service,order-service}/**');

    await expect(rule).toPassAsync();
  });

  it('product service should be independent', async () => {
    const rule = projectFiles()
      .inFolder('apps/product-service/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/{user-service,order-service}/**');

    await expect(rule).toPassAsync();
  });

  it('order service should be independent', async () => {
    const rule = projectFiles()
      .inFolder('apps/order-service/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/{user-service,product-service}/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Shared Library Usage

```typescript
describe('Shared Libraries', () => {
  it('services can depend on shared libraries', async () => {
    const rule = projectFiles()
      .inFolder('apps/**')
      .mayDependOnFiles()
      .inFolder('libs/shared-*/**');

    await expect(rule).toPassAsync();
  });

  it('shared libraries should not depend on services', async () => {
    const rule = projectFiles()
      .inFolder('libs/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/**');

    await expect(rule).toPassAsync();
  });

  it('shared models should be framework agnostic', async () => {
    const rule = projectFiles()
      .inFolder('libs/shared-models/**')
      .shouldNot()
      .importModules(['express', 'fastify', '@nestjs/*']);

    await expect(rule).toPassAsync();
  });
});
```

### 3. API Gateway Rules

```typescript
describe('API Gateway', () => {
  it('gateway can communicate with all services', async () => {
    const rule = projectFiles()
      .inFolder('apps/gateway-service/**')
      .mayDependOnFiles()
      .inFolder('apps/*-service/**');

    await expect(rule).toPassAsync();
  });

  it('only gateway should handle cross-service communication', async () => {
    const rule = projectFiles()
      .inFolder('apps/{user,product,order}-service/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/{user,product,order}-service/**')
      .exceptWhen()
      .inSameService();

    await expect(rule).toPassAsync();
  });
});
```

## Service-Specific Rules

### 1. User Service Rules

```typescript
describe('User Service Architecture', () => {
  it('user service should follow layered architecture', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/src/controllers/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/user-service/src/repositories/**');

    await expect(rule).toPassAsync();
  });

  it('user service should handle authentication', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/**')
      .should()
      .containFiles()
      .withName('*Auth*');

    await expect(rule).toPassAsync();
  });

  it('user models should be cohesive', async () => {
    const rule = metrics()
      .inFolder('apps/user-service/src/models/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.5);

    await expect(rule).toPassAsync();
  });
});
```

### 2. Product Service Rules

```typescript
describe('Product Service Architecture', () => {
  it('product service should manage catalog', async () => {
    const rule = projectFiles()
      .inFolder('apps/product-service/**')
      .should()
      .containFiles()
      .withName('*Catalog*');

    await expect(rule).toPassAsync();
  });

  it('product service should not handle payments', async () => {
    const rule = projectFiles()
      .inFolder('apps/product-service/**')
      .shouldNot()
      .containFiles()
      .withName('*Payment*');

    await expect(rule).toPassAsync();
  });

  it('product search should be optimized', async () => {
    const rule = metrics()
      .inFolder('apps/product-service/src/search/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(500); // Keep search logic concise

    await expect(rule).toPassAsync();
  });
});
```

### 3. Order Service Rules

```typescript
describe('Order Service Architecture', () => {
  it('order service should handle payments', async () => {
    const rule = projectFiles()
      .inFolder('apps/order-service/**')
      .should()
      .containFiles()
      .withName('*Payment*');

    await expect(rule).toPassAsync();
  });

  it('order service should manage workflows', async () => {
    const rule = projectFiles()
      .inFolder('apps/order-service/**')
      .should()
      .containFiles()
      .withName('*Workflow*');

    await expect(rule).toPassAsync();
  });

  it('order processing should not be too complex', async () => {
    const rule = metrics()
      .inFolder('apps/order-service/src/processors/**')
      .count()
      .methodCount()
      .shouldBeBelow(10);

    await expect(rule).toPassAsync();
  });
});
```

## Event-Driven Communication

### 1. Event Bus Rules

```typescript
describe('Event-Driven Architecture', () => {
  it('services should communicate via events', async () => {
    const rule = projectFiles()
      .inFolder('apps/*-service/src/handlers/**')
      .should()
      .dependOnFiles()
      .inFolder('libs/event-bus/**');

    await expect(rule).toPassAsync();
  });

  it('event handlers should be in dedicated folders', async () => {
    const rule = projectFiles()
      .withName('*Handler.ts')
      .should()
      .beInFolder('**/handlers/**');

    await expect(rule).toPassAsync();
  });

  it('events should be defined in shared library', async () => {
    const rule = projectFiles()
      .withName('*Event.ts')
      .should()
      .beInFolder('libs/shared-models/events/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Event Publishing Rules

```typescript
describe('Event Publishing', () => {
  it('services should publish domain events', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/src/services/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('publishEvent') || file.content.includes('emit'),
        'Services should publish domain events'
      );

    await expect(rule).toPassAsync();
  });

  it('event publishers should not depend on subscribers', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/src/publishers/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/{product,order}-service/**');

    await expect(rule).toPassAsync();
  });
});
```

## Data Consistency Rules

### 1. Database per Service

```typescript
describe('Database Boundaries', () => {
  it('each service should have its own database config', async () => {
    const rule = projectFiles()
      .inFolder('apps/*-service/**')
      .should()
      .containFiles()
      .withName('database.config.ts');

    await expect(rule).toPassAsync();
  });

  it('services should not share database models', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/{product,order}-service/**/models/**');

    await expect(rule).toPassAsync();
  });

  it('database utilities should be service-specific', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/src/database/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('apps/{product,order}-service/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Saga Pattern Rules

```typescript
describe('Saga Pattern', () => {
  it('sagas should be in order service', async () => {
    const rule = projectFiles()
      .withName('*Saga.ts')
      .should()
      .beInFolder('apps/order-service/src/sagas/**');

    await expect(rule).toPassAsync();
  });

  it('sagas should coordinate multiple services', async () => {
    const rule = projectFiles()
      .inFolder('apps/order-service/src/sagas/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('UserService') && file.content.includes('ProductService'),
        'Sagas should coordinate multiple services'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Example Project Structure

```
apps/
├── user-service/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── UserController.ts
│   │   ├── services/
│   │   │   └── UserService.ts
│   │   ├── repositories/
│   │   │   └── UserRepository.ts
│   │   ├── models/
│   │   │   └── User.ts
│   │   ├── handlers/
│   │   │   └── UserEventHandler.ts
│   │   └── database/
│   │       └── connection.ts
│   ├── project.json
│   └── jest.config.js
├── product-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   └── search/
│   └── project.json
├── order-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── processors/
│   │   ├── sagas/
│   │   └── payment/
│   └── project.json
└── gateway-service/
    ├── src/
    │   ├── routes/
    │   ├── middleware/
    │   ├── proxy/
    │   └── security/
    └── project.json
libs/
├── shared-models/
│   ├── src/
│   │   ├── events/
│   │   │   ├── UserEvent.ts
│   │   │   ├── ProductEvent.ts
│   │   │   └── OrderEvent.ts
│   │   └── dtos/
│   │       ├── UserDto.ts
│   │       ├── ProductDto.ts
│   │       └── OrderDto.ts
│   └── project.json
├── shared-utils/
│   ├── src/
│   │   ├── validation/
│   │   ├── logging/
│   │   └── security/
│   └── project.json
└── event-bus/
    ├── src/
    │   ├── EventBus.ts
    │   ├── EventHandler.ts
    │   └── EventPublisher.ts
    └── project.json
```

## Nx-Specific Rules

### 1. Project Boundaries

```typescript
describe('Nx Project Boundaries', () => {
  it('should respect Nx project boundaries', async () => {
    const rule = projectFiles().inFolder('apps/**').should().respectNxProjectBoundaries();

    await expect(rule).toPassAsync();
  });

  it('apps should not import from other apps', async () => {
    const rule = projectFiles()
      .inFolder('apps/user-service/**')
      .shouldNot()
      .importFromProjects(['product-service', 'order-service']);

    await expect(rule).toPassAsync();
  });
});
```

### 2. Dependency Graph Validation

```typescript
describe('Nx Dependency Graph', () => {
  it('should have no circular dependencies between projects', async () => {
    const rule = projectFiles().inNxWorkspace().should().haveNoCycles();

    await expect(rule).toPassAsync();
  });

  it('shared libraries should have minimal dependencies', async () => {
    const rule = projectFiles()
      .inFolder('libs/shared-*/**')
      .should()
      .haveMaximumDependencies(5);

    await expect(rule).toPassAsync();
  });
});
```

## Testing Architecture

### 1. Service Testing

```typescript
describe('Service Testing Architecture', () => {
  it('each service should have integration tests', async () => {
    const rule = projectFiles()
      .inFolder('apps/*-service/**')
      .should()
      .containFiles()
      .withName('*.integration.spec.ts');

    await expect(rule).toPassAsync();
  });

  it('services should have contract tests', async () => {
    const rule = projectFiles()
      .inFolder('apps/*-service/**')
      .should()
      .containFiles()
      .withName('*.contract.spec.ts');

    await expect(rule).toPassAsync();
  });
});
```

### 2. End-to-End Testing

```typescript
describe('E2E Testing', () => {
  it('should have cross-service E2E tests', async () => {
    const rule = projectFiles()
      .inFolder('apps/e2e/**')
      .should()
      .containFiles()
      .withName('*cross-service*.e2e.spec.ts');

    await expect(rule).toPassAsync();
  });
});
```

## Performance and Monitoring

### 1. Service Metrics

```typescript
describe('Service Metrics', () => {
  it('services should not be too large', async () => {
    const rule = metrics()
      .inFolder('apps/*-service/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(10000); // Keep services focused

    await expect(rule).toPassAsync();
  });

  it('controllers should be lightweight', async () => {
    const rule = metrics()
      .inFolder('apps/*/src/controllers/**')
      .count()
      .methodCount()
      .shouldBeBelow(15);

    await expect(rule).toPassAsync();
  });
});
```

### 2. API Consistency

```typescript
describe('API Consistency', () => {
  it('all services should have health checks', async () => {
    const rule = projectFiles()
      .inFolder('apps/*-service/**')
      .should()
      .containFiles()
      .withName('*health*');

    await expect(rule).toPassAsync();
  });

  it('services should follow REST conventions', async () => {
    const rule = projectFiles()
      .inFolder('apps/*/src/controllers/**')
      .should()
      .adhereTo(
        (file) => /\b(get|post|put|delete|patch)\b/i.test(file.content),
        'Controllers should use HTTP verbs'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of Micro-Services with Nx

1. **Service Independence**: Each service can be developed and deployed independently
2. **Shared Code**: Common utilities and models in shared libraries
3. **Build Optimization**: Nx only builds affected services
4. **Testing Strategy**: Comprehensive testing at multiple levels
5. **Developer Experience**: Clear project boundaries and tooling

## Common Micro-Services Violations

1. **Direct service-to-service dependencies**: Use events or API calls instead
2. **Shared databases**: Each service should own its data
3. **Circular dependencies**: Often caused by shared business logic
4. **Monolithic shared libraries**: Keep shared code focused and minimal
5. **Lack of service boundaries**: Services should have clear responsibilities

This architecture ensures your Express micro-services remain independent while benefiting from Nx's powerful tooling and ArchUnitTS's enforcement capabilities.
