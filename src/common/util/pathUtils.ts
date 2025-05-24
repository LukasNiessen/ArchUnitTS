export const normalizeWindowsPaths = (input: string): string => {
	return input.replace(/\\/g, '/');
};
