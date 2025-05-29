# ArchUnitTS - Architecture Testing

<div align="center" name="top">
  <img align="center" src="assets/logo-rounded.png" width="150" height="150" alt="ArchUnitTS Logo">

<p></p> <!-- spacing -->

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/archunit.svg)](https://www.npmjs.com/package/archunit)
[![npm downloads](https://img.shields.io/npm/dm/archunit.svg)](https://www.npmjs.com/package/archunit)
[![GitHub stars](https://img.shields.io/github/stars/LukasNiessen/ArchUnitTS.svg)](https://github.com/LukasNiessen/ArchUnitTS)

</div>

Enforce architecture rules in TypeScript and JavaScript projects. Check for dependency directions, detect circular dependencies, enforce coding standards and much more. Integrates with every testing framework. Very simple setup and pipeline integration.

The #1 architecture testing library for TS and JS measured by GitHub stars! 💚  
_Inspired by the amazing ArchUnit library but we are not affiliated with ArchUnit._

[Documentation TODO](#readme) • [Use Cases](#-use-cases) • [Examples](#examples) • [Features](FEATURES.md) • [Contributing](CONTRIBUTING.md)

## ⚡ 5 min Quickstart

### Installation

```bash
npm i archunit -D
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

TODO: add video here! Make sure the video does not end up in dist when compiling the library!

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

**MVP:**

- Spring BackEnd: click here (TODO-add-Link: subfolder of examples. Eg examples/mvp/spring/README.md)

## 🐲 Example Repositories

Here are a few repositories with fully functioning examples that use ArchUnitTS to ensure architectural rules:

- **[Vitest Example](https://github.com/LukasNiessen/ArchUnitTS-Vitest-Example)**: Complete Vitest setup with architecture tests
- **[Jest Example](https://github.com/LukasNiessen/ArchUnitTS-Jest-Example)**: Full Jest integration examples
- **[Jasmine Example](https://github.com/LukasNiessen/ArchUnitTS-Jasmine-Example)**: Jasmine testing framework integration

## Features

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

	const rule = slicesOfProject().definedBy('src/(**)/').should().adhereToDiagram(diagram);
	await expect(rule).toPassAsync();
});

it('should not contain forbidden dependencies', async () => {
	const rule = slicesOfProject()
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

## 🔎 Informative Error Messages

When tests fail, you get helpful, colorful output with clickable file paths.

https://github.com/user-attachments/assets/04b26afb-53e9-4507-ba24-c8308b3a7922

_Click on file paths to jump directly to the issue in your IDE!_

## No Failing Tests?

TODO
Last note, if you don't want violations to make your tests fail but just print a warning, see this(TODO) section.

## 📖 API Reference

TODO: a lot if incorrect here!! Rework this entire thing or maybe remove it!

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

## 🦊 Contributing

We highly appreciate contributions. We use GitHub Flow, meaning that we use feature branches, similar to GitFlow, but we have proper CI and CD. As soon as something is merged or pushed to `main` it gets deployed. See more in [Contributing](CONTRIBUTING.md).

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

### Maintainers

• **[LukasNiessen](https://github.com/LukasNiessen)** - Creator and main maintainer

• **[janMagnusHeimann](https://github.com/janMagnusHeimann)** - Maintainer

• **[draugang](https://github.com/draugang)** - Maintainer

### Contributors

TODO: add picture of all contributors

## 🤝 Community & Support

- If you find a bug, please submit an [issue on GitHub](https://github.com/LukasNiessen/ArchUnitTS/issues/new/choose).

- Join our [GitHub Discussions](https://github.com//LukasNiessen/ArchUnitTS/discussions).

- Post on [Stack Overflow](https://stackoverflow.com/questions/tagged/ArchUnitTS) with the ArchUnitTS tag.

- Documentation: [GitHub Wiki](https://github.com/LukasNiessen/ArchUnitTS/wiki)

- Examples: [Example Repository](https://github.com/LukasNiessen/ArchUnitTS-Examples)

- Issues: [Report bugs or request features](https://github.com/LukasNiessen/ArchUnitTS/issues)

If ArchUnitTS helps your project, please consider:

- Starring the repository ⭐

- Suggesting new features 💭

- Contributing code or documentation ⌨️

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=LukasNiessen/ArchUnitTS&type=Date)](https://www.star-history.com/#Fosowl/agenticSeek&Date)

## 📄 License

**MIT**

---

<p align="center">
  <a href="#top"><strong>⬆ Back to Top</strong></a>
</p>

---

## 📝 TODO Items

- TODO: add technical deep dive section

- TODO: add comparison to other TS libraries. as a table probably

- TODO: Add a config file, eg archunit.config.js or archunit.rc

- TODO: mention the big scope, eg not only file and folder based like most ts arch testing libararies, but you can test class wise, method wise, field wise, even line wise.

- TODO: mention due to the fact that export functionality is so customizable, you can include a cd process in your pipeline to deploy it to github/lab pages for example.

- TODO: create and website, add to top (
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) stuff) and replace links, e.g. doc link, to website

- TODO: add technical breakdown.

- TODO: add quickstart where we: Set it up and add it to your CI/CD pipeline in less than 15 min. Gitlab ci or github actions in the example.
