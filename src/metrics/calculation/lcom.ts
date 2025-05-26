import { ClassInfo, Metric } from '../extraction/interface';

/**
 * LCOM (Lack of Cohesion of Methods) metrics interface
 */
export interface LCOMMetric extends Metric {
	name: string;
	calculate(classInfo: ClassInfo): number;
	description: string;
}
/**
 * LCOM96a (Lack of Cohesion of Methods, Handerson et al., 1996)
 *
 * Formula: LCOM96a = (1/(1-m)) * ((1/a) * Σ(μ(A)) - m) for all attributes A
 *
 * Where:
 * - a is the number of attributes (fields) in the class
 * - m is the number of attributes (fields) in the class
 * - μ(A) is the number of methods that access an attribute (field) A
 * - The formula measures how methods are connected through attributes
 *
 * Returns a value >= 0:
 * - 0: perfect cohesion
 * - Higher values: increasing lack of cohesion
 */
export class LCOM96a implements LCOMMetric {
	name = 'LCOM96a';
	description =
		'Lack of Cohesion of Methods (Handerson et al., 1996a) - Measures attribute sharing among methods';

	calculate(classInfo: ClassInfo): number {
		const m = classInfo.methods.length;
		const a = classInfo.fields.length;

		// If there are no attributes, cohesion is undefined/perfect
		if (a === 0) {
			return 0;
		}

		const summands: number[] = [];
		classInfo.fields.forEach((field) => {
			const mu = field.accessedBy.length;
			summands.push(mu / a);
		});

		const sum = summands.reduce((partialSum, summand) => partialSum + summand, 0);

		return (1 / (1 - m)) * (sum - m);
	}
}

/**
 * LCOM96b (Lack of Cohesion of Methods, Handerson et al., 1996)
 *
 * Formula: LCOM96b = (1/a) * Σ((1/m) * (m - μ(A))) for all attributes A
 *
 * Where:
 * - m is the number of methods in the class
 * - a is the number of attributes (fields) in the class
 * - μ(A) is the number of methods that access an attribute (field) A
 * - The formula measures how methods are connected through attributes
 *
 * Returns a value between 0 and 1:
 * - 0: perfect cohesion (all methods access all attributes)
 * - 1: complete lack of cohesion (each method accesses its own attribute)
 */
export class LCOM96b implements LCOMMetric {
	name = 'LCOM96b';
	description =
		'Lack of Cohesion of Methods (Handerson et al., 1996) - Ranges from 0 (high cohesion) to 1 (low cohesion)';

	calculate(classInfo: ClassInfo): number {
		const m = classInfo.methods.length;
		const a = classInfo.fields.length;

		// If there are no methods or only one method, cohesion is perfect
		if (m <= 1 || a === 0) {
			return 0;
		}

		const summands: number[] = [];
		classInfo.fields.forEach((field) => {
			const mu = field.accessedBy.length;
			const s = (1 / m) * (m - mu);
			summands.push(s);
		});

		const sum = summands.reduce((partialSum, summand) => partialSum + summand, 0);

		return (1 / a) * sum;
	}
}

/**
 * LCOM1 (Chidamber & Kemerer, 1991)
 *
 * Formula: LCOM1 = |P| - |Q|, where P > Q, otherwise 0
 *
 * Where:
 * - P is the set of method pairs that do not share instance variables
 * - Q is the set of method pairs that share at least one instance variable
 * - If P <= Q, then LCOM1 = 0
 *
 * Returns a value >= 0:
 * - 0: good cohesion
 * - Higher values: lack of cohesion
 */
export class LCOM1 implements LCOMMetric {
	name = 'LCOM1';
	description =
		'Lack of Cohesion of Methods (Chidamber & Kemerer, 1991) - Difference between non-sharing and sharing method pairs';

	calculate(classInfo: ClassInfo): number {
		const methods = classInfo.methods;
		const m = methods.length;

		if (m <= 1) {
			return 0;
		}

		let P = 0; // pairs that don't share variables
		let Q = 0; // pairs that share at least one variable

		// Compare each pair of methods
		for (let i = 0; i < m; i++) {
			for (let j = i + 1; j < m; j++) {
				const method1Fields = new Set(methods[i].accessedFields);
				const method2Fields = new Set(methods[j].accessedFields);

				// Check if methods share any fields
				const hasSharedField = [...method1Fields].some((field) =>
					method2Fields.has(field)
				);

				if (hasSharedField) {
					Q++;
				} else {
					P++;
				}
			}
		}

		return Math.max(0, P - Q);
	}
}

/**
 * LCOM2 (Chidamber & Kemerer, 1994 - revised)
 *
 * Formula: LCOM2 = 1 - (Σ(MF) / (M * F))
 *
 * Where:
 * - M is the number of methods in the class
 * - F is the number of fields in the class
 * - MF is the number of methods that access each field
 * - Σ(MF) is the sum of MF over all fields
 *
 * Returns a value between 0 and 1:
 * - 0: perfect cohesion (all methods access all fields)
 * - 1: no cohesion (no method accesses any field)
 */
export class LCOM2 implements LCOMMetric {
	name = 'LCOM2';
	description =
		'Lack of Cohesion of Methods (Chidamber & Kemerer, 1994) - Normalized measure of method-field relationships';

	calculate(classInfo: ClassInfo): number {
		const M = classInfo.methods.length;
		const F = classInfo.fields.length;

		if (M === 0 || F === 0) {
			return 0;
		}

		// Sum of methods accessing each field
		const sumMF = classInfo.fields.reduce(
			(sum, field) => sum + field.accessedBy.length,
			0
		);

		return 1 - sumMF / (M * F);
	}
}

/**
 * LCOM3 (Li & Henry, 1993)
 *
 * Formula: LCOM3 = (M - Σ(MF)/F) / (M - 1)
 *
 * Where:
 * - M is the number of methods in the class
 * - F is the number of fields in the class
 * - MF is the number of methods that access each field
 * - Σ(MF) is the sum of MF over all fields
 *
 * Returns a value between 0 and 1:
 * - 0: perfect cohesion
 * - 1: lack of cohesion
 */
export class LCOM3 implements LCOMMetric {
	name = 'LCOM3';
	description =
		'Lack of Cohesion of Methods (Li & Henry, 1993) - Normalized cohesion measure';

	calculate(classInfo: ClassInfo): number {
		const M = classInfo.methods.length;
		const F = classInfo.fields.length;

		if (M <= 1 || F === 0) {
			return 0;
		}

		// Sum of methods accessing each field
		const sumMF = classInfo.fields.reduce(
			(sum, field) => sum + field.accessedBy.length,
			0
		);

		return (M - sumMF / F) / (M - 1);
	}
}

/**
 * LCOM4 (Hitz & Montazeri, 1995)
 *
 * Formula: LCOM4 = number of connected components in the method-field graph
 *
 * Where:
 * - A connected component is a maximal set of methods connected through shared fields
 * - Methods are connected if they access the same field or are transitively connected
 *
 * Returns a value >= 1:
 * - 1: perfect cohesion (all methods are connected)
 * - Higher values: increasing lack of cohesion
 */
export class LCOM4 implements LCOMMetric {
	name = 'LCOM4';
	description =
		'Lack of Cohesion of Methods (Hitz & Montazeri, 1995) - Number of connected components';

	calculate(classInfo: ClassInfo): number {
		const methods = classInfo.methods;
		const m = methods.length;

		if (m <= 1) {
			return 1;
		}

		// Create adjacency list for method connectivity
		const methodConnections = new Map<number, Set<number>>();
		for (let i = 0; i < m; i++) {
			methodConnections.set(i, new Set<number>());
		}

		// Connect methods that share at least one field
		for (let i = 0; i < m; i++) {
			for (let j = i + 1; j < m; j++) {
				const method1Fields = new Set(methods[i].accessedFields);
				const method2Fields = new Set(methods[j].accessedFields);

				// Check if methods share any fields
				const hasSharedField = [...method1Fields].some((field) =>
					method2Fields.has(field)
				);

				if (hasSharedField) {
					methodConnections.get(i)!.add(j);
					methodConnections.get(j)!.add(i);
				}
			}
		}

		// Count connected components using DFS
		const visited = new Set<number>();
		let components = 0;

		for (let i = 0; i < m; i++) {
			if (!visited.has(i)) {
				components++;
				// DFS to mark all connected methods
				const stack = [i];
				while (stack.length > 0) {
					const current = stack.pop()!;
					if (!visited.has(current)) {
						visited.add(current);
						for (const neighbor of methodConnections.get(current)!) {
							if (!visited.has(neighbor)) {
								stack.push(neighbor);
							}
						}
					}
				}
			}
		}

		return components;
	}
}

/**
 * LCOM5 (Henderson-Sellers, 1996)
 *
 * Formula: LCOM5 = (a - μΣ(mA)) / (a - μ)
 *
 * Where:
 * - a is the number of attributes (fields)
 * - μ is the number of methods
 * - mA is the number of methods accessing attribute A
 * - Σ(mA) is the sum over all attributes
 *
 * Returns a value between 0 and 1:
 * - 0: perfect cohesion
 * - 1: lack of cohesion
 */
export class LCOM5 implements LCOMMetric {
	name = 'LCOM5';
	description =
		'Lack of Cohesion of Methods (Henderson-Sellers, 1996) - Normalized attribute access measure';

	calculate(classInfo: ClassInfo): number {
		const mu = classInfo.methods.length;
		const a = classInfo.fields.length;

		if (a === 0 || mu <= 1) {
			return 0;
		}

		// Sum of methods accessing each attribute
		const sumMA = classInfo.fields.reduce(
			(sum, field) => sum + field.accessedBy.length,
			0
		);

		const denominator = a - mu;
		if (denominator === 0) {
			return 0;
		}

		return (a - sumMA / mu) / denominator;
	}
}

/**
 * LCOM* (Fernandez & Pena, 2006) - also known as LCOM-star
 *
 * Formula: LCOM* = (number of method pairs without shared attributes) / (total method pairs)
 *
 * Where:
 * - Method pairs are counted once (not twice)
 * - Shared attributes means both methods access at least one common field
 *
 * Returns a value between 0 and 1:
 * - 0: perfect cohesion (all method pairs share attributes)
 * - 1: no cohesion (no method pairs share attributes)
 */
export class LCOMStar implements LCOMMetric {
	name = 'LCOM*';
	description =
		'Lack of Cohesion of Methods Star (Fernandez & Pena, 2006) - Ratio of non-sharing method pairs';

	calculate(classInfo: ClassInfo): number {
		const methods = classInfo.methods;
		const m = methods.length;

		if (m <= 1) {
			return 0;
		}

		let nonSharingPairs = 0;
		let totalPairs = 0;

		// Compare each pair of methods
		for (let i = 0; i < m; i++) {
			for (let j = i + 1; j < m; j++) {
				totalPairs++;

				const method1Fields = new Set(methods[i].accessedFields);
				const method2Fields = new Set(methods[j].accessedFields);

				// Check if methods share any fields
				const hasSharedField = [...method1Fields].some((field) =>
					method2Fields.has(field)
				);

				if (!hasSharedField) {
					nonSharingPairs++;
				}
			}
		}

		return totalPairs === 0 ? 0 : nonSharingPairs / totalPairs;
	}
}
