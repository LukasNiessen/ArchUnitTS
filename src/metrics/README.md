# Code Metrics in ArchUnitTS

This module provides support for analyzing and enforcing code metrics in your TypeScript/JavaScript projects.

## Supported Metrics

### LCOM (Lack of Cohesion of Methods)

The LCOM metrics measure how well the methods and fields of a class are connected, indicating the cohesion level of the class. Lower values indicate better cohesion.

#### LCOM96b (Handerson et al.)

The LCOM96b metric, proposed by Handerson et al. in 1996, is calculated as follows:

```
LCOM96b = (m - sum(μ(A))/m)/(1-1/m)
```

Where:

- `m` is the number of methods in the class
- `μ(A)` is the number of methods that access an attribute (field) A
- The formula measures how methods are connected through attributes

The result is a value between 0 and 1:

- 0: perfect cohesion (all methods access all attributes)
- 1: complete lack of cohesion (each method accesses its own attribute)

## Usage

### Testing for Cohesion

```typescript
import { metrics } from 'archunit';

it('classes have high cohesion', async () => {
	const violations = await metrics()
		.lcom()
		.lcom96b()
		.shouldHaveCohesionAbove(0.7) // LCOM should be less than 0.7 (higher cohesion)
		.check();

	expect(violations).toHaveLength(0);
});
```

### Adding to Jest

```typescript
expect(metrics().lcom().lcom96b().shouldHaveCohesionAbove(0.7)).toPassAsync();
```

## Integration with Architecture Rules

Code metrics can be combined with architectural rules to ensure not only structural compliance but also code quality:

```typescript
it('core domain has high cohesion', async () => {
	const violations = await metrics()
		.forClasses(/^Core\..*/) // Apply only to core domain classes
		.lcom()
		.lcom96b()
		.shouldHaveCohesionAbove(0.6)
		.check();

	expect(violations).toHaveLength(0);
});
```
