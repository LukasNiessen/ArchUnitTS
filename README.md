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

[Documentation](#readme) • [Use Cases](#-use-cases) • [Examples](#examples) • [Features](#-features) • [Contributing](CONTRIBUTING.md)

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

  // toPassAsync is syntax support we added for Jest, Vitest
  // and Jasmine, but ArchUnitTS works with any testing framework
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
  // LCOM metric (lack of cohesion of methods)
  // Low LCOM means high cohesion
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
  const rule = projectFiles()
    .inFolder('services')
    .should()
    .matchPattern('.*Service.*\\.ts');
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
  .matchingPattern('**/*.ts')
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

## 🎯 Pattern Matching

ArchUnitTS provides powerful pattern matching capabilities for file selection and validation. You can use different matching strategies depending on your needs.

#### Filename-Only Matching

Match patterns against filenames only (recommended for most use cases):

```typescript
it('should enforce service naming convention', async () => {
  // This will flag files that don't start with "Service"
  const violations = await projectFiles()
    .inFolder('services')
    .should()
    .matchFilename('Service*') // Glob pattern: matches Service.ts, ServiceA.ts, ServiceB.ts
    .check();

  expect(violations).toHaveLength(1); // CoolService.ts should be flagged
  expect(violations[0].projectedNode.label).toBe('src/services/CoolService.ts');
});
```

#### Path Matching

Match patterns against full file paths:

```typescript
it('should match specific path patterns', async () => {
  const violations = await projectFiles()
    .should()
    .matchPath('src/services/User*.ts') // Matches full path pattern
    .check();

  expect(violations).toEqual([]);
});
```

#### Substring Matching

Find files containing specific substrings:

```typescript
it('should find files containing specific terms', async () => {
  const violations = await projectFiles()
    .shouldNot()
    .containInFilename('Test') // Files shouldn't contain "Test" in filename
    .check();

  expect(violations).toEqual([]);
});
```

### Legacy Pattern Matching

Use the legacy `matchPattern()` method for regex-based pattern matching:

```typescript
it('should match controller files', async () => {
  const violations = await projectFiles()
    .inFolder('controllers')
    .should()
    .matchPattern('.*Controller.ts')
    .check();

  expect(violations).toEqual([]);
});
```

### Pattern Types

ArchUnitTS supports multiple pattern types:

#### 1. Glob Patterns (Recommended)

Use shell-style wildcards for intuitive pattern matching:

```typescript
// Wildcard patterns
.matchFilename('Service*')        // Matches: Service.ts, ServiceA.ts, ServiceImpl.ts
.matchFilename('*Controller.ts')  // Matches: UserController.ts, AdminController.ts
.matchFilename('Test?.spec.ts')   // Matches: TestA.spec.ts, TestB.spec.ts (single char)
.matchFilename('*Util*')          // Matches: StringUtil.ts, DateUtils.ts, MathUtility.ts

// Path patterns
.matchPath('src/*/services/*.ts') // Matches service files in any module
.matchPath('**/*Service.ts')      // Matches service files anywhere in project
```

#### 2. Regular Expressions

Use RegExp objects for complex pattern matching:

```typescript
// Regex patterns
.matchFilename(/^Service.*\.ts$/)     // Matches files starting with "Service"
.matchFilename(/.*\.(test|spec)\.ts$/) // Matches test files
.matchPath(/^src\/components\/.*\.tsx?$/) // Matches component files

// Case-insensitive matching
.matchFilename(/service/i)            // Matches regardless of case
```

#### 3. Literal Strings

Use exact string matching:

```typescript
// Exact filename matching
.matchFilename('UserService.ts')      // Matches exactly "UserService.ts"

// Substring matching
.containInFilename('Service')         // Contains "Service" anywhere in filename
```

### Matching Options

Each pattern matching method supports different options:

#### Target Options

- `filename` - Match against filename only (default for `matchFilename()`)
- `path` - Match against full relative path (default for `matchPath()`)

#### Matching Mode Options

- `exact` - Pattern must match exactly (default for most methods)
- `partial` - Pattern can match as substring (default for `containInFilename()`)

### Advanced Examples

#### Complex File Selection

```typescript
it('should validate complex file patterns', async () => {
  // Multiple conditions
  const violations = await projectFiles()
    .inFolder('src')
    .should()
    .matchFilename(/^[A-Z].*Service\.ts$/) // PascalCase services
    .check();

  // Combined patterns
  const componentViolations = await projectFiles()
    .matchingPattern('src/components/**')
    .should()
    .matchFilename('*.component.tsx')
    .check();

  expect(violations).toEqual([]);
  expect(componentViolations).toEqual([]);
});
```

#### Architectural Validation

```typescript
it('should enforce layered architecture naming', async () => {
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

## 🔎 Informative Error Messages

When tests fail, you get helpful, colorful output with clickable file paths.

https://github.com/user-attachments/assets/04b26afb-53e9-4507-ba24-c8308b3a7922

_Click on file paths to jump directly to the issue in your IDE._

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
