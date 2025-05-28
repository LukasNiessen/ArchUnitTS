# Slices Module

The Slices module provides architecture slicing capabilities, allowing you to define and validate architectural boundaries and generate visual representations of your codebase structure.

## Features

### Architecture Slicing

- **Slice Definition** - Define logical slices of your architecture
- **Slice Validation** - Ensure slices respect defined boundaries
- **Layer Validation** - Validate proper layered architecture
- **Dependency Mapping** - Map and validate component relationships

### UML Generation

- **PlantUML Export** - Generate PlantUML diagrams from code structure
- **Component Diagrams** - Visualize component relationships
- **Dependency Graphs** - Show dependency flows between slices
- **Architecture Visualization** - Create visual documentation

### Integration Support

- **Nx Projects** - Special support for Nx monorepo projects
- **TypeScript Projects** - Full TypeScript AST analysis
- **Custom Projections** - Define custom slicing strategies

## Usage

```typescript
import { slicesOfProject } from 'archunit';

// Basic slice validation
test('should respect slice boundaries', async () => {
	const violations = await slicesOfProject('tsconfig.json')
		.definedBy('src.(*)..')
		.should()
		.notDependOnEachOther()
		.check();

	expect(violations).toHaveLength(0);
});

// Layer validation
test('should respect layered architecture', async () => {
	const violations = await slicesOfProject('tsconfig.json')
		.definedBy('src.(*)..')
		.should()
		.onlyAccessLayers(['domain', 'application', 'infrastructure'])
		.check();

	expect(violations).toHaveLength(0);
});

// Generate UML diagram
test('should generate architecture diagram', async () => {
	await slicesOfProject('tsconfig.json')
		.definedBy('src.(*)..')
		.exportDiagram('./architecture.puml');
});
```

## Nx Projects

Special support for Nx monorepo projects:

```typescript
import { slicesOfNxProject } from 'archunit';

test('should respect Nx project boundaries', async () => {
	const violations = await slicesOfNxProject()
		.should()
		.respectProjectBoundaries()
		.check();

	expect(violations).toHaveLength(0);
});
```

## UML Export

Generate PlantUML diagrams:

```typescript
// Export component diagram
await slicesOfProject('tsconfig.json')
	.definedBy('src.(*)..')
	.exportDiagram('./components.puml', {
		includeDetails: true,
		showDependencies: true,
	});
```

## Implementation

The Slices module is implemented in:

- `src/slices/fluentapi/` - Fluent API interfaces
- `src/slices/assertion/` - Slice validation logic
- `src/slices/projection/` - Slicing strategies and projections
- `src/slices/uml/` - UML diagram generation
