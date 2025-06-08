# Fastify BackEnd using a UML Diagram

> **Note**: This is a basic example to demonstrate ArchUnitTS capabilities. Real-world layered applications may have more complex architectural patterns and requirements.

This example demonstrates enforcing layered architecture with UML diagram validation, dependency direction rules, and layer isolation in Fastify applications using ArchUnitTS.

```typescript
import { projectFiles, projectSlices, metrics } from 'archunit';

describe('Fastify Layered Architecture Rules', () => {
  it('presentation layer should not depend on persistence', async () => {
    const rule = projectFiles()
      .inFolder('src/presentation/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/persistence/**');
    await expect(rule).toPassAsync();
  });

  it('business layer should not depend on presentation', async () => {
    const rule = projectFiles()
      .inFolder('src/business/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/presentation/**');
    await expect(rule).toPassAsync();
  });

  it('should adhere to UML layer diagram', async () => {
    const diagram = `
@startuml
component [presentation]
component [business]
component [persistence]

[presentation] --> [business]
[business] --> [persistence]
@enduml`;

    const rule = projectSlices().definedBy('src/(**)').should().adhereToDiagram(diagram);
    await expect(rule).toPassAsync();
  });

  it('should limit controller complexity', async () => {
    const rule = metrics()
      .inFolder('src/presentation/controllers/**')
      .count()
      .methodCount()
      .shouldBeBelow(10);
    await expect(rule).toPassAsync();
  });

  it('business logic should have high cohesion', async () => {
    const rule = metrics()
      .inFolder('src/business/**')
      .lcom()
      .lcom96b()
      .shouldBeBelow(0.6);
    await expect(rule).toPassAsync();
  });

  it('should maintain reasonable file sizes', async () => {
    const rule = metrics().inFolder('src/**').count().linesOfCode().shouldBeBelow(1200);
    await expect(rule).toPassAsync();
  });
});
```
