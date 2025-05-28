# Files Module

The Files module provides comprehensive file and folder-based architecture testing capabilities.

## Features

### Dependency Rules

- **Circular Dependency Detection** - Find complex dependency cycles across your codebase
- **Layer Dependencies** - Enforce clean architecture layers (controllers → services → repositories)
- **Module Boundaries** - Prevent unwanted cross-module dependencies
- **Import Restrictions** - Control what can import what

### Naming and Structure Rules

- **Naming Conventions** - Enforce consistent file and folder naming patterns
- **Location Rules** - Ensure files are in the correct directories
- **File Structure** - Validate project organization patterns
- **Extension Rules** - Control file type usage

## Usage

```typescript
import { projectFiles } from 'archunit';

// Test for circular dependencies
test('should be free of circular dependencies', async () => {
	const rule = projectFiles('tsconfig.json').should().beFreeOfCycles();
	await expect(rule).toPass();
});

// Enforce layer dependencies
test('services should not depend on controllers', async () => {
	const rule = projectFiles('tsconfig.json')
		.inFolder('services')
		.should()
		.notDependOn()
		.files()
		.inFolder('controllers');

	await expect(rule).toPass();
});

// Enforce naming conventions
test('should follow naming conventions', async () => {
	const rule = projectFiles('tsconfig.json')
		.inFolder('services')
		.should()
		.haveFilenameMatching(/.*Service\.ts$/);

	await expect(rule).toPass();
});
```

## API Reference

### File Selectors

- `.inFolder(path)` - Select files in a specific folder
- `.inFolders(paths)` - Select files in multiple folders
- `.matching(pattern)` - Select files matching a pattern
- `.named(filename)` - Select files with specific names

### Architecture Rules

- `.should().beFreeOfCycles()` - Check for circular dependencies
- `.should().notDependOn()` - Prevent dependencies
- `.should().onlyDependOn()` - Allow only specific dependencies
- `.should().haveFilenameMatching(pattern)` - Enforce naming patterns
- `.should().notImport(modules)` - Restrict imports

## Implementation

The Files module is implemented in:

- `src/files/fluentapi/` - Fluent API interfaces
- `src/files/assertion/` - Rule validation logic

---

- TODO: Add a config file, eg archunit.config.js or archunit.rc

- TODO: mention the big scope, eg not only file and folder based like most ts arch testing libararies, but you can test class wise, method wise, field wise, even line wise.

- TODO: mention due to the fact that export functionality is so customizable, you can include a cd process in your pipeline to deploy it to github/lab pages for example.
