export const matchingAllPatterns = (
	input: string,
	patterns: Array<string | RegExp>
): boolean => {
	return patterns.every((pattern) => {
		if (typeof pattern === 'string') {
			const regex = new RegExp(pattern);
			return regex.test(input);
		}
		return pattern.test(input);
	});
};
