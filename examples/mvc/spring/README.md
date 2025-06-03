# Spring Boot MVC Architecture with ArchUnitTS

This example demonstrates how to enforce Model-View-Controller (MVC) architectural principles in a Spring Boot application using ArchUnitTS. While ArchUnitTS is primarily for TypeScript/JavaScript, this example shows how to test Spring Boot projects that might have TypeScript frontends or API documentation.

## Architecture Overview

```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── example/
│   │           ├── controller/          # Controllers (View Layer)
│   │           │   ├── UserController.java
│   │           │   ├── ProductController.java
│   │           │   └── OrderController.java
│   │           ├── service/             # Business Logic Layer
│   │           │   ├── UserService.java
│   │           │   ├── ProductService.java
│   │           │   └── OrderService.java
│   │           ├── repository/          # Data Access Layer
│   │           │   ├── UserRepository.java
│   │           │   ├── ProductRepository.java
│   │           │   └── OrderRepository.java
│   │           ├── model/               # Model Layer (Entities)
│   │           │   ├── entity/
│   │           │   │   ├── User.java
│   │           │   │   ├── Product.java
│   │           │   │   └── Order.java
│   │           │   └── dto/
│   │           │       ├── UserDto.java
│   │           │       ├── ProductDto.java
│   │           │       └── OrderDto.java
│   │           ├── config/              # Configuration
│   │           │   ├── DatabaseConfig.java
│   │           │   ├── SecurityConfig.java
│   │           │   └── WebConfig.java
│   │           └── exception/           # Exception Handling
│   │               ├── GlobalExceptionHandler.java
│   │               └── custom/
│   │                   ├── UserNotFoundException.java
│   │                   └── ValidationException.java
│   └── resources/
│       ├── application.yml
│       ├── static/                      # Static Web Resources
│       └── templates/                   # View Templates (if using server-side rendering)
├── frontend/                           # TypeScript Frontend (React/Angular/Vue)
│   ├── src/
│   │   ├── components/                 # View Components
│   │   │   ├── user/
│   │   │   │   ├── UserList.tsx
│   │   │   │   ├── UserForm.tsx
│   │   │   │   └── UserDetail.tsx
│   │   │   ├── product/
│   │   │   └── order/
│   │   ├── services/                   # API Service Layer
│   │   │   ├── UserService.ts
│   │   │   ├── ProductService.ts
│   │   │   └── ApiClient.ts
│   │   ├── models/                     # TypeScript Models/DTOs
│   │   │   ├── User.ts
│   │   │   ├── Product.ts
│   │   │   └── Order.ts
│   │   ├── controllers/                # Frontend Controllers/State Management
│   │   │   ├── UserController.ts
│   │   │   ├── ProductController.ts
│   │   │   └── OrderController.ts
│   │   └── types/                      # TypeScript Type Definitions
│   │       ├── api.types.ts
│   │       └── common.types.ts
│   ├── api-docs/                       # API Documentation (TypeScript)
│   │   ├── openapi.ts
│   │   ├── user-api.spec.ts
│   │   └── product-api.spec.ts
│   └── tests/
│       └── architecture/
└── tests/
    └── architecture/
```

## Key Architectural Rules

### 1. MVC Layer Separation (Frontend TypeScript)

Since ArchUnitTS works with TypeScript, let's focus on the frontend MVC structure:

```typescript
import { projectFiles } from 'archunit';

describe('Frontend MVC Architecture Rules', () => {
  it('view components should not directly access services', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/components/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('frontend/src/services/**');

    await expect(rule).toPassAsync();
  });

  it('view components should only interact with controllers', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/components/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('frontend/src/controllers/**')
      .or()
      .inFolder('frontend/src/models/**')
      .or()
      .inFolder('frontend/src/types/**')
      .or()
      .inFolder('frontend/src/components/**')
      .or()
      .matching('react')
      .or()
      .matching('@types/**');

    await expect(rule).toPassAsync();
  });

  it('controllers should not depend on view components', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/controllers/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('frontend/src/components/**');

    await expect(rule).toPassAsync();
  });

  it('services should not depend on controllers or views', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/services/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('frontend/src/controllers/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('frontend/src/components/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Model Layer Rules

Models should be pure data structures without business logic:

```typescript
describe('Model Layer Rules', () => {
  it('models should not depend on services', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/models/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('frontend/src/services/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('frontend/src/controllers/**');

    await expect(rule).toPassAsync();
  });

  it('models should be immutable data structures', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/models/**')
      .should()
      .onlyContainInterfaces()
      .or()
      .containsText('readonly')
      .or()
      .containsText('Readonly<');

    await expect(rule).toPassAsync();
  });

  it('models should follow naming conventions', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/models/**')
      .should()
      .haveName(/^[A-Z][a-zA-Z]*\.ts$/); // PascalCase

    await expect(rule).toPassAsync();
  });
});
```

### 3. Controller Layer Rules

Controllers should orchestrate between views and services:

```typescript
describe('Controller Layer Rules', () => {
  it('controllers should follow naming convention', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/controllers/**')
      .should()
      .haveName('*Controller.ts');

    await expect(rule).toPassAsync();
  });

  it('controllers should not contain business logic', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/controllers/**')
      .shouldNot()
      .containsText('validation')
      .and()
      .shouldNot()
      .containsText('businessRule')
      .and()
      .shouldNot()
      .containsText('calculation');

    await expect(rule).toPassAsync();
  });

  it('controllers should manage application state', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/controllers/**')
      .should()
      .dependOnFiles()
      .inFolder('frontend/src/services/**')
      .and()
      .should()
      .dependOnFiles()
      .inFolder('frontend/src/models/**');

    await expect(rule).toPassAsync();
  });
});
```

### 4. Service Layer Rules

Services should handle data access and business logic:

```typescript
describe('Service Layer Rules', () => {
  it('services should follow naming convention', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/services/**')
      .should()
      .haveName('*Service.ts');

    await expect(rule).toPassAsync();
  });

  it('services should only interact with external APIs', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/services/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('frontend/src/models/**')
      .or()
      .inFolder('frontend/src/types/**')
      .or()
      .inFolder('frontend/src/services/**')
      .or()
      .matching('axios')
      .or()
      .matching('fetch');

    await expect(rule).toPassAsync();
  });

  it('services should handle data transformation', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/services/**')
      .should()
      .containsText('transform')
      .or()
      .containsText('map')
      .or()
      .containsText('serialize');

    await expect(rule).toPassAsync();
  });
});
```

### 5. API Documentation Rules

API documentation should be consistent with TypeScript models:

```typescript
describe('API Documentation Rules', () => {
  it('API specs should use consistent models', async () => {
    const rule = projectFiles()
      .inFolder('frontend/api-docs/**')
      .should()
      .dependOnFiles()
      .inFolder('frontend/src/models/**')
      .or()
      .inFolder('frontend/src/types/**');

    await expect(rule).toPassAsync();
  });

  it('OpenAPI specs should be co-located with models', async () => {
    const rule = projectFiles()
      .withName('*.spec.ts')
      .inFolder('frontend/api-docs/**')
      .should()
      .haveCorrespondingFile()
      .inFolder('frontend/src/models/**');

    await expect(rule).toPassAsync();
  });
});
```

## Code Quality Metrics

### Component Complexity

```typescript
import { metrics } from 'archunit';

describe('MVC Quality Metrics', () => {
  it('view components should not be too complex', async () => {
    const rule = metrics()
      .inFolder('frontend/src/components/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(200);

    await expect(rule).toPassAsync();
  });

  it('controllers should be lean', async () => {
    const rule = metrics()
      .inFolder('frontend/src/controllers/**')
      .count()
      .methodCount()
      .shouldBeBelow(10);

    await expect(rule).toPassAsync();
  });

  it('services should maintain high cohesion', async () => {
    const rule = metrics()
      .inFolder('frontend/src/services/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.5);

    await expect(rule).toPassAsync();
  });
});
```

### Model Complexity

```typescript
describe('Model Quality Metrics', () => {
  it('models should be simple data structures', async () => {
    const rule = metrics()
      .inFolder('frontend/src/models/**')
      .count()
      .methodCount()
      .shouldBe(0); // Pure data, no methods

    await expect(rule).toPassAsync();
  });

  it('models should have reasonable field count', async () => {
    const rule = metrics()
      .inFolder('frontend/src/models/**')
      .count()
      .fieldCount()
      .shouldBeBelow(15);

    await expect(rule).toPassAsync();
  });
});
```

## Advanced MVC Rules

### State Management Integration

```typescript
describe('State Management Rules', () => {
  it('state management should be in controllers', async () => {
    const rule = projectFiles()
      .that()
      .importFrom('redux')
      .or()
      .importFrom('zustand')
      .or()
      .importFrom('mobx')
      .should()
      .beInFolder('frontend/src/controllers/**');

    await expect(rule).toPassAsync();
  });

  it('components should not directly manage global state', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/components/**')
      .shouldNot()
      .containsText('useStore')
      .and()
      .shouldNot()
      .containsText('useSelector')
      .and()
      .shouldNot()
      .containsText('dispatch');

    await expect(rule).toPassAsync();
  });
});
```

### Form Handling Rules

```typescript
describe('Form Handling Rules', () => {
  it('form validation should be in controllers', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/components/**')
      .that()
      .containsText('validation')
      .should()
      .delegateValidationTo()
      .inFolder('frontend/src/controllers/**');

    await expect(rule).toPassAsync();
  });

  it('form models should be separate from domain models', async () => {
    const rule = projectFiles()
      .withName('*Form.ts')
      .or()
      .withName('*FormModel.ts')
      .should()
      .beInFolder('frontend/src/models/forms/**');

    await expect(rule).toPassAsync();
  });
});
```

## Testing Strategy

### Unit Testing Rules

```typescript
describe('MVC Testing Rules', () => {
  it('each controller should have unit tests', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/controllers/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('frontend/tests/unit/controllers/**');

    await expect(rule).toPassAsync();
  });

  it('each service should have unit tests', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/services/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('frontend/tests/unit/services/**');

    await expect(rule).toPassAsync();
  });

  it('components should have integration tests', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/components/**')
      .should()
      .haveCorrespondingTestFile()
      .inFolder('frontend/tests/integration/components/**');

    await expect(rule).toPassAsync();
  });
});
```

### Mock Usage Rules

```typescript
describe('Testing Mock Rules', () => {
  it('controller tests should mock services', async () => {
    const rule = projectFiles()
      .inFolder('frontend/tests/unit/controllers/**')
      .should()
      .containsText('mock')
      .and()
      .should()
      .dependOnFiles()
      .inFolder('frontend/src/services/**');

    await expect(rule).toPassAsync();
  });

  it('component tests should mock controllers', async () => {
    const rule = projectFiles()
      .inFolder('frontend/tests/integration/components/**')
      .should()
      .containsText('mock')
      .and()
      .should()
      .dependOnFiles()
      .inFolder('frontend/src/controllers/**');

    await expect(rule).toPassAsync();
  });
});
```

## React/Angular/Vue Specific Rules

### React MVC Rules

```typescript
describe('React MVC Rules', () => {
  it('React components should use hooks from controllers', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/components/**')
      .that()
      .importFrom('react')
      .should()
      .useCustomHooksFrom()
      .inFolder('frontend/src/controllers/**');

    await expect(rule).toPassAsync();
  });

  it('custom hooks should be in controllers', async () => {
    const rule = projectFiles()
      .withName('use*.ts')
      .should()
      .beInFolder('frontend/src/controllers/**');

    await expect(rule).toPassAsync();
  });
});
```

### Angular MVC Rules

```typescript
describe('Angular MVC Rules', () => {
  it('Angular services should be in service layer', async () => {
    const rule = projectFiles()
      .withName('*.service.ts')
      .should()
      .beInFolder('frontend/src/services/**');

    await expect(rule).toPassAsync();
  });

  it('Angular components should not inject services directly', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/components/**')
      .shouldNot()
      .containsText('inject(')
      .withServiceFrom('frontend/src/services/**');

    await expect(rule).toPassAsync();
  });
});
```

## Custom Metrics for MVC

### MVC-Specific Metrics

```typescript
describe('MVC Architecture Metrics', () => {
  it('should measure controller-to-service ratio', async () => {
    const rule = metrics()
      .customMetric(
        'controllerServiceRatio',
        'Ratio of controllers to services',
        async () => {
          const controllers = await projectFiles()
            .inFolder('frontend/src/controllers/**')
            .getFiles();
          const services = await projectFiles()
            .inFolder('frontend/src/services/**')
            .getFiles();

          return controllers.length / Math.max(services.length, 1);
        }
      )
      .shouldBeBelowOrEqual(2); // Max 2 controllers per service

    await expect(rule).toPassAsync();
  });

  it('should measure view component complexity', async () => {
    const rule = metrics()
      .inFolder('frontend/src/components/**')
      .customMetric(
        'componentComplexity',
        'Complexity based on JSX elements and hooks',
        (classInfo) => {
          const jsxElements = (classInfo.content.match(/<[A-Z][a-zA-Z]*/g) || []).length;
          const hooks = (classInfo.content.match(/use[A-Z][a-zA-Z]*/g) || []).length;
          return jsxElements + hooks * 2; // Weight hooks more heavily
        }
      )
      .shouldBeBelow(20);

    await expect(rule).toPassAsync();
  });
});
```

## Integration with Spring Boot Backend

### API Contract Validation

```typescript
describe('Backend Integration Rules', () => {
  it('TypeScript models should match Spring Boot DTOs', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/models/**')
      .should()
      .matchApiContract()
      .fromSwaggerSpec('frontend/api-docs/openapi.json');

    await expect(rule).toPassAsync();
  });

  it('service calls should match backend endpoints', async () => {
    const rule = projectFiles()
      .inFolder('frontend/src/services/**')
      .should()
      .onlyCallValidEndpoints()
      .definedInSwagger('frontend/api-docs/openapi.json');

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of MVC Architecture

1. **Separation of Concerns**: Clear separation between data, business logic, and presentation
2. **Testability**: Each layer can be tested independently
3. **Maintainability**: Changes in one layer don't affect others
4. **Reusability**: Components can be reused across different parts of the application
5. **Team Collaboration**: Different teams can work on different layers

## Common Violations and Solutions

### Fat Controllers

**Problem**: Controllers containing business logic and data access
**Solution**: Move business logic to services and use dependency injection

### Tight Coupling Between Layers

**Problem**: Direct dependencies between non-adjacent layers
**Solution**: Use interfaces and dependency injection to decouple layers

### Shared State Across Components

**Problem**: Components directly sharing state without going through controllers
**Solution**: Centralize state management in controllers using proper state management libraries

### Model Pollution

**Problem**: Models containing UI-specific logic or framework dependencies
**Solution**: Keep models as pure data structures and create separate view models if needed

This MVC architecture ensures your application maintains clear layer separation, proper data flow, and high maintainability while supporting both frontend TypeScript and backend integration.
