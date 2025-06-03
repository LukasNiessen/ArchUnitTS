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

<!--The #1 architecture testing library for TS and JS measured by GitHub stars! 💚  -->

_Inspired by the amazing ArchUnit library but we are not affiliated with ArchUnit._

[Documentation](#readme) • [Use Cases](#-use-cases) • [Features](#-features) • [Contributing](CONTRIBUTING.md)

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
  const rule = projectFiles().inFolder('src').should().haveNoCycles();
  await expect(rule).toPassAsync();
});
```

Next we ensure that our layered architecture is respected.

```typescript
it('presentation layer should not depend on database layer', async () => {
  const rule = projectFiles()
    .inFolder('src/presentation')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database');

  await expect(rule).toPassAsync();
});

it('business layer should not depend on database layer', async () => {
  const rule = projectFiles()
    .inFolder('src/business')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database');

  await expect(rule).toPassAsync();
});

// More layers ...
```

Lastly we ensure that some code metric rules are met.

```typescript
it('should not contain too large files', () => {
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
it('should generate HTML reports', () => {
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

Many common uses cases are covered in our examples folder. Here is an overview.

**Layered Architecture:**

- Express BackEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/layered-architecture/express/README.md)

- Fastify BackEnd using a UML Diagram: click here (TODO-add-Link: subfolder of examples. Eg examples/layered-architecture/fastify-uml/README.md)

- Angular FrontEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/layered-architecture/angular/README.md)

**Domain Partitioning:**

- Express MicroServices using Nx: click here (TODO-add-Link: subfolder of examples. Eg examples/micro-services/express/README.md)

- TODO: is this possible with ArchUnitTS, todo domain partitioning checks in Nx?

- Modular monlith, Deno BackEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/domain-partitioning/deno/README.md)

- React MicroFrontEnds using Nx: click here (TODO-add-Link: subfolder of examples. Eg examples/micro-frontends/react/README.md)

- TODO: is this possible with ArchUnitTS, todo domain partitioning checks in Nx?

**Clean Architecture:**

- NestJS BackEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/clean-architecture/nestjs/README.md)

- React FrontEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/clean-architecture/react/README.md)

**Hexagonal Architecture:**

- Express BackEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/hexagonal-architecture/express/README.md)

**MVC:**

- Spring BackEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/mvc/spring/README.md)

## 🐲 Example Repositories

Here are a few repositories with fully functioning examples that use ArchUnitTS to ensure architectural rules:

- **[Vitest Example](https://github.com/LukasNiessen/ArchUnitTS-Vitest-Example)**: Complete Vitest setup with architecture tests
- **[Jest Example](https://github.com/LukasNiessen/ArchUnitTS-Jest-Example)**: Full Jest integration examples
- **[Jasmine Example](https://github.com/LukasNiessen/ArchUnitTS-Jasmine-Example)**: Jasmine testing framework integration

## 🐣 Features

This is an overview of you can do with ArchUnitTS.

### Circular Dependencies

```typescript
it('services should be free of cycles', async () => {
  const rule = projectFiles().inFolder('src/services').should().haveNoCycles();
  await expect(rule).toPassAsync();
});
```

### Layer Dependencies

```typescript
it('should respect clean architecture layers', async () => {
  const rule = projectFiles()
    .inFolder('src/presentation')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database');
  await expect(rule).toPassAsync();
});

it('business layer should not depend on presentation', async () => {
  const rule = projectFiles()
    .inFolder('src/business')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/presentation');
  await expect(rule).toPassAsync();
});
```

### Naming Conventions

```typescript
it('should follow naming patterns', async () => {
  const rule = projectFiles().inFolder('services').should().matchFilename('*Service.ts'); // Modern glob pattern approach
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
  .inPath('**/*.ts')
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

### Filtering and Targeting

```typescript
it('should filter by folder pattern', async () => {
  const rule = metrics()
    .inFolder(/src\/services/)
    .count()
    .methodCount()
    .shouldBeBelow(15);
  await expect(rule).toPassAsync();
});

it('should filter by class pattern', async () => {
  const rule = metrics()
    .forClassesMatching(/.*Service$/)
    .lcom()
    .lcom96b()
    .shouldBeBelow(0.5);
  await expect(rule).toPassAsync();
});

it('should target specific files', async () => {
  const rule = metrics()
    .forFile('user-service.ts')
    .count()
    .linesOfCode()
    .shouldBeBelow(200);
  await expect(rule).toPassAsync();
});
```

### Export & Reporting

Generate beautiful HTML reports for your metrics. _Note that this features is in beta._

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

- **`withName(pattern)`** - Match only the filename (e.g., 'Service.ts' from 'src/services/Service.ts')
- **`inPath(pattern)`** - Match against the full relative path (e.g., 'src/services/Service.ts')
- **`inFolder(pattern)`** - Match against the path without filename (e.g., 'src/services' from 'src/services/Service.ts')

### Pattern Types

Both string patterns (with glob support) and regular expressions are supported:

```typescript
// String patterns with glob support
.withName('*.service.ts')     // All files ending with .service.ts
.inFolder('**/services')      // All files in any services folder
.inPath('src/api/**/*.ts')    // All TypeScript files under src/api

// Regular expressions
.withName(/^.*Service\.ts$/)  // Same as *.service.ts but as regex
.inFolder(/services$/)        // Folders ending with 'services'
```

### Basic Pattern Matching Examples

```typescript
import { projectFiles, metrics } from 'archunit';

// Files module - Test architectural rules
await projectFiles().withName('*.service.ts').should().beInFolder('services').check();

// Metrics module - Test only service classes
await metrics().withName('*.service.ts').lcom().lcom96b().shouldBeBelow(0.7).check();

// Files module - Test classes in specific folders
await projectFiles()
  .inFolder('**/controllers')
  .shouldNot()
  .dependOnFiles()
  .inFolder('**/database')
  .check();

// Metrics module - Test classes in specific folders
await metrics()
  .inFolder('**/controllers')
  .count()
  .methodCount()
  .shouldBeBelow(20)
  .check();

// Files module - Test classes matching full path patterns
await projectFiles().inPath('src/domain/**/*.ts').should().haveNoCycles().check();

// Metrics module - Test classes matching full path patterns
await metrics().inPath('src/domain/**/*.ts').lcom().lcom96a().shouldBeBelow(0.8).check();
```

### Advanced Pattern Matching

You can combine multiple pattern matching methods for precise targeting across all modules:

```typescript
// Files module - Combine folder and filename patterns
await projectFiles()
  .inFolder('**/services')
  .withName('*.service.ts')
  .should()
  .beInFolder('services')
  .check();

// Metrics module - Combine folder and filename patterns
await metrics()
  .inFolder('**/services')
  .withName('*.service.ts')
  .lcom()
  .lcom96b()
  .shouldBeBelow(0.6)
  .check();

// Files module - Mix pattern matching with dependency rules
await projectFiles()
  .inPath('src/api/**')
  .shouldNot()
  .dependOnFiles()
  .inPath('src/database/**')
  .check();

// Metrics module - Mix pattern matching with class name matching
await metrics()
  .inPath('src/api/**')
  .forClassesMatching(/.*Controller/)
  .count()
  .methodCount()
  .shouldBeBelow(15)
  .check();
```

### Supported Metrics Types

#### LCOM (Lack of Cohesion of Methods)

The LCOM metrics measure how well the methods and fields of a class are connected, indicating the cohesion level of the class. Lower values indicate better cohesion.

```typescript
// LCOM96a (Handerson et al.)
await metrics().lcom().lcom96a().shouldBeBelow(0.8).check();

// LCOM96b (Handerson et al.)
await metrics().lcom().lcom96b().shouldBeBelow(0.7).check();
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
await metrics().count().methodCount().shouldBeBelow(20).check();

// Field count
await metrics().count().fieldCount().shouldBeBelow(15).check();

// Lines of code
await metrics().count().linesOfCode().shouldBeBelow(200).check();
```

#### Distance Metrics

Measure architectural distance metrics:

```typescript
// Abstractness
await metrics().distance().abstractness().shouldBeAbove(0.3).check();

// Instability
await metrics().distance().instability().shouldBeBelow(0.8).check();

// Distance from main sequence
await metrics().distance().distanceFromMainSequence().shouldBeBelow(0.5).check();
```

#### Custom Metrics

Define your own metrics with custom calculation logic:

```typescript
await metrics()
  .customMetric(
    'complexityRatio',
    'Ratio of methods to fields',
    (classInfo) => classInfo.methods.length / Math.max(classInfo.fields.length, 1)
  )
  .shouldBeBelow(3.0)
  .check();
```

### Testing Framework Integration

#### Jest Integration

```typescript
import { projectFiles, metrics } from 'archunit';

describe('Architecture Rules with Pattern Matching', () => {
  it('service files should follow naming convention', async () => {
    const violations = await projectFiles()
      .withName('*.service.ts')
      .should()
      .beInFolder('services')
      .check();

    expect(violations).toHaveLength(0);
  });

  it('service classes should have high cohesion', async () => {
    const violations = await metrics()
      .withName('*.service.ts')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.7)
      .check();

    expect(violations).toHaveLength(0);
  });

  it('should use toPassAsync syntax', async () => {
    await expect(
      projectFiles().withName('*.service.ts').should().beInFolder('services')
    ).toPassAsync();
    await expect(metrics().lcom().lcom96b().shouldHaveCohesionAbove(0.7)).toPassAsync();
  });
});
```

#### Mocha Integration

```typescript
import { projectFiles, metrics } from 'archunit';
import { expect } from 'chai';

describe('Architecture Rules with Pattern Matching', () => {
  it('controller files should not depend on database', async () => {
    const violations = await projectFiles()
      .inFolder('**/controllers')
      .shouldNot()
      .dependOnFiles()
      .inFolder('**/database')
      .check();

    expect(violations).to.have.length(0);
  });

  it('controller classes should not be too complex', async () => {
    const violations = await metrics()
      .inFolder('**/controllers')
      .count()
      .methodCount()
      .shouldBeBelow(15)
      .check();

    expect(violations).to.have.length(0);
  });
});
```

### Integration with Architecture Rules

The pattern matching system works seamlessly across all ArchUnitTS modules to ensure both structural compliance and code quality:

```typescript
it('core domain should follow all architectural rules', async () => {
  // Files module - No circular dependencies
  const cycleViolations = await projectFiles()
    .inPath('src/domain/**/*.ts')
    .should()
    .haveNoCycles()
    .check();

  // Files module - Proper layering
  const layerViolations = await projectFiles()
    .inPath('src/domain/**/*.ts')
    .shouldNot()
    .dependOnFiles()
    .inPath('src/infrastructure/**/*.ts')
    .check();

  // Metrics module - High cohesion
  const cohesionViolations = await metrics()
    .inPath('src/domain/**/*.ts')
    .lcom()
    .lcom96b()
    .shouldHaveCohesionAbove(0.6)
    .check();

  expect(cycleViolations).toHaveLength(0);
  expect(layerViolations).toHaveLength(0);
  expect(cohesionViolations).toHaveLength(0);
});
```

### Backwards Compatibility

All existing methods continue to work alongside the new pattern matching capabilities across all modules:

```typescript
// Files module - Legacy methods still supported
await projectFiles().inFolder('services').should().haveNoCycles().check();

await projectFiles()
  .matchingPattern('**/*.service.ts')
  .should()
  .beInFolder('services')
  .check();

// Metrics module - Legacy methods still supported
await metrics()
  .inFile('src/services/user.service.ts')
  .count()
  .methodCount()
  .shouldBeBelow(10)
  .check();

await metrics()
  .forClassesMatching(/.*Service/)
  .lcom()
  .lcom96a()
  .shouldBeBelow(0.7)
  .check();
```

## 🎯 File and Folder Filtering

TODO: needs to be way better. Where can you use glob pattern? Which are just name related, which entire path related? etc. which allow just string? which regex? which glob pattern? explain glob pattern!

ArchUnitTS provides powerful and flexible file filtering capabilities that allow you to precisely select files for architectural testing. The API offers multiple methods to match files based on different criteria, making it easy to enforce architectural rules.

### Core Filtering Methods

#### 1. Folder-Based Filtering

The `inFolder()` method is the most common way to select files within specific directories:

```typescript
it('should test files in specific folders', async () => {
  // Test all files in the 'services' folder
  const rule = projectFiles().inFolder('services').should().haveNoCycles();

  await expect(rule).toPassAsync();
});
```

**How `inFolder()` works:**

- **Input:** `'components'`

  - ✅ Matches: `'src/components/component-a.ts'`
  - ✅ Matches: `'src/components/component-b.ts'`
  - ✅ Matches: `'src/domain/helper/components/helper-component.ts'` ← notice `/components/` is in the path
  - ❌ NOT matching: `'src/views/view-a.ts'`

- **Input:** `'src/components'` (more specific path)
  - ✅ Matches: `'src/components/component-a.ts'`
  - ✅ Matches: `'src/components/component-b.ts'`
  - ❌ NOT matching: `'src/domain/helper/components/helper-component.ts'`
  - ❌ NOT matching: `'src/views/view-a.ts'`

#### 2. Pattern-Based Filtering

TODO: entire section needs rewrite. !!! matchingpattern is also removed.
Use `matchingPattern()` for glob-style pattern matching:

```typescript
it('should match files with glob patterns', async () => {
  // Match all TypeScript files recursively
  const rule = projectFiles().matchingPattern('**/*.ts').should().haveNoCycles();

  await expect(rule).toPassAsync();
});
```

#### 3. Name-Based Filtering

Use `withName()` for exact filename matching:

```typescript
it('should match specific file names', async () => {
  const rule = projectFiles().withName('UserService.ts').should().beInFolder('services');

  await expect(rule).toPassAsync();
});
```

**How `withName()` works:**

- **Input:** `'my-component.ts'` (with extension)

  - ✅ Matches: `'src/cool-components/my-component.ts'`
  - ✅ Matches: `'src/other-components/my-component.ts'`
  - ❌ NOT matching: `'src/cool-components/component'`
  - ❌ NOT matching: `'src/views/view-a.ts'`

- **Input:** `'my-component'` (without extension)
  - ❌ NOT matching: `'src/cool-components/my-component.ts'`
  - ❌ NOT matching: `'src/other-components/my-component.ts'`
  - ✅ Matches: `'src/cool-components/my-component'` (if such file exists)

### Enhanced Pattern Matching API

ArchUnitTS provides four enhanced pattern matching methods for more precise file selection:

#### 1. `matchFilename()` - Exact Filename Matching (Recommended)

Matches patterns against the filename only (not the full path). This is the recommended approach for most use cases.

```typescript
it('should enforce service naming convention', async () => {
  const violations = await projectFiles()
    .inFolder('services')
    .should()
    .matchFilename('*Service.ts') // Glob pattern
    .check();

  // Files like 'UserService.ts', 'ProductService.ts' will match
  // Files like 'ServiceHelper.ts' will NOT match
});
```

**Examples of `matchFilename()` patterns:**

```typescript
// Glob patterns (recommended)
.matchFilename('Service*.ts')     // ✅ Service.ts, ServiceA.ts, ServiceImpl.ts
.matchFilename('*Controller.ts')  // ✅ UserController.ts, AdminController.ts
.matchFilename('Test?.spec.ts')   // ✅ TestA.spec.ts, TestB.spec.ts (? = single char)
.matchFilename('*Util*')          // ✅ StringUtil.ts, DateUtils.ts, MathUtility.ts

// Regular expressions
.matchFilename(/^Service.*\.ts$/) // ✅ Matches files starting with "Service"
.matchFilename(/.*\.(test|spec)\.ts$/) // ✅ Matches test files

// Exact string matching
.matchFilename('UserService.ts')  // ✅ Matches exactly "UserService.ts"
```

#### 2. `matchPath()` - Full Path Matching

Matches patterns against the complete relative file path from the project root:

```typescript
it('should match specific path patterns', async () => {
  const violations = await projectFiles()
    .should()
    .matchPath('src/services/*Service.ts') // Full path pattern
    .check();
});
```

**Examples of `matchPath()` patterns:**

TODO: does this really work? also, why two stars?

```typescript
// Glob patterns for paths
.matchPath('src/*/services/*.ts')     // ✅ Service files in any module
.matchPath('**/test/**/*.spec.ts')    // ✅ Test files in any test directory
.matchPath('src/components/**/*.tsx') // ✅ All TSX files in components

// Regular expressions for paths
.matchPath(/^src\/services\/.*Service\.ts$/) // ✅ Services in specific folder
.matchPath(/^src\/.*\/.*\.component\.ts$/)   // ✅ Component files anywhere in src
```

#### 3. `containInFilename()` - Partial Filename Matching

Checks if the filename contains the specified pattern as a substring:

```typescript
it('should find files containing specific terms', async () => {
  const violations = await projectFiles()
    .shouldNot()
    .containInFilename('Test') // Files shouldn't contain "Test" in filename
    .check();
});
```

**Examples of `containInFilename()` patterns:**

```typescript
.containInFilename('Service')    // ✅ UserService.ts, ServiceHelper.ts, MyServiceImpl.ts
.containInFilename('test')       // ✅ user.test.ts, test-utils.ts, testing.ts
.containInFilename(/service/i)   // ✅ Case-insensitive: UserService.ts, user-service.ts
```

#### 4. `containInPath()` - Partial Path Matching

Checks if the full file path contains the specified pattern as a substring:

```typescript
it('should find files with path containing specific terms', async () => {
  const violations = await projectFiles()
    .should()
    .containInPath('components') // Files should have 'components' in their path
    .check();
});
```

**Examples of `containInPath()` patterns:**

```typescript
.containInPath('test')        // ✅ src/test/file.ts, src/components/test/file.ts
.containInPath('services')    // ✅ src/services/file.ts, lib/services/impl/file.ts
.containInPath(/spec|test/)   // ✅ Files with 'spec' or 'test' anywhere in path
```

### Pattern Matching

```typescript
.matchFilename('*Controller.ts')  // or
.matchFilename(/.*Controller\.ts$/)
```

### Pattern Types and Syntax

#### 1. Glob Patterns (Recommended for Strings)

TODO: do we really allow two stars?

Glob patterns provide intuitive wildcard matching:

- `*` - Matches zero or more characters (excluding path separators)
- `?` - Matches exactly one character
- `**` - Matches zero or more path segments (in path matching)

```typescript
// Glob pattern examples
'Service*'; // Service.ts, ServiceA.ts, ServiceImpl.ts
'*Controller.ts'; // UserController.ts, AdminController.ts
'Test?.spec.ts'; // TestA.spec.ts, TestB.spec.ts
'*Util*'; // StringUtil.ts, DateUtils.ts, MathUtility.ts

// Path glob patterns
'src/*/services/*.ts'; // Service files in any module
'**/test/**/*.spec.ts'; // Test files in any test directory
```

#### 2. Regular Expressions

Use RegExp objects for complex pattern matching:

```typescript
// Regular expression examples
/^Service.*\.ts$/           // Files starting with "Service"
/.*\.(test|spec)\.ts$/     // Test files (.test.ts or .spec.ts)
/^[A-Z].*Service\.ts$/     // PascalCase service files
/service/i                 // Case-insensitive matching
```

#### 3. Literal Strings

Plain strings for exact or substring matching:

```typescript
// Exact matching (with matchFilename/matchPath)
'UserService.ts'; // Matches exactly "UserService.ts"
'src/services/UserService.ts'; // Matches exact path

// Substring matching (with containInFilename/containInPath)
'Service'; // Contains "Service" anywhere
'test'; // Contains "test" anywhere
```

### Advanced Filtering Examples

#### Complex File Selection

```typescript
it('should validate complex architectural rules', async () => {
  // Services should follow naming convention
  const serviceViolations = await projectFiles()
    .inFolder('services')
    .should()
    .matchFilename(/^[A-Z].*Service\.ts$/) // PascalCase services
    .check();

  // Components should be in components folder
  const componentViolations = await projectFiles()
    .matchFilename('*.component.tsx')
    .should()
    .beInFolder('components')
    .check();

  // Test files should not be in production code
  const testViolations = await projectFiles()
    .containInFilename(/\.(test|spec)\./)
    .shouldNot()
    .beInFolder('src/production')
    .check();

  expect(serviceViolations).toEqual([]);
  expect(componentViolations).toEqual([]);
  expect(testViolations).toEqual([]);
});
```

#### Layered Architecture Validation

```typescript
it('should enforce layered architecture', async () => {
  // Controllers should follow naming convention
  const controllerViolations = await projectFiles()
    .inFolder('controllers')
    .should()
    .matchFilename('*Controller.ts')
    .check();

  // Services should follow naming convention
  const serviceViolations = await projectFiles()
    .inFolder('services')
    .should()
    .matchFilename('*Service.ts')
    .check();

  // Repositories should follow naming convention
  const repoViolations = await projectFiles()
    .inFolder('repositories')
    .should()
    .matchFilename('*Repository.ts')
    .check();

  expect(controllerViolations).toEqual([]);
  expect(serviceViolations).toEqual([]);
  expect(repoViolations).toEqual([]);
});
```

#### Test File Organization

```typescript
it('should enforce test file conventions', async () => {
  // Unit tests should end with .spec.ts
  const unitTestViolations = await projectFiles()
    .inFolder('tests/unit')
    .should()
    .matchFilename('*.spec.ts')
    .check();

  // Integration tests should end with .integration.ts
  const integrationTestViolations = await projectFiles()
    .inFolder('tests/integration')
    .should()
    .matchFilename('*.integration.ts')
    .check();

  expect(unitTestViolations).toEqual([]);
  expect(integrationTestViolations).toEqual([]);
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

## ⚠️ Informative Error Messages

When tests fail, you get helpful, colorful output with clickable file paths.

https://github.com/user-attachments/assets/04b26afb-53e9-4507-ba24-c8308b3a7922

_Click on file paths to jump directly to the issue in your IDE._

## 📝 Debug Logging & Configuration

We support logging to help you understand what files are being analyzed and troubleshoot test failures. Logging is disabled by default to keep test output clean.

### Enabling Debug Logging

```typescript
it('should respect layered architecture', async () => {
  const rule = projectFiles()
    .inFolder('src/presentation')
    .shouldNot()
    .dependOnFiles()
    .inFolder('src/database');

  // Enable debug logging
  const violations = await rule.check({
    logging: {
      enabled: true,
      level: 'debug', // 'error' | 'warn' | 'info' | 'debug'
    },
  });

  expect(violations).toEqual([]);
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

### Logging Configuration Options

TODO: these options are false!!

```typescript
const violations = await rule.check({
  logging: {
    enabled: true, // Enable/disable logging (default: false)
    level: 'info', // Log level: 'error' | 'warn' | 'info' | 'debug'
    logTiming: true, // Add timestamps to log messages (default: true)
    colorOutput: true, // Colorized console output (default: true)
  },
});
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

We highly appreciate contributions. We use GitHub Flow, meaning that we use feature branches, similar to GitFlow, but with proper CI and CD. As soon as something is merged or pushed to `main` it gets deployed. See more in [Contributing](CONTRIBUTING.md).

## ℹ️ FAQ

**Q: What TypeScript/JavaScript testing frameworks are supported?**

ArchUnitTS works with Jest, Jasmine, Vitest, Mocha, and any other testing framework. We have added special syntax support for Jest, Jasmine and Vitest, namely `toPassAsync` but, as said, ArchUnitTS works with any existing testing framework.

**Q: Can I use ArchUnitTS with JavaScript projects?**

Yes! While ArchUnitTS is built for TypeScript, it works with JavaScript projects too. You'll get the most benefit with TypeScript due to better static analysis capabilities.

**Q: How do I handle false positives in architecture rules?**

Use the filtering and targeting capabilities to exclude specific files or patterns. You can filter by file paths, class names, or custom predicates to fine-tune your rules.

**Q: What's the difference between file-based and class-based rules?**

File-based rules analyze import relationships between files, while class-based rules examine dependencies between classes and their members. Choose based on your architecture validation needs.

## 👥 Maintainers

• **[LukasNiessen](https://github.com/LukasNiessen)** - Creator and main maintainer

• **[janMagnusHeimann](https://github.com/janMagnusHeimann)** - Maintainer

• **[draugang](https://github.com/draugang)** - Maintainer

## 💟 Contributors

<a href="https://github.com/LukasNiessen/ArchUnitTS/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LukasNiessen/ArchUnitTS" />
</a>

## 🤝 Community & Support

Found a bug? Want to discuss features?

- Submit an [issue on GitHub](https://github.com/LukasNiessen/ArchUnitTS/issues/new/choose)
- Join our [GitHub Discussions](https://github.com//LukasNiessen/ArchUnitTS/discussions)
- Questions? Post on [Stack Overflow](https://stackoverflow.com/questions/tagged/ArchUnitTS) with the ArchUnitTS tag
- Full documentation on our website [website](TODO)
- Leave a comment or thoughts on our [X account](https://x.com/ArchUnitTS)

If ArchUnitTS helps your project, please consider:

- Starring the repository 💚
- Suggesting new features 💭
- Contributing code or documentation ⌨️

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LukasNiessen/ArchUnitTS&type=Date)](https://www.star-history.com/#Fosowl/agenticSeek&Date)

## 📄 License

This project is under the **MIT** license.

---

<p align="center">
  <a href="#top"><strong>Go Back to Top</strong></a>
</p>

---

TODO: add elsewhere or just in docs. more info needed
TODO: add doc comments to extract-graph.ts

### All Files Inclusion

ArchUnitTS ensures that **all project files** appear in the dependency graph, even if they don't import other project files. This is achieved by adding self-referencing edges for every file in the project.

**Why this matters:**

- Standalone utility files are included in architectural analysis
- Entry point files without imports are visible in the graph
- Complete project coverage for architectural rules
- No files are accidentally excluded from analysis

**Example:**

```typescript
// Even if utils.ts doesn't import anything from your project,
// it will still appear in the graph with a self-edge: utils.ts -> utils.ts

// This ensures files like these are always analyzed:
// - Configuration files
// - Standalone utilities
// - Entry points
// - Constants files
// - Type definition files
```

The graph will contain:

- **Import edges**: Real dependencies between files (A imports B)
- **Self edges**: Every project file references itself (ensures inclusion)

This guarantees comprehensive architectural analysis across your entire codebase.

---

TODO: include toPassAsync explanation!

TODO: dependabot?

TODO: further documentation for project

---

## Notes

**Special Note on Cycle-Free Checks**: Empty checks are particularly nuanced for cycle-free assertions. Consider this scenario: folder A contains one file that only depends on folder B. When testing `.inFolder("A").should().haveNoCycles()`, we want to check for cycles _within_ folder A only. However, if we report an empty test error, users might be confused since folder A does contain a file. Therefore, cycle-free checks use a more permissive approach and check the unfiltered file set for emptiness, rather than the filtered set that's actually analyzed for cycles.
