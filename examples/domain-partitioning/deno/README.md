# Domain Partitioning - Deno Modular Monolith

This example demonstrates how to enforce domain partitioning patterns in a Deno modular monolith using ArchUnitTS.

## Architecture Overview

Domain partitioning organizes code around business domains rather than technical layers:

```
src/
├── domains/
│   ├── user/           # User domain
│   ├── product/        # Product domain
│   ├── order/          # Order domain
│   └── payment/        # Payment domain
├── shared/
│   ├── infrastructure/ # Shared technical concerns
│   ├── kernel/         # Domain kernel (shared domain logic)
│   └── utils/          # Common utilities
└── app/
    ├── api/           # API entry points
    └── config/        # Application configuration
```

## Domain Boundary Rules

### 1. Domain Independence

```typescript
import { projectFiles } from 'archunit';

describe('Domain Partitioning Rules', () => {
  it('user domain should not depend on product domain', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/user/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/product/**');

    await expect(rule).toPassAsync();
  });

  it('product domain should not depend on order domain', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/product/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/order/**');

    await expect(rule).toPassAsync();
  });

  it('payment domain should not depend on user domain', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/payment/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/user/**');

    await expect(rule).toPassAsync();
  });

  it('domains should only communicate through shared kernel', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/application/**')
      .that()
      .dependOnFiles()
      .inFolder('src/domains/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/*/**')
      .exceptWhen()
      .inSameFolder()
      .or()
      .inFolder('src/shared/kernel/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Shared Kernel Rules

```typescript
describe('Shared Kernel Rules', () => {
  it('shared kernel should not depend on specific domains', async () => {
    const rule = projectFiles()
      .inFolder('src/shared/kernel/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/**');

    await expect(rule).toPassAsync();
  });

  it('domains can depend on shared kernel', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/**')
      .mayDependOnFiles()
      .inFolder('src/shared/kernel/**');

    await expect(rule).toPassAsync();
  });

  it('shared kernel should contain only domain-agnostic code', async () => {
    const rule = projectFiles()
      .inFolder('src/shared/kernel/**')
      .should()
      .adhereTo(
        (file) => !/(user|product|order|payment)/i.test(file.content),
        'Shared kernel should not contain domain-specific logic'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Domain-Specific Rules

### 1. User Domain Rules

```typescript
describe('User Domain Rules', () => {
  it('user domain should follow hexagonal architecture', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/user/infrastructure/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/user/domain/**');

    await expect(rule).toPassAsync();
  });

  it('user domain models should be rich', async () => {
    const rule = metrics()
      .inFolder('src/domains/user/domain/models/**')
      .count()
      .methodCount()
      .shouldBeAbove(3); // Rich domain models should have behavior

    await expect(rule).toPassAsync();
  });

  it('user services should have high cohesion', async () => {
    const rule = metrics()
      .inFolder('src/domains/user/application/services/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.4);

    await expect(rule).toPassAsync();
  });

  it('user domain should handle authentication concerns', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/user/**')
      .should()
      .containFiles()
      .withName('*Auth*');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Product Domain Rules

```typescript
describe('Product Domain Rules', () => {
  it('product domain should manage catalog', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/product/**')
      .should()
      .containFiles()
      .withName('*Catalog*');

    await expect(rule).toPassAsync();
  });

  it('product domain should not handle payments', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/product/**')
      .shouldNot()
      .containFiles()
      .withName('*Payment*');

    await expect(rule).toPassAsync();
  });

  it('product specifications should be value objects', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/product/domain/specifications/**')
      .should()
      .adhereTo(
        (file) => file.content.includes('readonly') && !file.content.includes('set '),
        'Specifications should be immutable value objects'
      );

    await expect(rule).toPassAsync();
  });
});
```

### 3. Order Domain Rules

```typescript
describe('Order Domain Rules', () => {
  it('order domain should coordinate other domains', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/order/application/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('UserService') || file.content.includes('ProductService'),
        'Order domain should coordinate other domains'
      );

    await expect(rule).toPassAsync();
  });

  it('order domain should contain saga patterns', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/order/**')
      .should()
      .containFiles()
      .withName('*Saga*');

    await expect(rule).toPassAsync();
  });

  it('order state machines should not be too complex', async () => {
    const rule = metrics()
      .inFolder('src/domains/order/domain/state-machines/**')
      .count()
      .methodCount()
      .shouldBeBelow(15);

    await expect(rule).toPassAsync();
  });
});
```

### 4. Payment Domain Rules

```typescript
describe('Payment Domain Rules', () => {
  it('payment domain should handle financial transactions', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/payment/**')
      .should()
      .containFiles()
      .withName('*Transaction*');

    await expect(rule).toPassAsync();
  });

  it('payment domain should not access user details directly', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/payment/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/user/domain/**');

    await expect(rule).toPassAsync();
  });

  it('payment processors should be isolated', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/payment/infrastructure/processors/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/domains/payment/domain/**');

    await expect(rule).toPassAsync();
  });
});
```

## Deno-Specific Patterns

### 1. Module System Rules

```typescript
describe('Deno Module System', () => {
  it('should use explicit imports with extensions', async () => {
    const rule = projectFiles()
      .withName('*.ts')
      .should()
      .adhereTo((file) => {
        const imports = file.content.match(/from\s+['"]\..*?['"]/g) || [];
        return imports.every((imp) => /\.(ts|js)['"]$/.test(imp));
      }, 'Local imports should include file extensions');

    await expect(rule).toPassAsync();
  });

  it('should use deps.ts for external dependencies', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/infrastructure/**')
      .should()
      .adhereTo((file) => {
        const httpImports = file.content.match(/from\s+['"]https:\/\/.*?['"]/g);
        return !httpImports || httpImports.length === 0;
      }, 'Should import external dependencies through deps.ts');

    await expect(rule).toPassAsync();
  });

  it('each domain should have its own deps.ts', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/')
      .should()
      .containFile('deps.ts');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Permission Model

```typescript
describe('Deno Permissions', () => {
  it('domains should declare required permissions', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/infrastructure/**')
      .that()
      .dependOnFiles()
      .withName('*Http*')
      .should()
      .haveCorrespondingFiles()
      .withName('permissions.json');

    await expect(rule).toPassAsync();
  });

  it('file system access should be limited', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/**')
      .should()
      .adhereTo(
        (file) =>
          !file.content.includes('Deno.readFile') || file.path.includes('infrastructure'),
        'File system access should be in infrastructure layer'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Event-Driven Communication

### 1. Domain Events

```typescript
describe('Domain Events', () => {
  it('domains should publish events for external communication', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/application/services/**')
      .should()
      .adhereTo(
        (file) =>
          file.content.includes('publishEvent') || file.content.includes('DomainEvent'),
        'Application services should publish domain events'
      );

    await expect(rule).toPassAsync();
  });

  it('domain events should be in shared kernel', async () => {
    const rule = projectFiles()
      .withName('*Event.ts')
      .should()
      .beInFolder('src/shared/kernel/events/**');

    await expect(rule).toPassAsync();
  });

  it('event handlers should be in application layer', async () => {
    const rule = projectFiles()
      .withName('*EventHandler.ts')
      .should()
      .beInFolder('src/domains/*/application/handlers/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Integration Events

```typescript
describe('Integration Events', () => {
  it('integration events should be versioned', async () => {
    const rule = projectFiles()
      .inFolder('src/shared/kernel/integration-events/**')
      .should()
      .adhereTo(
        (file) => /v\d+/i.test(file.fileName),
        'Integration events should be versioned'
      );

    await expect(rule).toPassAsync();
  });

  it('domains should handle integration events', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/application/handlers/**')
      .should()
      .dependOnFiles()
      .inFolder('src/shared/kernel/integration-events/**');

    await expect(rule).toPassAsync();
  });
});
```

## Example Project Structure

```
src/
├── domains/
│   ├── user/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── User.ts
│   │   │   │   └── UserProfile.ts
│   │   │   ├── services/
│   │   │   │   └── UserDomainService.ts
│   │   │   └── repositories/
│   │   │       └── IUserRepository.ts
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   ├── UserService.ts
│   │   │   │   └── AuthService.ts
│   │   │   ├── handlers/
│   │   │   │   └── UserEventHandler.ts
│   │   │   └── dtos/
│   │   │       └── CreateUserDto.ts
│   │   ├── infrastructure/
│   │   │   ├── repositories/
│   │   │   │   └── DenoUserRepository.ts
│   │   │   └── external/
│   │   │       └── EmailService.ts
│   │   ├── api/
│   │   │   └── UserController.ts
│   │   ├── deps.ts
│   │   └── permissions.json
│   ├── product/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── api/
│   │   └── deps.ts
│   ├── order/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   ├── state-machines/
│   │   │   └── sagas/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── api/
│   │   └── deps.ts
│   └── payment/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       │   └── processors/
│       ├── api/
│       └── deps.ts
├── shared/
│   ├── kernel/
│   │   ├── events/
│   │   │   ├── UserEvent.ts
│   │   │   └── OrderEvent.ts
│   │   ├── integration-events/
│   │   │   ├── UserCreatedEventV1.ts
│   │   │   └── OrderPlacedEventV1.ts
│   │   ├── value-objects/
│   │   │   ├── Money.ts
│   │   │   └── Email.ts
│   │   └── interfaces/
│   │       └── IDomainEvent.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── messaging/
│   │   └── logging/
│   └── utils/
│       ├── validation/
│       └── serialization/
└── app/
    ├── api/
    │   ├── server.ts
    │   └── routes.ts
    ├── config/
    │   ├── database.ts
    │   └── environment.ts
    └── main.ts
```

## Testing Strategy

### 1. Domain Testing

```typescript
describe('Domain Testing', () => {
  it('domains should have unit tests for models', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/domain/models/**')
      .should()
      .haveCorrespondingFiles()
      .withName('*.test.ts');

    await expect(rule).toPassAsync();
  });

  it('application services should have integration tests', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/application/services/**')
      .should()
      .haveCorrespondingFiles()
      .withName('*.integration.test.ts');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Cross-Domain Testing

```typescript
describe('Cross-Domain Integration', () => {
  it('should have cross-domain integration tests', async () => {
    const rule = projectFiles()
      .inFolder('tests/integration/**')
      .should()
      .containFiles()
      .withName('*cross-domain*.test.ts');

    await expect(rule).toPassAsync();
  });

  it('event handlers should have integration tests', async () => {
    const rule = projectFiles()
      .inFolder('src/domains/*/application/handlers/**')
      .should()
      .haveCorrespondingFiles()
      .withName('*.integration.test.ts');

    await expect(rule).toPassAsync();
  });
});
```

## Performance and Monitoring

### 1. Domain Metrics

```typescript
describe('Domain Metrics', () => {
  it('domains should not be too large', async () => {
    const rule = metrics()
      .inFolder('src/domains/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(5000); // Keep domains focused

    await expect(rule).toPassAsync();
  });

  it('domain services should not be too complex', async () => {
    const rule = metrics()
      .inFolder('src/domains/*/domain/services/**')
      .count()
      .methodCount()
      .shouldBeBelow(10);

    await expect(rule).toPassAsync();
  });
});
```

### 2. Deno-Specific Performance

```typescript
describe('Deno Performance', () => {
  it('should use efficient imports', async () => {
    const rule = projectFiles()
      .withName('*.ts')
      .should()
      .adhereTo(
        (file) => !file.content.includes('import * as'),
        'Avoid wildcard imports for better tree-shaking'
      );

    await expect(rule).toPassAsync();
  });

  it('should cache external dependencies', async () => {
    const rule = projectFiles()
      .withName('deps.ts')
      .should()
      .adhereTo(
        (file) => file.content.includes('// @deno-cache'),
        'External dependencies should be cached'
      );

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of Domain Partitioning with Deno

1. **Business Alignment**: Code structure reflects business domains
2. **Team Ownership**: Teams can own specific domains
3. **Independent Evolution**: Domains can evolve independently
4. **Reduced Coupling**: Clear boundaries prevent unwanted dependencies
5. **Deno Benefits**: Fast startup, secure by default, modern tooling

## Common Domain Partitioning Violations

1. **Cross-domain dependencies**: Direct imports between domains
2. **Anemic domain models**: Models without behavior
3. **Shared databases**: Each domain should own its data
4. **God services**: Services that span multiple domains
5. **Leaky abstractions**: Domain concepts leaking across boundaries

This architecture ensures your Deno modular monolith maintains clear domain boundaries while leveraging Deno's modern capabilities and ArchUnitTS's enforcement.
