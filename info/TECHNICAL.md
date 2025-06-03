# ArchUnitTS Technical Deep Dive

<div align="center">
  <img align="center" src="../assets/logo-rounded.png" width="100" height="100" alt="ArchUnitTS Logo">
</div>

<p></p>

This document provides a technical overview of how ArchUnitTS works under the hood.

## 🏗️ Architecture Overview

ArchUnitTS is built on top of the TypeScript Compiler, Node's File System and more. It uses graph analysis techniques to enforce architectural rules.

```
┌─────────────────────────────────────────────────────┐
│                  User API Layer                     │
│  (projectFiles(), classes(), metrics())             │
├─────────────────────────────────────────────────────┤
│              Rule Definition & Fluent API           │
│     (shouldNot(), dependOn(), haveNoCycles())       │
├─────────────────────────────────────────────────────┤
│                Graph Extraction                     │
│     (TypeScript AST → Dependency Graph)             │
├─────────────────────────────────────────────────────┤
│               Analysis & Validation                 │
│  (Cycle Detection, Dependency Analysis, Metrics)    │
├─────────────────────────────────────────────────────┤
│              TypeScript Compiler API                │
│        (AST Parsing, Type Checking, etc.)           │
└─────────────────────────────────────────────────────┘
```

## 🔍 Core Components Deep Dive

### 1. Graph Extraction Engine

The heart of ArchUnitTS lies in `src/common/extraction/extract-graph.ts`. This module transforms TypeScript source code into a navigable dependency graph using the TypeScript Compiler API.

#### TypeScript Compiler API Integration

**Key TypeScript APIs Used:**

- **`ts.createProgram()`**: Creates a program instance that represents a compilation unit
- **`TypeChecker`**: Provides semantic analysis capabilities (type resolution, symbol lookup)
- **`SourceFile.forEachChild()`**: Traverses the Abstract Syntax Tree (AST)
- **`ts.SyntaxKind`**: Identifies different node types in the AST

#### AST Traversal and Analysis

**Pseudo Code** of the extraction process visits every node in the TypeScript AST:

```typescript
function visitNode(node: ts.Node, sourceFile: ts.SourceFile) {
  switch (node.kind) {
    case ts.SyntaxKind.ImportDeclaration:
      handleImportDeclaration(node as ts.ImportDeclaration);
      break;
    case ts.SyntaxKind.ClassDeclaration:
      handleClassDeclaration(node as ts.ClassDeclaration);
      break;
    case ts.SyntaxKind.CallExpression:
      handleCallExpression(node as ts.CallExpression);
      break;
    // ... more node types
  }
  ts.forEachChild(node, (child) => visitNode(child, sourceFile));
}
```

### 2. Import Resolution and Classification

ArchUnitTS categorizes imports into different types using `src/common/util/import-kinds-helper.ts`.

#### Import Analysis Process

1. **Parse Import Statements**: Extract module specifiers from `ImportDeclaration` nodes
2. **Resolve Module Paths**: Use TypeScript's module resolution to find actual file paths
3. **Classify Dependencies**: Determine if import is external, internal, or built-in
4. **Build Dependency Edges**: Create graph connections between files

### 3. Dependency Graph Construction

The dependency graph is the core data structure that powers all architectural analysis. It's defined in `src/common/extraction/graph.ts`.

#### Graph Building Algorithm

1. **Node Creation**: Each TypeScript file becomes a graph node
2. **Edge Creation**: Import statements create directed edges between nodes
3. **Metadata Extraction**: Collect classes, functions, and other code elements

### 4. Class Information Extraction

The `src/metrics/extraction/extract-class-info.ts` module analyzes TypeScript classes to extract structural information:

#### Analyzed Elements

- **Methods**: Public, private, static methods with complexity metrics
- **Properties**: Field declarations and their access modifiers
- **Inheritance**: Base classes and implemented interfaces
- **Dependencies**: Classes referenced within the class body

### 5. Cycle Detection Algorithm

ArchUnitTS implements efficient cycle detection using **Tarjan's Strongly Connected Components** algorithm.

### 6. Rule Engine and Validation

The rule engine in `src/files/fluentapi/files.ts` provides a fluent API for defining architectural constraints:

### 7. Metrics Collection and Analysis

The metrics system analyzes code quality indicators:

#### Supported Metrics

1. **Lines of Code (LOC)**: Physical and logical line counts
2. **Cyclomatic Complexity**: Measure of code complexity
3. **LCOM (Lack of Cohesion of Methods)**: Class cohesion metric
4. **Dependency Counts**: Number of incoming/outgoing dependencies
5. **Afferent/Efferent Coupling**: Package-level coupling metrics

### 8. Testing Framework Integration

ArchUnitTS provides seamless integration with popular testing frameworks through custom matchers:

#### Jest Integration

Simplified pseudo code:

```typescript
declare global {
  namespace jest {
    interface Matchers<R> {
      toPassAsync(): Promise<R>;
    }
  }
}

expect.extend({
  async toPassAsync(rule: ArchRule) {
    const violations = await rule.evaluate();

    return {
      pass: violations.length === 0,
      message: () =>
        violations.length > 0
          ? `Architecture rule failed:\n${violations.map((v) => v.message).join('\n')}`
          : 'Architecture rule passed',
    };
  },
});
```

## Execution Flow

Here's how ArchUnitTS processes your architectural rules:

### 1. Initialization Phase

```typescript
// User calls projectFiles()
const files = projectFiles().inFolder('src');
```

1. **Workspace Discovery**: Scan for TypeScript/JavaScript files
2. **Configuration Loading**: Read `tsconfig.json` and project settings
3. **File Filtering**: Apply folder and pattern filters

### 2. Analysis Phase

```typescript
// User defines rule
const rule = files.should().haveNoCycles();
```

1. **Graph Extraction**: Parse all files and build dependency graph
2. **Rule Compilation**: Convert fluent API calls into executable rules
3. **Optimization**: Cache results and optimize analysis order

### 3. Validation Phase

```typescript
// User executes rule
await expect(rule).toPassAsync();
```

1. **Rule Execution**: Run validation algorithms on the graph
2. **Violation Collection**: Gather all rule violations
3. **Result Formatting**: Prepare human-readable error messages

## Performance Optimizations

ArchUnitTS implements several optimizations for large codebases including caching and lazy loading.

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
