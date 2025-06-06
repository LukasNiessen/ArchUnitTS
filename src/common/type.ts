export type MatchingType = 'exact' | 'partial';

/**
 * Pattern matching configuration for file checks
 */
export interface PatternMatchingOptions {
	/**
	 * Whether to match against filename only or full relative path
	 * - 'filename': Only match against the filename (e.g., 'Service.ts' from 'src/services/Service.ts')
	 * - 'path': Match against the full relative path (e.g., 'src/services/Service.ts')
	 * @default 'filename'
	 */
	target?: 'filename' | 'path' | 'path-no-filename' | 'classname';

	/**
	 * Whether to require the pattern to match the entire string or allow partial matches
	 * - 'exact': Pattern must match the entire target string
	 * - 'partial': Pattern can match any part of the target string
	 * @default 'exact'
	 */
	matching?: MatchingType;
}

export type Pattern = string | RegExp;

export type Filter = {
	regExp: RegExp;
	options: PatternMatchingOptions;
};
