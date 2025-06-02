import { Pattern } from '../../files/assertion/pattern-matching';

export const matchingAllPatterns = (input: string, patterns: Array<Pattern>): boolean => {
	return patterns.every((pattern) => {
		if (typeof pattern === 'string') {
			const regex = new RegExp(pattern);
			return regex.test(input);
		}
		return pattern.test(input);
	});
};
