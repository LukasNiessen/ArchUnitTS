# Angular Frontend Architecture

> **Note**: This is a basic example to demonstrate ArchUnitTS capabilities. Real-world Angular applications may have more complex architectural patterns and requirements.

This example demonstrates enforcing component isolation, dependency rules, and code quality metrics in Angular applications using ArchUnitTS.

```typescript
describe('Angular Architecture Rules', () => {
  it('components should not depend on HTTP services', async () => {
    const rule = projectFiles()
      .inFolder('src/app/components/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/app/services/**')
      .withName('*.http.ts');

    await expect(rule).toPassAsync();
  });

  it('components should not dispatch to NgRx state', async () => {
    const isStateDispatched = (file: FileInfo) =>
      /(?:store|ngrxStore)\.dispatch\(/.test(file.content);

    const rule = projectFiles()
      .withName('*.component.ts')
      .shouldNot()
      .adhereTo(isStateDispatched, 'Components should not dispatch to NgRx');

    await expect(rule).toPassAsync();
  });

  it('core module should not depend on shared module', async () => {
    const rule = projectFiles()
      .inFolder('src/app/core/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/app/shared/**');

    await expect(rule).toPassAsync();
  });

  it('should not contain overly large files', async () => {
    const rule = metrics()
      .inFolder('src/app/**')
      .count()
      .linesOfCode()
      .shouldBeBelow(1500);

    await expect(rule).toPassAsync();
  });

  it('should limit methods per component class', async () => {
    const rule = metrics()
      .inFolder('src/app/components/**')
      .withName('*.component.ts')
      .count()
      .methodCount()
      .shouldBeBelow(15);

    await expect(rule).toPassAsync();
  });

  it('should maintain reasonable class cohesion', async () => {
    const rule = metrics().inFolder('src/app/**').lcom().lcom96b().shouldBeBelow(0.8);
    await expect(rule).toPassAsync();
  });
});
```
