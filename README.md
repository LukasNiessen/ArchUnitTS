# ArchUnitTS - Architecture Testing

<div align="center" name="top">
  <img align="center" src="assets/logo-rounded.png" width="150" height="150" alt="ArchUnitTS Logo">

<!-- spacer -->
<p></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/archunit.svg)](https://www.npmjs.com/package/archunit)
[![npm downloads](https://img.shields.io/npm/dm/archunit.svg)](https://www.npmjs.com/package/archunit)
[![GitHub stars](https://img.shields.io/github/stars/LukasNiessen/ArchUnitTS.svg)](https://github.com/LukasNiessen/ArchUnitTS)

</div>

Enforce architecture rules in TypeScript and JavaScript projects. Check for dependency directions, detect circular dependencies, enforce coding standards and much more. Integrates with every testing framework. Very simple setup and pipeline integration.

The #1 architecture testing library for TypeScript, measured by GitHub stars.

_Inspired by the amazing ArchUnit library but we are not affiliated with ArchUnit._

[Documentation](https://lukasniessen.github.io/ArchUnitTS/) • [Use Cases](#-use-cases) • [Features](#-features) • [Contributing](CONTRIBUTING.md)

## ⚡ 5 min Quickstart

### Installation

```bash
npm install archunit --save-dev
```

### Add tests

Simply add tests to your existing test suites. The following is an example using Jest. First we ensure that we have no circular dependencies.

```typescript
import { projectFiles, metrics } from 'archunit';

it('should not have circular dependencies', async () => {
  const rule = projectFiles().inFolder('src/**').should().haveNoCycles();
  await expect(rule).toPassAsync();
});
```

Next we ensure that our layered architecture is respected.

```typescript
it('presentation layer should not depend on database layer', async () => {
  const rule = projectFiles()
    .inFolder('src/presentation/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database/**');

  await expect(rule).toPassAsync();
});

it('business layer should not depend on database layer', async () => {
  const rule = projectFiles()
    .inFolder('src/business/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database/**');

  await expect(rule).toPassAsync();
});

// More layers ...
```

Lastly we ensure that some code metric rules are met.

```typescript
it('should not contain too large files', async () => {
  const rule = metrics().count().linesOfCode().shouldBeBelow(1000);
  await expect(rule).toPassAsync();
});

it('should only have classes with high cohesion', async () => {
  // LCOM metric (lack of cohesion of methods), low = high cohesion
  const rule = metrics().lcom().lcom96b().shouldBeBelow(0.3);
  await expect(rule).toPassAsync();
});
```

### CI Integration

These tests will run automatically in your testing setup, for example in your CI pipeline, so that's basically it. This setup ensures that the architectural rules you have defined are always adhered to! 🌻🐣

Additionally, you can generate reports and save them as artifacts. Here's a simple example using GitLab CI. _Note that reports are in beta._

```typescript
it('should generate HTML reports', async () => {
  const countMetrics = metrics().count();
  const lcomMetrics = metrics().lcom();

  // Saves HTML report files to /reports
  await countMetrics.exportAsHTML();
  await lcomMetrics.exportAsHTML();

  // So we get no warning about an empty test
  expect(0).toBe(0);
});
```

In your `gitlab-ci.yml`:

```yml
test:
  script:
    - npm test
  artifacts:
    when: always
    paths:
      - reports
```

## 🎬 Demo

https://github.com/user-attachments/assets/426f7b47-5157-4e92-98a3-f5ab4f7a388a

## 🐹 Use Cases

Many common uses cases are covered in our examples folder. Note that they are not fully working repositories but code snippets. Here is an overview.

**Layered Architecture:**

- [Express BackEnd](examples/layered-architecture/express/README.md) - Complete guide for implementing layered architecture in Express.js applications

- [Fastify BackEnd using a UML Diagram](examples/layered-architecture/fastify-uml/README.md) - Fastify layered architecture with UML diagram validation

- [Angular FrontEnd](examples/layered-architecture/angular/README.md) - Angular frontend layered architecture patterns and rules

**Domain Partitioning:**

- [Express MicroServices using Nx](examples/micro-services/express/README.md) - Microservices architecture patterns with Nx monorepo management

- [Modular Monolith, Deno BackEnd](examples/domain-partitioning/deno/README.md) - Domain-driven modular monolith architecture with Deno

- [React MicroFrontEnds using Nx](examples/micro-frontends/react/README.md) - Micro-frontends architecture with React and Module Federation

**Clean Architecture:**

- [NestJS BackEnd](examples/clean-architecture/nestjs/README.md) - Clean Architecture implementation with NestJS framework

- [React FrontEnd](examples/clean-architecture/react/README.md) - Clean Architecture principles applied to React applications

**Hexagonal Architecture:**

- [Express BackEnd](examples/hexagonal-architecture/express/README.md) - Ports and Adapters pattern implementation with Express.js

**MVC:**

- [Spring BackEnd](examples/mvc/spring/README.md) - Model-View-Controller architecture with Spring Boot and TypeScript frontend

## 🐲 Example Repositories

Here are a few repositories with fully functioning examples that use ArchUnitTS to ensure architectural rules:

- **[Vitest Example](https://github.com/LukasNiessen/ArchUnitTS-Vitest-Example)**: Complete Vitest setup with architecture tests
- **[Jest Example](https://github.com/LukasNiessen/ArchUnitTS-Jest-Example)**: Full Jest integration examples
- **[Jasmine Example](https://github.com/LukasNiessen/ArchUnitTS-Jasmine-Example)**: Jasmine testing framework integration

## 🐣 Features

This is an overview of what you can do with ArchUnitTS.

### Circular Dependencies

```typescript
it('services should be free of cycles', async () => {
  const rule = projectFiles().inFolder('src/services/**').should().haveNoCycles();
  await expect(rule).toPassAsync();
});
```

### Layer Dependencies

```typescript
it('should respect clean architecture layers', async () => {
  const rule = projectFiles()
    .inFolder('src/presentation/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database/**');
  await expect(rule).toPassAsync();
});

it('business layer should not depend on presentation', async () => {
  const rule = projectFiles()
    .inFolder('src/business/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/presentation/**');
  await expect(rule).toPassAsync();
});
```

### Naming Conventions

```typescript
it('should follow naming patterns', async () => {
  const rule = projectFiles()
    .inFolder('src/services/**')
    .should()
    .haveName('*-service.ts'); // my-service.ts for example
  await expect(rule).toPassAsync();
});

it('components should be PascalCase', async () => {
  const rule = projectFiles()
    .inFolder('src/components/**')
    .should()
    .haveName(/^[A-Z][a-zA-Z]*Commponent\.ts$/); // MyComponent.ts for example
  await expect(rule).toPassAsync();
});
```

### Code Metrics

```typescript
it('should not contain too large files', async () => {
  const rule = metrics().count().linesOfCode().shouldBeBelow(1000);
  await expect(rule).toPassAsync();
});

it('should have high class cohesion', async () => {
  const rule = metrics().lcom().lcom96b().shouldBeBelow(0.3);
  await expect(rule).toPassAsync();
});

it('should count methods per class', async () => {
  const rule = metrics().count().methodCount().shouldBeBelow(20);
  await expect(rule).toPassAsync();
});

it('should limit statements per file', async () => {
  const rule = metrics().count().statements().shouldBeBelowOrEqual(100);
  await expect(rule).toPassAsync();
});

it('should have 3 fields per Data class', async () => {
  const rule = metrics()
    .forClassesMatching(/.*Data.*/)
    .count()
    .fieldCount()
    .shouldBe(3);

  await expect(rule).toPassAsync();
});
```

### Distance Metrics

```typescript
it('should maintain proper coupling', async () => {
  const rule = metrics().distance().couplingFactor().shouldBeBelow(0.5);
  await expect(rule).toPassAsync();
});

it('should stay close to main sequence', async () => {
  const rule = metrics().distance().distanceFromMainSequence().shouldBeBelow(0.3);
  await expect(rule).toPassAsync();
});
```

### Custom Rules

You can define your own custom rules.

```typescript
const ruleDesc = 'TypeScript files should export functionality';
const myCustomRule = (file: FileInfo) => {
  // TypeScript files should contain export statements
  return file.content.includes('export');
};

const violations = await projectFiles()
  .withName('*.ts') // all ts files
  .should()
  .adhereTo(myCustomRule, ruleDesc)
  .check();

expect(violations).toStrictEqual([]);
```

### Custom Metrics

You can define your own metrics as well.

```typescript
it('should have a nice method field ratio', async () => {
  const rule = metrics()
    .customMetric(
      'methodFieldRatio',
      'Ratio of methods to fields',
      (classInfo) => classInfo.methods.length / Math.max(classInfo.fields.length, 1)
    )
    .shouldBeBelowOrEqual(10);
  await expect(rule).toPassAsync();
});
```

### Architecture Slices

```typescript
it('should adhere to UML diagram', async () => {
  const diagram = `
@startuml
  component [controllers]
  component [services]
  [controllers] --> [services]
@enduml`;

  const rule = projectSlices().definedBy('src/(**)/').should().adhereToDiagram(diagram);
  await expect(rule).toPassAsync();
});

it('should not contain forbidden dependencies', async () => {
  const rule = projectSlices()
    .definedBy('src/(**)/')
    .shouldNot()
    .containDependency('services', 'controllers');
  await expect(rule).toPassAsync();
});
```

### Reports

Generate beautiful HTML reports for your metrics. The default output path is `/reports`. _Note that this features is in beta._

```typescript
// Export count metrics report
await metrics().count().exportAsHTML('reports/count-metrics.html', {
  title: 'Count Metrics Dashboard',
  includeTimestamp: true,
});

// Export LCOM cohesion metrics report
await metrics().lcom().exportAsHTML('reports/lcom-metrics.html', {
  title: 'Code Cohesion Analysis',
  includeTimestamp: false,
});

// Export distance metrics report
await metrics().distance().exportAsHTML('reports/distance-metrics.html');
```

```typescript
// Export comprehensive report with all metrics
import { MetricsExporter } from 'archunitts';

await MetricsExporter.exportComprehensiveAsHTML(undefined, {
  outputPath: 'reports/comprehensive-metrics.html',
  title: 'Complete Architecture Metrics Dashboard',
  customCss: '.metric-card { border-radius: 8px; }',
});
```

The export functionality can be customized, for example by specifying an output path and custom CSS. Thanks to this, it's also very easy to include generated reports into your deploy process of, let's say, your GitHub page or GitLab page.

## 🔎 Pattern Matching System

We offer three targeting options for pattern matching across all modules:

- **`withName(pattern)`** - Pattern is checked against the filename (eg. `Service.ts` from `src/services/Service.ts`)
- **`inPath(pattern)`** - Pattern is checked against against the full relative path (eg. `src/services/Service.ts`)
- **`inFolder(pattern)`** - Pattern is checked against the path without filename (eg. `src/services` from `src/services/Service.ts`)

For the metrics module there is an additional one:

- **`forClassesMatching(pattern)`** - Pattern is checked against class names. The filepath or filename does not matter here

### Pattern Types

We support string patterns and regular expressions. String patterns support glob, see below.

```typescript
// String patterns with glob support (case sensitive)
.withName('*.service.ts')     // All files ending with .service.ts
.inFolder('**/services')      // All files in any services folder
.inPath('src/api/**/*.ts')    // All TypeScript files under src/api

// Regular expressions (case sensitive - use when you need exact case matching)
.withName(/^.*Service\.ts$/)  // Same as *.service.ts but case-sensitive
.inFolder(/services$/)        // Folders ending with 'services' (case-sensitive)

// For metrics module: Class name matching with regex
.forClassesMatching(/.*Service$/)  // Classes ending with 'Service'
.forClassesMatching(/^User.*/)     // Classes starting with 'User'
```

### Case Sensitivity

- **Strings/glob patterns**: Case **sensitive** by default
- **Regular expressions**: Case **sensitive** by default

If you need case-insensitive matching, use regular expressions with the `i` flag:

```typescript
// Case sensitive regex (default)
.withName(/^.*service\.ts$/)  // Matches service.ts
```

```typescript
// Case insensitive regex
.withName(/^.*service\.ts$/i)  // Matches Service.ts, service.ts, SERVICE.ts
```

### Glob Patterns Guide

Glob patterns provide powerful wildcard matching for paths and filenames:

#### Basic Wildcards

- `*` - Matches any characters within a single path segment (except `/`)
- `**` - Matches any characters across multiple path segments
- `?` - Matches exactly one character
- `[abc]` - Matches any character in the bracket set
- `[a-z]` - Matches any character in the range

#### Common Glob Examples

```typescript
// Filename patterns
.withName('*.ts')           // All TypeScript files
.withName('*.{js,ts}')      // All JavaScript or TypeScript files
.withName('*Service.ts')    // Files ending with 'Service.ts'
.withName('User*.ts')       // Files starting with 'User'
.withName('?est.ts')        // test.ts, nest.ts, etc

// Folder patterns
.inFolder('**/services')    // Any 'services' folder at any depth
.inFolder('src/services')   // Exact 'src/services' folder
.inFolder('**/test/**')     // Any folder containing 'test' in path
.inFolder('src/*')          // Direct subfolders of 'src'

// Path patterns
.inPath('src/**/*.service.ts')     // Service files anywhere under src
.inPath('**/test/**/*.spec.ts')    // Test files in any test folder
.inPath('src/domain/*/*.ts')       // TypeScript files one level under domain
```

### Recommendation

We generally recommend to use string with glob support unless you need to deal with very special cases. Writing regular expressions yourself is not necessary for most cases and comes with extra complexity.

For example, let's say you want to enforce some rule upon files inside `src/components`. If you use a RegExp you might first try this:

```typescript
.inFolder(/.*\/components\/.*/)
```

But this will not work reliably. It will not match `src/components/my-component.ts`. That's because ArchUnitTS will compare the _'folder path'_ here, that is the path without the filename, so in this case: `src/components`. The RegExp does not match this because it does not have an ending `/`. So the RegExp should be something like `.*\/components(\/.*)?`. Much simpler would be `'**/components/**`.

That being said, of course there are cases where glob syntax is just not strong enough and you will have to go with a RegExp.

### Check Methods: .check() vs toPassAsync()

ArchUnitTS provides two main methods for executing architecture rules.

#### `toPassAsync()`

This is special syntax we have added for Jest, Vitest and Jasmine. If you're using one of these testing frameworks, you should always use `toPassAsync()`. Many benefits come with it, for example beautiful error messages in case of a failing tests.

```typescript
// Jest/Vitest/Jasmine - Use toPassAsync()
await expect(rule).toPassAsync();

// With configuration options
await expect(rule).toPassAsync(options);
```

Here `options` can be used for enabling logging, disable caching, or to not fail on empty tests.

```javascript
{
  logging: {
    enabled: true, // show logs
    level: 'debug', // show lots of logs
    logFile: true // write logs to file inside ./logs folder. You can specify a custom path too.
  },
  // if your rule 'passes' because it 'passed' zero files, the test normally fails. You can turn this off by setting this true
  allowEmptyTests: true,
  clearCache: true // reading nodes, imports etc is normally cached,
}
```

#### `check()`

For all other testing frameworks we don't have special syntax support but you can still easily use ArchUnitTS as follows:

```typescript
// Mocha example
const violations = await rule.check();
expect(violations).to.have.length(0);
```

The `check()` method works universally. It returns a violations array and is designed for testing frameworks without custom matcher support (Mocha, Node.js assert, etc.). You can assert the violations arrays length for example.

```typescript
// With configuration options, the same ones as mentioned above
const violations = await rule.check(options);
...
```

#### Configuration Options

Both methods accept the same configuration options:

```typescript
interface CheckOptions {
  // default undefined, which is treated as no logging
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  allowEmptyTests?: boolean; // Default: false
  clearCache?: boolean; // Default: false
}
```

#### When to Use Which Method

- **Use `toPassAsync()`** with Jest, Vitest, or Jasmine for better integration and error reporting
- **Use `check()`** with Mocha, Node.js assert, or any other testing framework
- **Use `check()`** when you need to inspect violations programmatically before deciding how to handle them

### Basic Pattern Matching Examples

```typescript
import { projectFiles, metrics } from 'archunit';

// Files module - Test architectural rules
projectFiles().withName('*.service.ts').should().beInFolder('**/services/**');

// Metrics module - Test only service classes
metrics().withName('*.service.ts').lcom().lcom96b().shouldBeBelow(0.7);

// Files module - Test classes in specific folders
projectFiles()
  .inFolder('**/controllers/**')
  .shouldNot()
  .dependOnFiles()
  .inFolder('**/database/**');

// Metrics module - Test classes in specific folders
metrics().inFolder('**/controllers/**').count().methodCount().shouldBeBelow(20);

// Files module - Test classes matching full path patterns
projectFiles().inPath('src/domain/**/*.ts').should().haveNoCycles();

// Metrics module - Test classes matching full path patterns
metrics().inPath('src/domain/**/*.ts').lcom().lcom96a().shouldBeBelow(0.8);
```

### Advanced Pattern Matching

You can combine multiple pattern matching methods for precise targeting across all modules:

```typescript
// Files module - Combine folder and filename patterns
projectFiles()
  .inFolder('**/services/**')
  .withName('*.service.ts')
  .should()
  .haveNoCycles();

// Metrics module - Combine folder and filename patterns
metrics().inFolder('**/services/**').withName('*.service.ts').lcom().lcom96b();

// Files module - Mix pattern matching with dependency rules
projectFiles().inPath('src/api/**').shouldNot().dependOnFiles().inPath('src/database/**');

// Metrics module - Mix pattern matching with class name matching
metrics()
  .inPath('src/api/**')
  .forClassesMatching(/.*Controller/)
  .count()
  .methodCount()
  .shouldBeBelow(15);
```

### Naming Convention Examples

Pattern matching is particularly useful for enforcing naming conventions:

```typescript
// Match camelCase test files
projectFiles()
  .withName(/^[a-z][a-zA-Z]*\.spec\.ts$/)
  .should()
  .beInFolder('**/test/**')
  .check();

// Match interface files (starting with I)
projectFiles()
  .withName(/^I[A-Z][a-zA-Z]*\.ts$/)
  .should()
  .beInFolder('**/interfaces/**')
  .check();

// Match constant files (all uppercase)
projectFiles()
  .withName(/^[A-Z_]+\.ts$/)
  .should()
  .beInFolder('**/constants/**')
  .check();

// Metrics for PascalCase controllers
metrics()
  .withName(/^[A-Z][a-zA-Z]*Controller\.ts$/)
  .lcom()
  .lcom96b()
  .shouldBeBelow(0.5)
  .check();
```

### Complex Pattern Matching Scenarios

Here are more advanced use cases combining different pattern types:

```typescript
// Ensure all TypeScript files in feature folders follow naming conventions
projectFiles()
  .inPath('src/features/**/*.ts')
  .withName(/^[A-Z][a-zA-Z]*\.(service|controller|model)\.ts$/)
  .should()
  .haveNoCycles();

// Test that utility files have low complexity
metrics()
  .inFolder('**/utils/**')
  .withName('*.util.ts')
  .complexity()
  .cyclomaticComplexity()
  .shouldBeBelow(5);

// Ensure test files don't depend on implementation details
projectFiles()
  .withName('*.spec.ts')
  .shouldNot()
  .dependOnFiles()
  .inPath('src/**/internal/**');

// Check cohesion of domain entities
metrics()
  .inPath('src/domain/entities/**/*.ts')
  .withName(/^[A-Z][a-zA-Z]*Entity\.ts$/)
  .lcom()
  .lcom96a()
  .shouldBeBelow(0.6);
```

### Supported Metrics Types

#### LCOM (Lack of Cohesion of Methods)

The LCOM metrics measure how well the methods and fields of a class are connected, indicating the cohesion level of the class. Lower values indicate better cohesion.

```typescript
// LCOM96a (Handerson et al.)
metrics().lcom().lcom96a().shouldBeBelow(0.8);

// LCOM96b (Handerson et al.)
metrics().lcom().lcom96b().shouldBeBelow(0.7);
```

The LCOM96b metric is calculated as:

```
LCOM96b = (m - sum(μ(A))/m)/(1-1/m)
```

Where:

- `m` is the number of methods in the class
- `μ(A)` is the number of methods that access an attribute (field) A

The result is a value between 0 and 1:

- 0: perfect cohesion (all methods access all attributes)
- 1: complete lack of cohesion (each method accesses its own attribute)

#### Count Metrics

Measure various counts within classes:

```typescript
// Method count
metrics().count().methodCount().shouldBeBelow(20);

// Field count
metrics().count().fieldCount().shouldBeBelow(15).;

// Lines of code
metrics().count().linesOfCode().shouldBeBelow(200);
```

#### Distance Metrics

Measure architectural distance metrics:

```typescript
// Abstractness
metrics().distance().abstractness().shouldBeAbove(0.3);

// Instability
metrics().distance().instability().shouldBeBelow(0.8);

// Distance from main sequence
metrics().distance().distanceFromMainSequence().shouldBeBelow(0.5);
```

#### Custom Metrics

Define your own metrics with custom calculation logic:

```typescript
metrics()
  .customMetric(
    'complexityRatio',
    'Ratio of methods to fields',
    (classInfo) => classInfo.methods.length / Math.max(classInfo.fields.length, 1)
  )
  .shouldBeBelow(3.0);
```

## Slices API

The above info regarding filtering (`inFolder()` etc) does not apply to the slices API but only to the files and metrics APIs. the slices API has different a way of doing filtering. See more in the examples or below.

## 🔧 Nx Monorepo Support

ArchUnitTS provides support for Nx monorepos by reading the Nx project graph and making it accessible through the slices API. This allows you to validate architecture rules based on your actual Nx project structure and dependencies.

### Nx Project Slices

The `nxProjectSlices()` function reads your Nx workspace configuration and creates slices based on your Nx projects:

```typescript
import { nxProjectSlices } from 'archunit';
import * as path from 'path';

it('should adhere to Nx project architecture', async () => {
  const rule = nxProjectSlices().should().haveNoCycles();
  await expect(rule).toPassAsync();
});
```

### Nx Project Boundaries

Enforce boundaries between Nx applications and libraries using the project graph:

```typescript
it('should respect Nx project boundaries', async () => {
  // Apps should not depend on other apps
  const rule = nxProjectSlices()
    .matching('apps/admin')
    .shouldNot()
    .dependOnSlices()
    .matching('apps/client');
  await expect(rule).toPassAsync();
});

it('should enforce library type boundaries', async () => {
  // Feature libs should not depend on other feature libs
  const rule = nxProjectSlices()
    .matching('feature-*')
    .shouldNot()
    .dependOnSlices()
    .matching('feature-*');
  await expect(rule).toPassAsync();
});
```

### UML Diagram Validation with Nx

Validate your Nx architecture against PlantUML diagrams:

```typescript
it('should adhere to Nx architecture diagram', async () => {
  const diagramLocation = path.resolve('docs', 'components.puml');

  const rule = nxProjectSlices()
    .ignoringExternalDependencies()
    .should()
    .adhereToDiagramInFile(diagramLocation);

  await expect(rule).toPassAsync();
});

it('should follow inline diagram', async () => {
  const diagram = `
@startuml
component [shared-ui] as UI
component [feature-auth] as Auth
component [feature-dashboard] as Dashboard
component [shared-data-access] as Data

Auth --> UI
Dashboard --> UI
Auth --> Data
Dashboard --> Data
@enduml`;

  const rule = nxProjectSlices().should().adhereToDiagram(diagram);

  await expect(rule).toPassAsync();
});
```

### Nx Project Type Validation

Enforce Nx project categorization and naming conventions:

```typescript
it('should follow Nx project naming patterns', async () => {
  // Feature projects should follow naming convention
  const rule = nxProjectSlices()
    .matching(/^feature-/)
    .should()
    .containSlices()
    .matching(/^feature-[a-z-]+$/);

  await expect(rule).toPassAsync();
});

it('should enforce shared library dependencies', async () => {
  // Shared libs should not depend on feature libs
  const rule = nxProjectSlices()
    .matching('shared-*')
    .shouldNot()
    .dependOnSlices()
    .matching('feature-*');

  await expect(rule).toPassAsync();
});
```

## 📐 UML Diagram Support

ArchUnitTS can validate your architecture against PlantUML diagrams, ensuring your code matches your architectural designs.

### Component Diagrams

Validate component relationships using PlantUML component diagrams:

```typescript
it('should adhere to component architecture', async () => {
  const diagram = `
@startuml
component [UserInterface] as UI
component [BusinessLogic] as BL
component [DataAccess] as DA
component [Database] as DB

UI --> BL
BL --> DA
DA --> DB
@enduml`;

  const rule = projectSlices()
    .definedBy('src/(**)/') // Group by folder structure
    .should()
    .adhereToDiagram(diagram);

  await expect(rule).toPassAsync();
});
```

### Package Diagrams

Enforce package dependencies with UML package diagrams:

```typescript
it('should follow layered architecture diagram', async () => {
  const diagram = `
@startuml
package "Presentation Layer" {
  [Controllers]
  [ViewModels]
}

package "Business Layer" {
  [Services]
  [Domain Models]
}

package "Data Layer" {
  [Repositories]
  [Entities]
}

[Controllers] --> [Services]
[Services] --> [Repositories]
[ViewModels] --> [Domain Models]
@enduml`;

  const rule = projectSlices().definedBy('src/**/(**)').should().adhereToDiagram(diagram);

  await expect(rule).toPassAsync();
});
```

### Class Diagrams

Validate class relationships and inheritance hierarchies:

```typescript
it('should match domain model diagram', async () => {
  const diagram = `
@startuml
class User {
  +id: string
  +email: string
  +name: string
}

class Order {
  +id: string
  +userId: string
  +total: number
}

class OrderItem {
  +orderId: string
  +productId: string
  +quantity: number
}

User ||--o{ Order : places
Order ||--o{ OrderItem : contains
@enduml`;

  const rule = projectSlices()
    .definedBy('src/domain/(**)')
    .should()
    .adhereToDiagram(diagram);

  await expect(rule).toPassAsync();
});
```

### Microservices Architecture

Validate microservices boundaries with UML diagrams:

```typescript
it('should respect microservices boundaries', async () => {
  const diagram = `
@startuml
component [UserService] as US
component [OrderService] as OS
component [PaymentService] as PS
component [NotificationService] as NS

US --> OS : getUserOrders()
OS --> PS : processPayment()
OS --> NS : sendNotification()

note right of US : No direct dependencies\nbetween services except\nthrough defined APIs
@enduml`;

  const rule = projectSlices()
    .definedBy('services/(**)/') // Group by service folders
    .should()
    .adhereToDiagram(diagram);

  await expect(rule).toPassAsync();
});
```

### Custom Architecture Diagrams

Define and validate your own architectural patterns:

```typescript
it('should follow hexagonal architecture', async () => {
  const diagram = `
@startuml
hexagon "Application Core" as Core {
  component [Domain]
  component [Use Cases]
}

component [Web API] as Web
component [Database] as DB
component [External Service] as Ext

Web --> Core : HTTP
Core --> DB : Repository
Core --> Ext : Gateway

note top of Core : Business logic isolated\nfrom external concerns
@enduml`;

  const rule = projectSlices().definedBy('src/(**)/').should().adhereToDiagram(diagram);

  await expect(rule).toPassAsync();
});
```

## 📊 Library Comparison

Here's how ArchUnitTS compares to other TypeScript architecture testing libraries:

| Feature                           | **ArchUnitTS**                                    | **ts-arch**           | **arch-unit-ts**   | **ts-arch-unit** |
| --------------------------------- | ------------------------------------------------- | --------------------- | ------------------ | ---------------- |
| **API Stability**                 | ✅ Stable                                         | ✅ Stable             | ⚠️ Unstable        | ⚠️ Unstable      |
| **Circular Dependency Detection** | ✅ Supported                                      | ✅ Supported          | ❌ Limited         | ❌ No            |
| **Layer Dependency Rules**        | ✅ Advanced patterns                              | ✅ Advanced patterns  | ⚠️ Limited         | ❌ No            |
| **File Pattern Matching**         | ✅ Glob + Regex                                   | ✅ Glob + Regex       | ⚠️ Simple patterns | ❌ Basic         |
| **Custom Rules**                  | ✅ Full support                                   | ❌ No                 | ❌ No              | ❌ No            |
| **Code Metrics**                  | ✅ Comprehensive                                  | ❌ No                 | ❌ No              | ❌ No            |
| **Empty Test Detection**          | ✅ Fails by default (configurable)                | ❌ No                 | ❌ No              | ❌ No            |
| **Debug Logging**                 | ✅ Optional (off by default)                      | ❌ No                 | ❌ No              | ❌ No            |
| **LCOM Cohesion Analysis**        | ✅ Multiple algorithms                            | ❌ No                 | ❌ No              | ❌ No            |
| **Distance Metrics**              | ✅ Coupling & abstraction                         | ❌ No                 | ❌ No              | ❌ No            |
| **UML Diagram Validation**        | ✅ Supported                                      | ✅ Supported          | ❌ No              | ❌ No            |
| **Architecture Slicing**          | ✅ Supported                                      | ✅ Supported          | ❌ No              | ❌ No            |
| **Testing Framework Integration** | ✅ Universal (Jest, Vitest, Jasmine, Mocha, etc.) | ⚠️ Jest only          | ⚠️ Limited         | ⚠️ Basic         |
| **HTML Report Generation**        | ✅ Rich dashboards                                | ❌ No                 | ❌ No              | ❌ No            |
| **TypeScript AST Analysis**       | ✅ Deep analysis                                  | ⚠️ Basic              | ⚠️ Limited         | ⚠️ Basic         |
| **Performance Optimization**      | ✅ Caching + parallel                             | ⚠️ Basic              | ❌ No              | ❌ No            |
| **Error Messages**                | ✅ Detailed + clickable                           | ⚠️ Basic              | ⚠️ Basic           | ⚠️ Basic         |
| **Documentation**                 | ✅ Comprehensive                                  | ⚠️ Basic              | ⚠️ Minimal         | ⚠️ Minimal       |
| **Community Support**             | ✅ Active maintenance                             | ✅ Active maintenance | ❌ Inactive        | ❌ Inactive      |

As you see in the table, there are some features that are only supported by us. Here is a brief highlight of those that we believe are the most critical of them:

- **Empty Test Protection**: This one is extremely important. Let's say you define architectural boundaries that shall not be crossed - but you have a typo in the path to some folder. **Your test will just pass with other libraries!** They will _'check the rule'_ on _0 files_ and the test _'passes'_. ArchUnitTS detects this, we call it an _empty test_, and your test fails. This is the default behvaior, you can customize it to allow empty tests if you want to.

- **Testing framework support**: ArchUnitTS works with any testing framework, plus we have special syntax extensions for Jest, Vitest and Jasmine. Other libraries such as ts-arch only have special support for Jest, or no special support at all.

- **Logging**: We have great support for logs and different log levels. This can help to understand what files are being analyzed and why tests pass/fail. Other libraries have no logging support at all.

- **Code Metrics**: Metrics such as cohesion, coupling metrics, distance from main sequence, and even custom metrics provide important insights into any projects code. ArchUnitTS is the only library with code metrics support.

- **Intelligent Error Messages**: Our error messages contain clickable file paths and detailed violation descriptions. Again, other libraries do not have this.

- **Custom rules**: ArchUnitTS is the only library that allows you to define custom rules and custom metrics.

- **HTML Reports**: We support auto generated dashboards with charts and detailed breakdowns. Other libraries do not.

## 📢 Informative Error Messages

When tests fail, you get helpful, colorful output with clickable file paths.

https://github.com/user-attachments/assets/04b26afb-53e9-4507-ba24-c8308b3a7922

_Click on file paths to jump directly to the issue in your IDE._

## 📝 Debug Logging & Configuration

We support logging to help you understand what files are being analyzed and troubleshoot test failures. Logging is disabled by default to keep test output clean.

### Enabling Debug Logging

```typescript
it('should respect layered architecture', async () => {
  const rule = projectFiles()
    .inFolder('src/presentation/**')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database');

  const options = {
    logging: {
      enabled: true,
      level: 'debug', // 'error' | 'warn' | 'info' | 'debug'
    },
  };

  await expect(rule).toPassAsync(options);
});
```

### Sample Debug Output

When debug logging is enabled, you'll see detailed information about the analysis:

```
[2025-06-02T12:08:26.355Z] [INFO] Starting architecture rule check: Dependency check: patterns [(^|.*/)src/database/.*]
[2025-06-02T12:08:26.445Z] [DEBUG] Analyzing 12 files in 'src/presentation' folder
[2025-06-02T12:08:26.456Z] [DEBUG] Found file: src/presentation/controllers/UserController.ts
[2025-06-02T12:08:26.467Z] [DEBUG] Found file: src/presentation/views/UserView.tsx
[2025-06-02T12:08:26.478Z] [DEBUG] Checking dependencies against 'src/database' pattern
[2025-06-02T12:08:26.489Z] [DEBUG] Violation detected: src/presentation/controllers/UserController.ts depends on src/database/UserRepository.ts
[2025-06-02T12:08:26.772Z] [WARN] Completed architecture rule check: Dependency check: patterns [(^|.*/)src/database/.*] (1 violations)
```

### File Logging for CI/CD Integration (Beta)

ArchUnitTS supports writing logs to files, making it super easy to integrate into CI pipelines and save logs as artifacts for debugging purposes. This is particularly useful for analyzing test failures in production environments.

**This feature is in beta**. Note that if your testing framework runs tests in parallel, like Jest does for example, the log file may look confusing for large test suites.

#### Basic File Logging

```typescript
// Write logs to a specific file
const options = {
  logging: {
    enabled: true,
    level: 'debug',
    logFile: true,
  },
};

await expect(rule).toPassAsync(options);
```

#### Easy CI Integration

```typescript
// Automatically generates timestamped log files in ./logs/
const options = {
  logging: {
    enabled: true,
    level: 'info',
    logFile: true, // Creates logs/archunit-YYYY-MM-DD_HH-MM-SS.log
  },
};

await expect(rule).toPassAsync(options);
```

When `logFile: true`, ArchUnitTS automatically:

- Creates a `logs/` directory if it doesn't exist
- Generates timestamped log files like `archunit-2025-06-06_14-30-45.log`
- Includes session headers with start times
- Formats all log messages with timestamps and log levels

#### CI Pipeline Integration Example

This makes it incredibly easy to save logs as CI artifacts for debugging:

```yaml
# GitHub Actions example
- name: Run Architecture Tests
  run: npm test

- name: Upload Test Logs
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: architecture-test-logs
    path: logs/
```

```yaml
# GitLab CI example
test:
  script:
    - npm test
  artifacts:
    when: always
    paths:
      - logs/
    expire_in: 1 week
```

## 🏈 Architecture Fitness Functions

The features of ArchUnitTS can very well be used as architectural fitness functions. See [here](https://www.thoughtworks.com/en-de/insights/articles/fitness-function-driven-development) for more information about that topic.

## 🔲 Core Modules

ArchUnitTS has the following core modules.

| Module      | Description                          | Status       | Links                                                                            |
| ----------- | ------------------------------------ | ------------ | -------------------------------------------------------------------------------- |
| **Files**   | File and folder based rules          | Stable       | [`src/files/`](src/files/) • [README](src/files/README.md)                       |
| **Metrics** | Code quality metrics                 | Stable       | [`src/metrics/`](src/metrics/) • [README](src/metrics/README.md)                 |
| **Slices**  | Architecture slicing                 | Stable       | [`src/slices/`](src/slices/) • [README](src/slices/README.md)                    |
| **Testing** | Universal test framework integration | Stable       | [`src/testing/`](src/testing/) • [README](src/testing/README.md)                 |
| **Common**  | Shared utilities                     | Stable       | [`src/common/`](src/common/)                                                     |
| **Reports** | Generate reports                     | Experimental | [`src/metrics/fluentapi/export-utils.ts`](src/metrics/fluentapi/export-utils.ts) |

## 🕵️ Technical Deep Dive

How does ArchUnitTS work under the hood? See [here](info/TECHNICAL.md) for a deep dive!

## 🦊 Contributing

We highly appreciate contributions. We use GitHub Flow, meaning that we use feature branches, similar to GitFlow, but with proper CI and CD. As soon as something is merged or pushed to `main` it gets deployed. See more in [Contributing](CONTRIBUTING.md). See also our _'[Backlog](TODO.md)'_.

Note that _deploy_ here means updating the docs. We consider auto deploying the library to npm too risky given the fact that there are no full time maintainers.

## ℹ️ FAQ

**Q: What TypeScript/JavaScript testing frameworks are supported?**

ArchUnitTS works with Jest, Jasmine, Vitest, Mocha, and any other testing framework. We have added special syntax support for Jest, Jasmine and Vitest, namely `toPassAsync` but, as said, ArchUnitTS works with any existing testing framework.

**Q: Can I use ArchUnitTS with JavaScript projects?**

Yes! While ArchUnitTS is built for TypeScript, it works with JavaScript projects too. You'll get the most benefit with TypeScript due to better static analysis capabilities.

**Q: How do I handle false positives in architecture rules?**

Use the filtering and targeting capabilities to exclude specific files or patterns. You can filter by file paths, class names, or custom predicates to fine-tune your rules.

**Q: What's the difference between file-based and class-based rules?**

File-based rules analyze import relationships between files, while class-based rules examine dependencies between classes and their members. Choose based on your architecture validation needs.

## 💟 Community

### Maintainers

• **[LukasNiessen](https://github.com/LukasNiessen)** - Creator and main maintainer

• **[janMagnusHeimann](https://github.com/janMagnusHeimann)** - Maintainer

• **[draugang](https://github.com/draugang)** - Maintainer

### Contributors

<a href="https://github.com/LukasNiessen/ArchUnitTS/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LukasNiessen/ArchUnitTS&max=1000&contributors=7" />
</a>

### Questions

Found a bug? Want to discuss features?

- Submit an [issue on GitHub](https://github.com/LukasNiessen/ArchUnitTS/issues/new/choose)
- Join our [GitHub Discussions](https://github.com//LukasNiessen/ArchUnitTS/discussions)
- Questions? Post on [Stack Overflow](https://stackoverflow.com/questions/tagged/ArchUnitTS) with the ArchUnitTS tag
- Leave a comment or thoughts on our [X account](https://x.com/ArchUnitTS)
- Visit our [documentation](https://lukasniessen.github.io/ArchUnitTS/)

If ArchUnitTS helps your project, please consider:

- Starring the repository 💚
- Suggesting new features 💭
- Contributing code or documentation ⌨️

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LukasNiessen/ArchUnitTS&type=Date)](https://www.star-history.com/#LukasNiessen/ArchUnitTS&Date)

## 📄 License

This project is under the **MIT** license.

---

<p align="center">
  <a href="#top"><strong>Go Back to Top</strong></a>
</p>

---

## P.S.

### Special Note on Cycle-Free Checks

Empty checks are particularly nuanced for cycle-free assertions. Consider this scenario: folder A contains one file that only depends on folder B. When testing `.inFolder("A").should().haveNoCycles()`, we want to check for cycles _within_ folder A only. However, if we report an empty test error, users might be confused since folder A does contain a file. Therefore, cycle-free checks use a more permissive approach and check the unfiltered file set for emptiness, rather than the filtered set that's actually analyzed for cycles.
"TODO"
