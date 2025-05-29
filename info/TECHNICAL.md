# ArchUnitTS Technical Deep Dive

<div align="center">
  <img align="center" src="../assets/logo-rounded.png" width="100" height="100" alt="ArchUnitTS Logo">
</div>

This document provides a comprehensive technical overview of how ArchUnitTS works under the hood. If you're curious about the internals, want to contribute, or need to understand the architecture for debugging purposes, this is your guide.

## 🏗️ Architecture Overview

ArchUnitTS is built on top of the **TypeScript Compiler API** and uses sophisticated graph analysis techniques to enforce architectural rules. The library follows a modular design with clear separation of concerns:

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

```typescript
// Creates a TypeScript program with proper configuration
const program = ts.createProgram(fileNames, compilerOptions, host);
const typeChecker = program.getTypeChecker();
```

**Key TypeScript APIs Used:**

- **`ts.createProgram()`**: Creates a program instance that represents a compilation unit
- **`ts.getPreEmitDiagnostics()`**: Retrieves compilation errors before code generation
- **`TypeChecker`**: Provides semantic analysis capabilities (type resolution, symbol lookup)
- **`SourceFile.forEachChild()`**: Traverses the Abstract Syntax Tree (AST)
- **`ts.SyntaxKind`**: Identifies different node types in the AST

#### AST Traversal and Analysis

The extraction process visits every node in the TypeScript AST:

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
    ts.forEachChild(node, child => visitNode(child, sourceFile));
}
```

### 2. Import Resolution and Classification

ArchUnitTS categorizes imports into different types using `src/common/util/import-kinds-helper.ts`:

- **External Dependencies**: npm packages (`lodash`, `react`)
- **Internal Modules**: Project files (`./user.service`, `../models/user`)
- **Node.js Built-ins**: Core modules (`fs`, `path`, `http`)

#### Import Analysis Process

1. **Parse Import Statements**: Extract module specifiers from `ImportDeclaration` nodes
2. **Resolve Module Paths**: Use TypeScript's module resolution to find actual file paths
3. **Classify Dependencies**: Determine if import is external, internal, or built-in
4. **Build Dependency Edges**: Create graph connections between files

```typescript
// Example of import classification logic
function classifyImport(moduleSpecifier: string, sourceFile: string): ImportKind {
    if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
        return ImportKind.RELATIVE;
    }
    if (isNodeBuiltin(moduleSpecifier)) {
        return ImportKind.BUILTIN;
    }
    return ImportKind.EXTERNAL;
}
```

### 3. Dependency Graph Construction

The dependency graph is the core data structure that powers all architectural analysis. It's defined in `src/common/extraction/graph.ts`:

```typescript
interface DependencyGraph {
    nodes: Map<string, GraphNode>;
    edges: Map<string, Set<string>>;
    reverseEdges: Map<string, Set<string>>;
}

interface GraphNode {
    filePath: string;
    imports: string[];
    exports: string[];
    classes: ClassInfo[];
    functions: FunctionInfo[];
}
```

#### Graph Building Algorithm

1. **Node Creation**: Each TypeScript file becomes a graph node
2. **Edge Creation**: Import statements create directed edges between nodes
3. **Reverse Index**: Maintain reverse edges for efficient reverse dependency lookup
4. **Metadata Extraction**: Collect classes, functions, and other code elements

### 4. Class Information Extraction

The `src/metrics/extraction/extract-class-info.ts` module analyzes TypeScript classes to extract structural information:

#### Analyzed Elements

- **Methods**: Public, private, static methods with complexity metrics
- **Properties**: Field declarations and their access modifiers
- **Inheritance**: Base classes and implemented interfaces
- **Dependencies**: Classes referenced within the class body

#### AST Analysis for Classes

```typescript
function analyzeClassDeclaration(node: ts.ClassDeclaration): ClassInfo {
    const methods = node.members
        .filter(ts.isMethodDeclaration)
        .map(analyzeMethod);
    
    const properties = node.members
        .filter(ts.isPropertyDeclaration)
        .map(analyzeProperty);
    
    const heritage = node.heritageClauses?.map(analyzeHeritage) || [];
    
    return {
        name: node.name?.text || 'Anonymous',
        methods,
        properties,
        heritage,
        sourceFile: node.getSourceFile().fileName
    };
}
```

### 5. Cycle Detection Algorithm

ArchUnitTS implements efficient cycle detection using **Tarjan's Strongly Connected Components** algorithm:

#### Algorithm Overview

1. **DFS Traversal**: Perform depth-first search on the dependency graph
2. **Stack Tracking**: Maintain a stack of currently visited nodes
3. **Low-link Values**: Track the lowest node reachable from each node
4. **SCC Identification**: Nodes with the same low-link value form a cycle

```typescript
function findStronglyConnectedComponents(graph: DependencyGraph): string[][] {
    const index = new Map<string, number>();
    const lowLink = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const sccs: string[][] = [];
    let currentIndex = 0;
    
    function strongConnect(node: string) {
        index.set(node, currentIndex);
        lowLink.set(node, currentIndex);
        currentIndex++;
        stack.push(node);
        onStack.add(node);
        
        // Visit all dependencies
        for (const dependency of graph.edges.get(node) || []) {
            if (!index.has(dependency)) {
                strongConnect(dependency);
                lowLink.set(node, Math.min(lowLink.get(node)!, lowLink.get(dependency)!));
            } else if (onStack.has(dependency)) {
                lowLink.set(node, Math.min(lowLink.get(node)!, index.get(dependency)!));
            }
        }
        
        // If node is a root of SCC, pop the stack
        if (lowLink.get(node) === index.get(node)) {
            const scc: string[] = [];
            let w: string;
            do {
                w = stack.pop()!;
                onStack.delete(w);
                scc.push(w);
            } while (w !== node);
            sccs.push(scc);
        }
    }
    
    // Run algorithm on all unvisited nodes
    for (const node of graph.nodes.keys()) {
        if (!index.has(node)) {
            strongConnect(node);
        }
    }
    
    return sccs.filter(scc => scc.length > 1); // Only return actual cycles
}
```

### 6. Rule Engine and Validation

The rule engine in `src/files/fluentapi/files.ts` provides a fluent API for defining architectural constraints:

#### Rule Definition Architecture

```typescript
interface ArchRule {
    description: string;
    validate(graph: DependencyGraph): RuleViolation[];
}

class DependencyRule implements ArchRule {
    constructor(
        private sourcePattern: FilePattern,
        private targetPattern: FilePattern,
        private shouldDepend: boolean
    ) {}
    
    validate(graph: DependencyGraph): RuleViolation[] {
        const violations: RuleViolation[] = [];
        
        for (const [sourceFile, dependencies] of graph.edges) {
            if (this.sourcePattern.matches(sourceFile)) {
                for (const dependency of dependencies) {
                    const shouldMatch = this.targetPattern.matches(dependency);
                    const actuallyDepends = true; // Already in dependencies
                    
                    if (this.shouldDepend !== shouldMatch && actuallyDepends) {
                        violations.push({
                            rule: this.description,
                            sourceFile,
                            targetFile: dependency,
                            message: `${sourceFile} should ${this.shouldDepend ? '' : 'not '}depend on ${dependency}`
                        });
                    }
                }
            }
        }
        
        return violations;
    }
}
```

#### Pattern Matching

ArchUnitTS supports sophisticated file pattern matching:

- **Glob Patterns**: `**/*.service.ts`, `src/controllers/**`
- **Regular Expressions**: `/.*\.test\.ts$/`
- **Layer Definitions**: Named architectural layers with custom rules

### 7. Metrics Collection and Analysis

The metrics system analyzes code quality indicators:

#### Supported Metrics

1. **Lines of Code (LOC)**: Physical and logical line counts
2. **Cyclomatic Complexity**: Measure of code complexity
3. **LCOM (Lack of Cohesion of Methods)**: Class cohesion metric
4. **Dependency Counts**: Number of incoming/outgoing dependencies
5. **Afferent/Efferent Coupling**: Package-level coupling metrics

#### Complexity Calculation

```typescript
function calculateCyclomaticComplexity(node: ts.Node): number {
    let complexity = 1; // Base complexity
    
    function visit(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.IfStatement:
            case ts.SyntaxKind.WhileStatement:
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForInStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.ConditionalExpression:
            case ts.SyntaxKind.SwitchStatement:
                complexity++;
                break;
            case ts.SyntaxKind.CaseClause:
                complexity++;
                break;
            case ts.SyntaxKind.CatchClause:
                complexity++;
                break;
        }
        
        ts.forEachChild(node, visit);
    }
    
    visit(node);
    return complexity;
}
```

### 8. Testing Framework Integration

ArchUnitTS provides seamless integration with popular testing frameworks through custom matchers:

#### Jest Integration

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
            message: () => violations.length > 0 
                ? `Architecture rule failed:\n${violations.map(v => v.message).join('\n')}`
                : 'Architecture rule passed'
        };
    }
});
```

## 🔄 Execution Flow

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

## 🚀 Performance Optimizations

ArchUnitTS implements several optimizations for large codebases:

### 1. Incremental Analysis

- **File Watching**: Monitor file changes and re-analyze only affected files
- **Dependency Tracking**: Understand which files affect which analysis results
- **Smart Caching**: Cache AST parsing and graph extraction results

### 2. Parallel Processing

- **Worker Threads**: Analyze multiple files in parallel where possible
- **Streaming**: Process files as they're discovered rather than waiting for all
- **Memory Management**: Efficient memory usage for large projects

### 3. Graph Optimizations

- **Lazy Loading**: Load graph sections only when needed
- **Compression**: Compact representation of large dependency graphs
- **Indexing**: Fast lookup structures for common queries

## 🛠️ Extending ArchUnitTS

### Adding Custom Rules

```typescript
import { ArchRule, DependencyGraph, RuleViolation } from 'archunit';

class CustomNamingRule implements ArchRule {
    description = 'Classes should follow naming conventions';
    
    async validate(graph: DependencyGraph): Promise<RuleViolation[]> {
        const violations: RuleViolation[] = [];
        
        for (const node of graph.nodes.values()) {
            for (const classInfo of node.classes) {
                if (!classInfo.name.endsWith('Service') && isInServiceLayer(node.filePath)) {
                    violations.push({
                        rule: this.description,
                        sourceFile: node.filePath,
                        message: `Class ${classInfo.name} should end with 'Service'`
                    });
                }
            }
        }
        
        return violations;
    }
}
```

### Custom Metrics

```typescript
import { MetricCalculator, ClassInfo } from 'archunit';

class CustomComplexityMetric implements MetricCalculator {
    name = 'Custom Complexity';
    
    calculate(classInfo: ClassInfo): number {
        // Your custom metric calculation
        return classInfo.methods.length * classInfo.properties.length;
    }
}
```

## 🔧 Configuration and Tuning

### TypeScript Compiler Options

ArchUnitTS respects your `tsconfig.json` but you can override specific options:

```typescript
const files = projectFiles()
    .withCompilerOptions({
        strict: true,
        skipLibCheck: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs
    })
    .inFolder('src');
```

### Analysis Options

```typescript
const rule = projectFiles()
    .withAnalysisOptions({
        maxDepth: 10,              // Limit dependency traversal depth
        includeExternalDeps: false, // Exclude npm packages from analysis
        cacheResults: true,         // Enable result caching
        parallelAnalysis: true      // Use worker threads
    })
    .should()
    .haveNoCycles();
```

## 📊 Debugging and Troubleshooting

### Verbose Logging

```typescript
import { setLogLevel, LogLevel } from 'archunit';

setLogLevel(LogLevel.DEBUG);

// Now you'll see detailed analysis information
```

### Graph Visualization

```typescript
const graph = await extractDependencyGraph(['src/**/*.ts']);
await graph.exportAsDot('dependencies.dot');
await graph.exportAsHTML('dependencies.html');
```

### Performance Profiling

```typescript
import { enableProfiling, getProfilingResults } from 'archunit';

enableProfiling();

// Run your rules
await expect(rule).toPassAsync();

const results = getProfilingResults();
console.log('Analysis took:', results.totalTime);
console.log('Breakdown:', results.breakdown);
```

## 🤝 Contributing to the Core

If you want to contribute to ArchUnitTS itself:

### 1. Core Architecture Guidelines

- **Single Responsibility**: Each module should have one clear purpose
- **Immutability**: Prefer immutable data structures where possible
- **Error Handling**: Comprehensive error messages with context
- **Performance**: Always consider impact on large codebases

### 2. Adding New Features

1. **Start with the API**: Design the user-facing API first
2. **Implement Core Logic**: Add the analysis logic in appropriate modules
3. **Add Tests**: Comprehensive unit and integration tests
4. **Update Documentation**: Both code comments and user documentation

### 3. Code Style

- **TypeScript First**: Full type safety, no `any` types
- **Functional Style**: Prefer pure functions and immutable operations
- **Clear Naming**: Self-documenting code with descriptive names
- **Comments**: Focus on "why" not "what"

---

This technical deep dive should give you a comprehensive understanding of ArchUnitTS internals. The library combines sophisticated static analysis techniques with an intuitive API to make architectural testing accessible and powerful.

Whether you're debugging issues, extending functionality, or just curious about the implementation, this foundation will help you navigate the codebase effectively. The modular architecture makes it relatively straightforward to understand and modify individual components while maintaining the overall system integrity.

For more specific implementation details, dive into the source code - it's well-documented and follows consistent patterns throughout! 🚀