# ArchUnitTS - Architecture Testing

<div align="center" name="top">
<img align="center" src="assets/logo.png" width="150" height="150" style="margin-bottom: 20px; border-radius: 30px" alt="ArchUnitTS Logo">
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/archunit.svg)](https://www.npmjs.com/package/archunit)
[![npm downloads](https://img.shields.io/npm/dm/archunit.svg)](https://www.npmjs.com/package/archunit)
[![GitHub stars](https://img.shields.io/github/stars/LukasNiessen/ArchUnitTS.svg)](https://github.com/LukasNiessen/ArchUnitTS)

Enforce architecture rules in TypeScript and JavaScript projects. Check for dependency directions, detect circular dependencies, enforce coding standards and much more. Integrates with every testing framework. Set it up and add it to your CI/CD pipeline in less than 15 min.

Measured by GitHub stars, we are the #1 architecture testing library for TypeScript and JavaScript. 💚

_Inspired by the amazing ArchUnit library; we are not affiliated with ArchUnit._

[Documentation](https://github.com/LukasNiessen/ArchUnitTS#readme) • [Quickstart](#quickstart) • [Examples](#examples) • [Features TODO](FEATURES.md) • [Contributing](CONTRIBUTING.md)

## ⚡ Quickstart, 5 Minutes

### 1️⃣ Installation

```bash
npm i archunit -D
```

### 2️⃣ Add tests

Simply add tests to your existing test suites. Here is an example using Jest.

Note that we use _toPassAsync()_. This is special syntax we have added for _Jest, Vitest_ and _Jasmine_. However, ArchUnitTS works with any testing framework that exists.

```typescript
import { projectFiles, metrics } from 'archunit';

/**
 * We ensure that:
 * 1. No circular dependencies exist,
 * 2. Our layered architecture is respected,
 * 3. Basic code metric rules are met.
 */
describe('Architecture Rules', () => {
	it('should not have circular dependencies', async () => {
		const rule = projectFiles().inFolder('src').should().haveNoCycles();
		await expect(rule).toPassAsync();
	});

	describe('Layered Architecture Rules', () => {
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

		// More layers...
	});

	describe('Code Metric Rules', () => {
		it('should not allow classes with low cohesion', async () => {
			// We use the LCOM metric (lack of cohesion of methods)
			const rule = metrics().lcom().lcom96b().shouldBeBelow(0.5);
			await expect(rule).toPassAsync();
		});

		it('should not contain too large files', () => {
			const rule = metrics().count().linesOfCode().shouldBeBelow(1000);
			expect(rule).toPassAsync();
		});
	});
});
```

### 3️⃣ CI Integration

That's basically it. These tests will run automatically in your testing setup, for example in your CI pipeline. This ensures that the architectural rules you have defined are always adhered to! 🌻🐣

Additionally, you can generate reports and save them as artifacts. Here's a simple example using GitLab CI. _Note that reports are in beta._

```typescript
it('should generate HTML reports', () => {
	const countMetrics = metrics().count();
	const lcomMetrics = metrics().lcom();

	// saves HTML report files to /reports
	// You can specify the destination and even provide custom CSS
	await lcomMetrics.exportAsHTML();
	await countMetrics.exportAsHTML();

	// empty assertion so we dont get warnings about an empty test
	expect(0).toBe(0);
});
```

In you `gitlab-ci.yml`:

```yml
test:
    script:
        - npm test
    artifacts:
        when: always
        paths:
            - reports
```

Last note, if you don't want violations to make your tests fail but just print a warning, see this(TODO) section.

## 🎬 Demo

TODO: add video here! Make sure the video does not end up in dist when compiling the library!

## 🐹 Use Cases

We have many common uses cases covered in our examples folder. See this list for some of them.

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

TODO: add more?

## 🐲 Example Repositories

Here are a few repositories with fully functioning examples that use ArchUnitTS to ensure architectural rules:

- **[Vitest Example](https://github.com/LukasNiessen/ArchUnitTS-Vitest-Example)**: Complete Vitest setup with architecture tests
- **[Jest Example](https://github.com/LukasNiessen/ArchUnitTS-Jest-Example)**: Full Jest integration examples
- **[Jasmine Example](https://github.com/LukasNiessen/ArchUnitTS-Jasmine-Example)**: Jasmine testing framework integration

## 📙 Features

TODO. make this section thorough, complete and well done!

### Circular Dependencies

```typescript
import { projectFiles } from 'archunit';

// Test for any circular dependencies
test('should be free of circular dependencies', async () => {
	const rule = projectFiles('tsconfig.json').should().beFreeOfCycles();

	await expect(rule).toPass();
});

// Test specific folders only
test('services should be free of cycles', async () => {
	const rule = projectFiles('tsconfig.json')
		.inFolder('src/services')
		.should()
		.beFreeOfCycles();

	await expect(rule).toPass();
});
```

### 2. 🏗️ Layer Dependencies

```typescript
// Clean Architecture: Controllers → Services → Repositories
test('should respect clean architecture layers', async () => {
	// Controllers can depend on services
	const controllerRule = projectFiles('tsconfig.json')
		.inFolder('controllers')
		.should()
		.onlyDependOn()
		.files()
		.inFolders(['services', 'types', 'utils']);

	await expect(controllerRule).toPass();

	// Services cannot depend on controllers
	const serviceRule = projectFiles('tsconfig.json')
		.inFolder('services')
		.should()
		.notDependOn()
		.files()
		.inFolder('controllers');

	await expect(serviceRule).toPass();
});
```

### 3. 📁 Naming Conventions

```typescript
// Enforce naming patterns
test('should follow naming conventions', async () => {
	// Services must end with 'Service'
	const serviceNaming = projectFiles('tsconfig.json')
		.inFolder('services')
		.should()
		.haveFilenameMatching(/.*Service\.ts$/);

	await expect(serviceNaming).toPass();

	// Controllers must end with 'Controller'
	const controllerNaming = projectFiles('tsconfig.json')
		.inFolder('controllers')
		.should()
		.haveFilenameMatching(/.*Controller\.ts$/);

	await expect(controllerNaming).toPass();
});
```

### 4. 🚫 Import Restrictions

```typescript
// Prevent specific imports
test('should not use deprecated modules', async () => {
	const rule = projectFiles('tsconfig.json')
		.should()
		.notImport(['lodash', 'moment'])
		.because('Use native alternatives or date-fns instead');

	await expect(rule).toPass();
});

// Restrict internal imports
test('components should not access database directly', async () => {
	const rule = projectFiles('tsconfig.json')
		.inFolder('components')
		.should()
		.notImport(['pg', 'mysql2', 'mongoose'])
		.because('Components should use services for data access');

	await expect(rule).toPass();
});
```

### 5. 📊 Complexity Rules

```typescript
// Control code complexity
test('should maintain low complexity', async () => {
	const rule = projectFiles('tsconfig.json')
		.should()
		.haveCyclomaticComplexityLessThan(10)
		.because('Complex functions are hard to test and maintain');

	await expect(rule).toPass();
});

// Limit file size
test('should keep files reasonably sized', async () => {
	const rule = projectFiles('tsconfig.json')
		.should()
		.haveLinesOfCodeLessThan(300)
		.because('Large files are difficult to understand');

	await expect(rule).toPass();
});
```

### 6. 🎨 Custom Rules

```typescript
// Create custom architecture rules
test('should follow custom business rules', async () => {
	const rule = projectFiles('tsconfig.json')
		.matching('**/payment/**')
		.should()
		.onlyAccessClassesThat()
		.haveNameMatching(/Payment.*/)
		.orHaveAnnotation('PaymentSafe')
		.because('Payment code must be isolated for security');

	await expect(rule).toPass();
});
```

## Beautiful Error Messages ✨

When tests fail, you get helpful, colorful output with clickable file paths:

```
❌ Architecture rule failed with 2 violations:

1. 🔗 Circular dependency detected:
   Cycle: src/services/UserService.ts:1:1 → src/controllers/UserController.ts:1:1 → src/services/UserService.ts:1:1
   Rule: Circular dependencies are not allowed

2. 📁 File dependency violation:
   From: src/services/PaymentService.ts:1:1
   To: src/controllers/PaymentController.ts:1:1
   Rule: This dependency violates the architecture rule

      Architecture rule failed with 2 violations:

    1. Metric violation in class 'NegatedMatchPatternFileConditionBuilder':
       File: C:/Users/niesselu/Desktop/Playground/ArchUnitTS/src/files/fluentapi/files.ts:1:1
       Metric: LCOM96b
       Actual value: 1
       Expected: should be below 1
```

_Click on file paths to jump directly to the issue in your IDE!_

## 📖 API Reference

### Core API

#### `projectFiles(tsconfigPath?: string)`

Creates a file selector for architecture testing.

```typescript
const files = projectFiles('./tsconfig.json');
```

#### File Selectors

```typescript
// Select by folder
.inFolder('src/services')
.inFolders(['src/services', 'src/controllers'])

// Select by pattern
.matching('**/*Service.ts')
.matching(/.*Controller\.ts$/)

// Select by name
.named('UserService.ts')
.namedMatching(/.*Service\.ts$/)
```

#### Architecture Rules

```typescript
// Dependency rules
.should().beFreeOfCycles()
.should().notDependOn().files().inFolder('controllers')
.should().onlyDependOn().files().inFolders(['types', 'utils'])

// Naming rules
.should().haveFilenameMatching(/.*Service\.ts$/)
.should().beNamed('index.ts')

// Import rules
.should().notImport(['lodash', 'moment'])
.should().onlyImport(['react', 'react-dom'])

// Complexity rules
.should().haveCyclomaticComplexityLessThan(10)
.should().haveLinesOfCodeLessThan(300)
```

#### Custom Matchers

```typescript
// Jest/Vitest
await expect(rule).toPass();
await expect(rule).toFail();
await expect(rule).toHaveViolations(2);

// Mocha/Chai
expect(await rule.check()).to.be.true;
expect(await rule.getViolations()).to.have.length(0);
```

### UML Diagrams

TODO

### Advanced API

#### Custom Rules

```typescript
import { Rule, FileSet } from 'archunit';

class CustomRule extends Rule {
	async check(files: FileSet): Promise<boolean> {
		// Your custom logic here
		return true;
	}
}
```

#### Violation Handling

```typescript
const result = await rule.check();
if (!result.passed) {
	for (const violation of result.violations) {
		console.log(`${violation.file}: ${violation.message}`);
	}
}
```

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

## ℹ️ FAQ

TODO

## 👥 Maintainers

TODO

## 🤝 Community & Support

### Getting Help

TODO

- **Documentation**: [GitHub Wiki](https://github.com/LukasNiessen/ArchUnitTS/wiki)
- **Examples**: [Example Repository](https://github.com/LukasNiessen/ArchUnitTS-Examples)
- **Issues**: [Report bugs or request features](https://github.com/LukasNiessen/ArchUnitTS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/LukasNiessen/ArchUnitTS/discussions)

### Show Your Support

If ArchUnitTS helps your project, please consider:

- ⭐ Starring the repository
- 🐛 Reporting issues you encounter
- 💭 Suggesting new features
- ⌨️ Contributing code or documentation

## 🔄 Migration Guide

### 📦 From ArchUnit (Java)

If you're familiar with ArchUnit for Java, the concepts are very similar:

```java
// Java ArchUnit
ArchRuleDefinition.classes()
  .that().resideInAPackage("..service..")
  .should().notDependOnClassesThat()
  .resideInAPackage("..controller..");
```

```typescript
// ArchUnitTS equivalent
projectFiles('tsconfig.json')
	.inFolder('services')
	.should()
	.notDependOn()
	.files()
	.inFolder('controllers');
```

---

## 🤍 Support

If you find a bug, please submit an [issue on GitHub](https://github.com/LukasNiessen/ArchUnitTS/issues/new/choose).

Here’s how you can get community support:

- Ask a question in our [Slack Community](TODO).
- Join our [GitHub Discussions](https://github.com//LukasNiessen/ArchUnitTS/discussions).
- Post on [Stack Overflow](https://stackoverflow.com/questions/tagged/ArchUnitTS) with the ArchUnitTS tag.

---

## 📄 License

MIT © [Lukas Niessen](https://github.com/LukasNiessen)

## ⭐ Stars

[![Star History Chart](https://api.star-history.com/svg?repos=LukasNiessen/ArchUnitTS&type=Date)](https://www.star-history.com/#Fosowl/agenticSeek&Date)

<div align="center">
**[⬆ Back to Top](#top)**
</div>

---

## 🚀 Advanced Features

ArchUnitTS goes beyond simple file and folder testing. Unlike most TypeScript architecture testing libraries, it provides comprehensive analysis capabilities:

- **🔍 Multi-Level Analysis** - Test at file, class, method, field, and even line levels
- **📊 Comprehensive Metrics** - LCOM cohesion metrics, distance metrics, count metrics
- **🎨 Visual Documentation** - Generate UML diagrams and architecture visualizations
- **📋 Export Capabilities** - Create HTML reports deployable to GitHub/GitLab Pages
- **⚙️ Custom Rules** - Define complex business-specific architectural rules
- **⚡ Performance Optimized** - Efficient analysis of large codebases

---

## 📝 TODO Items

- TODO: Add a config file, eg archunit.config.js or archunit.rc

- TODO: mention the big scope, eg not only file and folder based like most ts arch testing libararies, but you can test class wise, method wise, field wise, even line wise.

- TODO: mention due to the fact that export functionality is so customizable, you can include a cd process in your pipeline to deploy it to github/lab pages for example.

- TODO: create and website, add to top (
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) stuff) and replace links, e.g. doc link, to website

- TODO: add technical breakdown.

- TODO: add quickstart where we: Set it up and add it to your CI/CD pipeline in less than 15 min. Gitlab ci or github actions in the example.
