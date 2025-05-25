export const matchingAllPatterns = (
	input: string,
	patterns: Array<string | RegExp>
): boolean => {
	return patterns.every((pattern) => {
		if (typeof pattern === 'string') {
			return input.includes(pattern);
		}
		return pattern.test(input);
	});
};
