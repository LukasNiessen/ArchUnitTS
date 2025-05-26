import { ClassInfo } from '../extraction/extract-class-info';

/**
 * LCOM (Lack of Cohesion of Methods) metrics interface
 */
export interface LCOMMetric {
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
