# .archignore Support

The `.archignore` file allows you to exclude certain files and directories from ArchUnit analysis, similar to `.gitignore`.

## Overview

When running architecture tests, you may want to exclude:
- Generated code (GraphQL schemas, protobuf files, etc.)
- Build artifacts (dist/, build/)
- Test fixtures and mocks
- Migration scripts
- Third-party code

The `.archignore` file lets you specify which files to skip.

## Usage

Create a `.archignore` file in your project root:

```
# .archignore
node_modules/
dist/
build/
**/*.generated.ts
test/fixtures/**
migrations/
src/**/*.mock.ts
```

Then use it in your tests:

```typescript
import { ArchIgnoreParser, ArchIgnoreFilter } from 'archunit';

// The parser automatically finds and uses .archignore
// Files matching the patterns will be excluded from analysis
const rule = files().inFolder('src/**').should().haveNoCycles();
await expect(rule).toPassAsync();
```

## Pattern Syntax

Patterns follow `.gitignore` syntax:

| Pattern | Meaning |
|---------|---------|
| `node_modules/` | Ignore directory and all contents |
| `*.generated.ts` | Ignore all files matching pattern |
| `src/generated/**` | Ignore nested directories |
| `!important.ts` | Negation - exception to ignore rules |
| `test/fixtures/**` | Ignore with path |

### Examples

```
# Directories
dist/
build/
coverage/

# File patterns
*.generated.ts
*.mock.ts
*.spec.ts

# Nested paths
src/generated/**
test/fixtures/**

# Exceptions (negate with !)
test/**
!test/fixtures/**  # But don't ignore test fixtures
```

## How It Works

1. `.archignore` is automatically loaded from project root
2. Patterns are converted to glob format
3. Graph edges are filtered to exclude matching files
4. Both source and target of edges are checked

## API

### ArchIgnoreParser

```typescript
import { ArchIgnoreParser } from 'archunit';

const parser = ArchIgnoreParser.fromFile('.archignore');

// Check if file should be ignored
parser.shouldIgnore('dist/index.js'); // true
parser.shouldIgnore('src/index.ts'); // false
```

### ArchIgnoreFilter

```typescript
import { ArchIgnoreFilter, ArchIgnoreParser } from 'archunit';

const parser = ArchIgnoreParser.fromFile('.archignore');
const filter = new ArchIgnoreFilter(parser);

// Filter graph
const filteredGraph = filter.filterGraph(graph);

// Get statistics
const ignoredCount = filter.getIgnoredFileCount(graph);
const ignoredFiles = filter.getIgnoredFiles(graph);
```

## Performance Note

Using `.archignore` can improve performance by reducing the number of files analyzed, especially in large projects with significant build artifacts or node_modules dependencies.

## Comparison with .gitignore

While `.archignore` uses similar syntax to `.gitignore`, they serve different purposes:

- **`.gitignore`**: Controls what gets committed to version control
- **`.archignore`**: Controls what gets analyzed by ArchUnit tests

You may have different exclusions in each file.
