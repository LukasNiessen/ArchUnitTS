export const matchingAllPatterns = (
	input: string,
	patterns: Array<string | RegExp>
): boolean => {
	const matches = patterns
		.map((pattern) => input.match(pattern))
		.map((match) => match !== null && match.length > 0);
	return matches.indexOf(false) === -1;
};
