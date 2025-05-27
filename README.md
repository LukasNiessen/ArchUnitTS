<div align="center">

# 🏗️ ArchUnitTS

**Powerful TypeScript Architecture Testing Library**

[![npm version](https://img.shields.io/npm/v/archunit.svg)](https://www.npmjs.com/package/archunit)
[![npm downloads](https://img.shields.io/npm/dm/archunit.svg)](https://www.npmjs.com/package/archunit)
[![GitHub stars](https://img.shields.io/github/stars/LukasNiessen/ArchUnitTS.svg)](https://github.com/LukasNiessen/ArchUnitTS)
[![CI Status](https://github.com/LukasNiessen/ArchUnitTS/actions/workflows/ci.yml/badge.svg)](https://github.com/LukasNiessen/ArchUnitTS/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

_Enforce coding standards, detect circular dependencies, and maintain clean code architecture with colorful, developer-friendly error messages_

[📖 Documentation](https://github.com/LukasNiessen/ArchUnitTS#readme) • [🚀 Getting Started](#-quick-start) • [💡 Examples](#-examples) • [🤝 Contributing](CONTRIBUTING.md)

</div>

---

## ✨ Why ArchUnitTS?

🎯 **Architecture-First Development** - Test your code architecture like you test your functionality  
🔍 **Circular Dependency Detection** - Catch architectural issues before they become technical debt  
📊 **Code Quality Metrics** - Measure and enforce coupling, cohesion, and complexity standards  
🌈 **Beautiful Error Messages** - Colorful, clickable error output that helps you fix issues fast  
🧪 **Universal Test Integration** - Works seamlessly with Jest, Vitest, Mocha, and more  
⚡ **Zero Configuration** - Auto-detects your setup and just works

💚 **As of 2025, it's the #1 architecture testing library for TypeScript and JavaScript!**

⚠️ _Inspired by the amazing ArchUnit library, but we are not affiliated with the ArchUnit team._

---

---

## 🚀 Quick Start

### Installation

```bash
# npm
npm install archunit --save-dev

# yarn
yarn add -D archunit

# pnpm
pnpm add -D archunit
```

### Your First Architecture Test

```typescript
import { projectFiles } from 'archunit';

describe('Architecture Rules', () => {
	it('should not have circular dependencies', async () => {
		const rule = projectFiles('tsconfig.json').should().beFreeOfCycles();

		await expect(rule).toPass();
	});

	it('services should not depend on controllers', async () => {
		const rule = projectFiles('tsconfig.json')
			.inFolder('services')
			.should()
			.notDependOn()
			.files()
			.inFolder('controllers');

		await expect(rule).toPass();
	});
});
```

### Beautiful Error Messages ✨

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
```

_Click on file paths to jump directly to the issue in your IDE!_

---

## 🎯 Features

### 🔄 Dependency Rules

- **Circular Dependency Detection** - Find complex dependency cycles across your codebase
- **Layer Dependencies** - Enforce clean architecture layers (controllers → services → repositories)
- **Module Boundaries** - Prevent unwanted cross-module dependencies
- **Import Restrictions** - Control what can import what

### 📁 File & Folder Rules

- **Naming Conventions** - Enforce consistent file and folder naming
- **Location Rules** - Ensure files are in the correct directories
- **File Structure** - Validate project organization patterns
- **Extension Rules** - Control file type usage

### 🏗️ Code Architecture

- **Coupling Analysis** - Measure and limit code coupling
- **Cohesion Metrics** - Ensure high cohesion within modules
- **Complexity Rules** - Limit cyclomatic complexity
- **Design Patterns** - Enforce architectural patterns

### 🧪 Test Integration

- **Universal Compatibility** - Works with Jest, Vitest, Mocha, Jasmine, AVA
- **Custom Matchers** - Rich assertion library for architecture tests
- **Async/Await Support** - Modern async testing patterns
- **Parallel Execution** - Fast test execution with parallel processing

### 📋 Example Projects

Get started quickly with complete example projects for your favorite testing framework:

- 🚀 **[Vitest Example](https://github.com/LukasNiessen/ArchUnitTS-Vitest-Example)** - Complete Vitest setup with architecture tests
- ⚡ **[Jest Example](https://github.com/LukasNiessen/ArchUnitTS-Jest-Example)** - Full Jest integration examples
- 🔬 **[Jasmine Example](https://github.com/LukasNiessen/ArchUnitTS-Jasmine-Example)** - Jasmine testing framework integration

Each example includes:

- ✅ Complete project setup and configuration
- 🧪 Real-world architecture test examples
- 📚 Best practices and patterns
- 🚀 Ready-to-run test suites

---

## 📚 Examples

### 1. 🔄 Circular Dependencies

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

---

## 🔧 Configuration

### Basic Setup

Create an `archunit.config.js` file in your project root:

```javascript
module.exports = {
	// TypeScript configuration
	tsconfig: './tsconfig.json',

	// Folders to analyze
	include: ['src/**/*.ts', 'lib/**/*.ts'],
	exclude: ['**/*.test.ts', '**/*.spec.ts', 'dist/**'],

	// Error output options
	coloredOutput: true,
	clickableFilePaths: true,
	maxViolationsToShow: 10,

	// Performance options
	parallelProcessing: true,
	cacheEnabled: true,
};
```

### Advanced Configuration

```javascript
module.exports = {
	// Multiple TypeScript projects
	projects: [
		{ tsconfig: './frontend/tsconfig.json', name: 'Frontend' },
		{ tsconfig: './backend/tsconfig.json', name: 'Backend' },
	],

	// Custom rules
	rules: {
		maxCyclomaticComplexity: 8,
		maxLinesOfCode: 250,
		maxDependencies: 15,
	},

	// Layer definitions
	layers: {
		controllers: ['**/controllers/**'],
		services: ['**/services/**'],
		repositories: ['**/repositories/**'],
	},

	// Dependency rules
	layerDependencies: {
		controllers: ['services', 'types'],
		services: ['repositories', 'types'],
		repositories: ['types'],
	},
};
```

---

## 📈 Performance & Benchmarks

ArchUnitTS is optimized for speed and can analyze large codebases efficiently:

| Project Size | Files | Analysis Time | Memory Usage |
| ------------ | ----- | ------------- | ------------ |
| Small        | <100  | <1s           | <50MB        |
| Medium       | 500   | 2-3s          | ~100MB       |
| Large        | 1000  | 5-8s          | ~200MB       |
| Enterprise   | 5000+ | 15-30s        | ~500MB       |

**Performance Tips:**

- Enable caching in configuration
- Use parallel processing for large projects
- Exclude unnecessary files (tests, build output)
- Use specific folder targeting when possible

---

## 🛠️ API Reference

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

---

## 🤝 Community & Support

### 💬 Getting Help

- 📖 **Documentation**: [GitHub Wiki](https://github.com/LukasNiessen/ArchUnitTS/wiki)
- 💡 **Examples**: [Example Repository](https://github.com/LukasNiessen/ArchUnitTS-Examples)
- 🐛 **Issues**: [Report bugs or request features](https://github.com/LukasNiessen/ArchUnitTS/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/LukasNiessen/ArchUnitTS/discussions)

### 🎯 Popular Use Cases

- **Clean Architecture Enforcement** - Ensure layers don't violate boundaries
- **Microservices Boundaries** - Prevent cross-service dependencies
- **Code Quality Gates** - Automated architecture compliance in CI/CD
- **Legacy Code Migration** - Track and improve architectural debt
- **Team Onboarding** - Document and enforce architectural decisions

### 🌟 Show Your Support

If ArchUnitTS helps your project, please consider:

- ⭐ **Starring** the repository
- 🐛 **Reporting** issues you encounter
- 💡 **Suggesting** new features
- 🤝 **Contributing** code or documentation
- 💝 **Sponsoring** the project

---

## 🚀 Migration Guide

### From ArchUnit (Java)

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

### From ESLint Rules

Replace complex ESLint import rules with clear architecture tests:

```typescript
// Instead of complex ESLint config
// Replace with clear architecture test
test('services should not import from UI layer', async () => {
	const rule = projectFiles('tsconfig.json')
		.inFolder('services')
		.should()
		.notImport(['react', 'react-dom', '@mui/*']);

	await expect(rule).toPass();
});
```

---

## 📄 License

MIT © [Lukas Niessen](https://github.com/LukasNiessen)

---

## 🙏 Acknowledgments

- Inspired by [ArchUnit](https://www.archunit.org/) - The original architecture testing library for Java
- Built with ❤️ for the TypeScript and JavaScript community
- Special thanks to all [contributors](https://github.com/LukasNiessen/ArchUnitTS/graphs/contributors)

---

<div align="center">

**[⬆ Back to Top](#-archunitts)**

Made with 💚 by the ArchUnitTS team

</div>
