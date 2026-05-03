export type MatchingType = 'exact' | 'partial';
export type PatternTarget = 'filename' | 'path' | 'path-no-filename' | 'classname';

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
	target?: PatternTarget;

	/**
	 * Whether to require the pattern to match the entire string or allow partial matches
	 * - 'exact': Pattern must match the entire target string
	 * - 'partial': Pattern can match any part of the target string
	 * @default 'exact'
	 */
	matching?: MatchingType;
}

export type Pattern = string | RegExp;

export type PatternList = Pattern | Pattern[];

export type TargetedPatternExclusions = {
	inPath?: PatternList;
	inFolder?: PatternList;
	withName?: PatternList;
	forClassesMatching?: PatternList;
};

export type PatternExclusion = PatternList | TargetedPatternExclusions;

export type PatternOptions = {
	/**
	 * Exclude files/classes from this matcher. Plain strings and regexes are
	 * interpreted ergonomically for the parent matcher; targeted exclusions can
	 * be used when the matching target should be explicit.
	 */
	except?: PatternExclusion;
};

export type Filter = {
	regExp: RegExp;
	options: PatternMatchingOptions;
	exclusions?: Filter[];
};
