# React Micro-Frontends Architecture with ArchUnitTS

This example demonstrates how to enforce architectural rules for a React micro-frontends application using ArchUnitTS. Micro-frontends allow teams to work independently on different parts of a large application while maintaining architectural consistency.

## Architecture Overview

```
src/
├── shell/                    # Host application (shell)
│   ├── components/
│   ├── routing/
│   └── config/
├── micro-frontends/         # Independent micro-frontend modules
│   ├── user-management/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── product-catalog/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   └── order-processing/
│       ├── components/
│       ├── services/
│       ├── store/
│       └── types/
├── shared/                  # Shared utilities and components
│   ├── components/
│   ├── utils/
│   ├── types/
│   └── services/
└── tests/
    └── architecture/
```

## Key Architectural Rules

### 1. Micro-Frontend Isolation

Each micro-frontend should be independent and not directly depend on other micro-frontends:

```typescript
import { projectFiles } from 'archunit';

describe('Micro-Frontend Isolation', () => {
  it('user-management should not depend on other micro-frontends', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/user-management/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/product-catalog/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/order-processing/**');

    await expect(rule).toPassAsync();
  });

  it('product-catalog should not depend on other micro-frontends', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/product-catalog/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/user-management/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/order-processing/**');

    await expect(rule).toPassAsync();
  });

  it('order-processing should not depend on other micro-frontends', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/order-processing/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/user-management/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/product-catalog/**');

    await expect(rule).toPassAsync();
  });
});
```

### 2. Shell Application Rules

The shell application should only coordinate micro-frontends and not contain business logic:

```typescript
describe('Shell Application Rules', () => {
  it('shell should not contain business logic components', async () => {
    const rule = projectFiles()
      .inFolder('src/shell/**')
      .shouldNot()
      .haveName('*Service.ts')
      .and()
      .shouldNot()
      .haveName('*Repository.ts')
      .and()
      .shouldNot()
      .haveName('*Model.ts');

    await expect(rule).toPassAsync();
  });

  it('shell can depend on micro-frontends for integration', async () => {
    const rule = projectFiles()
      .inFolder('src/shell/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/micro-frontends/**')
      .or()
      .inFolder('src/shared/**')
      .or()
      .inFolder('src/shell/**')
      .or()
      .matching('react')
      .or()
      .matching('@types/**');

    await expect(rule).toPassAsync();
  });
});
```

### 3. Shared Dependencies

Only shared utilities and components should be used across micro-frontends:

```typescript
describe('Shared Dependencies', () => {
  it('micro-frontends can only depend on shared and own modules', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/user-management/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/shared/**')
      .or()
      .inFolder('src/micro-frontends/user-management/**')
      .or()
      .matching('react')
      .or()
      .matching('@types/**')
      .or()
      .matching('node_modules/**');

    await expect(rule).toPassAsync();
  });

  it('shared modules should not depend on micro-frontends', async () => {
    const rule = projectFiles()
      .inFolder('src/shared/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/**');

    await expect(rule).toPassAsync();
  });
});
```

### 4. Component Naming Conventions

Enforce consistent naming conventions across micro-frontends:

```typescript
describe('Component Naming Conventions', () => {
  it('React components should be PascalCase', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/**/components/**')
      .withName('*.tsx')
      .should()
      .haveName(/^[A-Z][a-zA-Z]*Component\.tsx$/);

    await expect(rule).toPassAsync();
  });

  it('service files should follow naming convention', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/**/services/**')
      .should()
      .haveName('*.service.ts');

    await expect(rule).toPassAsync();
  });

  it('type files should be in types folder', async () => {
    const rule = projectFiles().withName('*.types.ts').should().beInFolder('**/types/**');

    await expect(rule).toPassAsync();
  });
});
```

### 5. State Management Isolation

Each micro-frontend should manage its own state:

```typescript
describe('State Management Isolation', () => {
  it('store should be contained within micro-frontend', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/user-management/store/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/product-catalog/store/**')
      .and()
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/micro-frontends/order-processing/store/**');

    await expect(rule).toPassAsync();
  });

  it('components should only use their own store', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/user-management/components/**')
      .should()
      .onlyDependOnFiles()
      .inFolder('src/micro-frontends/user-management/**')
      .or()
      .inFolder('src/shared/**')
      .or()
      .matching('react')
      .or()
      .matching('@types/**');

    await expect(rule).toPassAsync();
  });
});
```

## Code Quality Metrics

### Component Complexity

```typescript
import { metrics } from 'archunit';

describe('Component Quality Metrics', () => {
  it('React components should not be too complex', async () => {
    const rule = metrics()
      .inFolder('src/micro-frontends/**/components/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(200);

    await expect(rule).toPassAsync();
  });

  it('components should have reasonable method count', async () => {
    const rule = metrics()
      .inFolder('src/micro-frontends/**/components/**')
      .count()
      .methodCount()
      .shouldBeBelow(10);

    await expect(rule).toPassAsync();
  });

  it('service classes should maintain high cohesion', async () => {
    const rule = metrics()
      .inFolder('src/micro-frontends/**/services/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.5);

    await expect(rule).toPassAsync();
  });
});
```

### Custom Metrics for React

```typescript
describe('React-Specific Metrics', () => {
  it('should have reasonable props count per component', async () => {
    const rule = metrics()
      .inFolder('src/micro-frontends/**/components/**')
      .customMetric('propsCount', 'Number of props passed to component', (classInfo) => {
        // Count interface properties that likely represent props
        const propsInterface = classInfo.interfaces.find(
          (i) => i.name.endsWith('Props') || i.name.endsWith('Properties')
        );
        return propsInterface ? propsInterface.properties.length : 0;
      })
      .shouldBeBelow(10);

    await expect(rule).toPassAsync();
  });

  it('should limit hook usage per component', async () => {
    const rule = metrics()
      .inFolder('src/micro-frontends/**/components/**')
      .customMetric('hookCount', 'Number of React hooks used', (classInfo) => {
        // Count hook usage patterns in component
        const hookPattern = /use[A-Z][a-zA-Z]*/g;
        const matches = classInfo.content.match(hookPattern);
        return matches ? matches.length : 0;
      })
      .shouldBeBelow(8);

    await expect(rule).toPassAsync();
  });
});
```

## Micro-Frontend Communication

### Event-Driven Communication

```typescript
describe('Inter-Micro-Frontend Communication', () => {
  it('communication should go through event bus only', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/**')
      .that()
      .containsText('window.postMessage')
      .or()
      .containsText('addEventListener')
      .should()
      .onlyBeInFolder('**/communication/**');

    await expect(rule).toPassAsync();
  });

  it('direct DOM manipulation should be avoided', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/**')
      .shouldNot()
      .containsText('document.getElementById')
      .and()
      .shouldNot()
      .containsText('document.querySelector');

    await expect(rule).toPassAsync();
  });
});
```

## Testing Strategy

### Unit Testing Rules

```typescript
describe('Testing Rules', () => {
  it('each component should have corresponding test', async () => {
    const componentFiles = await projectFiles()
      .inFolder('src/micro-frontends/**/components/**')
      .withName('*.tsx')
      .getFiles();

    for (const componentFile of componentFiles) {
      const testFile = componentFile.replace('.tsx', '.test.tsx');
      const rule = projectFiles().withName(testFile).should().exist();

      await expect(rule).toPassAsync();
    }
  });

  it('test files should be co-located with components', async () => {
    const rule = projectFiles()
      .withName('*.test.tsx')
      .should()
      .beInFolder('**/components/**');

    await expect(rule).toPassAsync();
  });
});
```

## Integration with Module Federation

### Webpack Module Federation Setup

```typescript
describe('Module Federation Rules', () => {
  it('exposed modules should be in public API', async () => {
    const rule = projectFiles()
      .withName('**/public-api.ts')
      .should()
      .beInFolder('src/micro-frontends/**/');

    await expect(rule).toPassAsync();
  });

  it('internal modules should not be exposed', async () => {
    const rule = projectFiles()
      .inFolder('src/micro-frontends/**/internal/**')
      .shouldNot()
      .beImportedBy()
      .inFolder('src/shell/**');

    await expect(rule).toPassAsync();
  });
});
```

## CI/CD Integration

### Build Pipeline Validation

```typescript
// In your build process
describe('Build-time Architecture Validation', () => {
  it('should validate micro-frontend boundaries', async () => {
    const violations = await projectFiles()
      .inFolder('src/micro-frontends/**')
      .should()
      .respectMicroFrontendBoundaries()
      .check();

    if (violations.length > 0) {
      console.error('Micro-frontend boundary violations detected:', violations);
      process.exit(1);
    }
  });
});
```

## Performance Considerations

### Bundle Size Monitoring

```typescript
describe('Performance Rules', () => {
  it('shared utilities should be lightweight', async () => {
    const rule = metrics()
      .inFolder('src/shared/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(500);

    await expect(rule).toPassAsync();
  });

  it('micro-frontends should not exceed size limits', async () => {
    const rule = metrics()
      .inFolder('src/micro-frontends/user-management/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(5000);

    await expect(rule).toPassAsync();
  });
});
```

## Benefits of This Architecture

1. **Team Independence**: Teams can develop, test, and deploy micro-frontends independently
2. **Technology Diversity**: Different micro-frontends can use different React versions or libraries
3. **Scalability**: Easy to scale teams and applications horizontally
4. **Fault Isolation**: Issues in one micro-frontend don't crash the entire application
5. **Incremental Updates**: Deploy updates to individual micro-frontends without affecting others

## Common Violations and Solutions

### Cross-Micro-Frontend Dependencies

**Problem**: Direct imports between micro-frontends
**Solution**: Use shared services or event-driven communication

### Shared State Leakage

**Problem**: Global state accessed across micro-frontends
**Solution**: Implement proper state boundaries and communication patterns

### Component Coupling

**Problem**: Components tightly coupled to specific micro-frontends
**Solution**: Create reusable components in shared modules

### Inconsistent Styling

**Problem**: Different styling approaches across micro-frontends
**Solution**: Establish shared design system and CSS-in-JS guidelines

This architecture ensures your React micro-frontends application maintains clean boundaries, proper isolation, and high maintainability while allowing teams to work independently.
