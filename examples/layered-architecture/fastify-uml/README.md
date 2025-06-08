# Layered Architecture - Fastify Backend with UML Validation

This example demonstrates how to enforce layered architecture patterns in a Fastify.js backend application using ArchUnitTS with UML diagram validation.

_Note: This is a brief and incomplete introduction to layered architecture. The focus here is on showing how to test architectural rules with ArchUnitTS._

## Architecture Overview

Layered architecture organizes code into horizontal layers where upper layers can depend on lower layers, but not vice versa:

```
src/
├── api/           # API layer (routes, controllers)
├── application/   # Application services
├── domain/        # Domain models
├── infrastructure/ # Data access, external services
```

## Essential Architecture Tests

````typescript
import { projectSlices, projectFiles } from 'archunit';

describe('Layered Architecture Tests', () => {
  it('should adhere to UML layer diagram', async () => {
    const diagram = `
@startuml
component [api]
component [application]
component [domain]
component [infrastructure]

[api] --> [application]
[application] --> [domain]
[infrastructure] --> [domain]
@enduml`;

    const rule = projectSlices()
      .definedBy('src/(**)')
      .should()
      .adhereToDiagram(diagram);

    await expect(rule).toPassAsync();
  });

  it('should enforce layer dependencies', async () => {
    const rule = projectFiles()
      .inFolder('src/api/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');

    await expect(rule).toPassAsync();
  });

  it('should have no circular dependencies', async () => {
    const rule = projectFiles()
      .inFolder('src/**')
      .should()
      .haveNoCycles();

    ```
````
