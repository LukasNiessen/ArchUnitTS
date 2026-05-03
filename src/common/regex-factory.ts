import { minimatch } from 'minimatch';
import {
	Filter,
	Pattern,
	PatternList,
	PatternOptions,
	PatternTarget,
	TargetedPatternExclusions,
} from './type';

/**
 * Helper function to extract readable pattern strings from regex
 * This function formats regex patterns for display purposes by removing excessive escaping
 */
export function getPatternString(pattern: RegExp): string {
	// For display purposes, return the original regex source without double escaping
	const source = pattern.source;
	// Remove excessive escaping for common cases
	const result = source.replace(/\\\\(.)/g, '\\$1');
	return result;
}

export class RegexFactory {
	private static escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //.replace('/', '\\/');
	}

	//private static containsGlobSyntax(inp: string): boolean {
	//	return inp.includes('*') || inp.includes('?');
	//}

	private static globToRegExp = (pattern: string): RegExp => {
		const ret = minimatch.makeRe(pattern);
		if (typeof ret === 'boolean') {
			throw new Error('invalid pattern');
		}
		return ret;
	};

	private static patternToRegExp(pattern: Pattern): RegExp {
		if (typeof pattern === 'string') {
			return this.globToRegExp(pattern);
		}
		return pattern;
	}

	private static toPatternArray(patterns?: PatternList): Pattern[] {
		if (patterns === undefined) {
			return [];
		}
		return Array.isArray(patterns) ? patterns : [patterns];
	}

	private static isTargetedExclusion(
		exclusion: PatternOptions['except']
	): exclusion is TargetedPatternExclusions {
		return (
			typeof exclusion === 'object' &&
			exclusion !== null &&
			!Array.isArray(exclusion) &&
			!(exclusion instanceof RegExp)
		);
	}

	private static createSimpleFilter(pattern: Pattern, target: PatternTarget): Filter {
		return {
			regExp: this.patternToRegExp(pattern),
			options: {
				target,
			},
		};
	}

	private static createFilter(
		pattern: Pattern,
		target: PatternTarget,
		options?: PatternOptions
	): Filter {
		const exclusions = this.createExclusionFilters(target, options?.except);
		const filter = this.createSimpleFilter(pattern, target);

		if (exclusions.length > 0) {
			filter.exclusions = exclusions;
		}

		return filter;
	}

	private static createExclusionFilters(
		parentTarget: PatternTarget,
		exclusion: PatternOptions['except']
	): Filter[] {
		if (exclusion === undefined) {
			return [];
		}

		if (this.isTargetedExclusion(exclusion)) {
			return [
				...this.toPatternArray(exclusion.inPath).map((pattern) =>
					this.createSimpleFilter(pattern, 'path')
				),
				...this.toPatternArray(exclusion.inFolder).map((pattern) =>
					this.createSimpleFilter(pattern, 'path-no-filename')
				),
				...this.toPatternArray(exclusion.withName).map((pattern) =>
					this.createSimpleFilter(pattern, 'filename')
				),
				...this.toPatternArray(exclusion.forClassesMatching).map((pattern) =>
					this.createSimpleFilter(pattern, 'classname')
				),
			];
		}

		const targets = this.getDefaultExclusionTargets(parentTarget);
		return this.toPatternArray(exclusion).flatMap((pattern) =>
			targets.map((target) => this.createSimpleFilter(pattern, target))
		);
	}

	private static getDefaultExclusionTargets(
		parentTarget: PatternTarget
	): PatternTarget[] {
		switch (parentTarget) {
			case 'filename':
				return ['filename'];
			case 'path':
				return ['path', 'filename'];
			case 'path-no-filename':
				return ['path', 'path-no-filename', 'filename'];
			case 'classname':
				return ['classname'];
			default:
				return [parentTarget];
		}
	}

	public static fileNameMatcher(name: Pattern, options?: PatternOptions): Filter {
		return this.createFilter(name, 'filename', options);
	}

	public static classNameMatcher(name: Pattern, options?: PatternOptions): Filter {
		return this.createFilter(name, 'classname', options);
	}

	public static folderMatcher(folder: Pattern, options?: PatternOptions): Filter {
		return this.createFilter(folder, 'path-no-filename', options);
	}

	public static pathMatcher(path: Pattern, options?: PatternOptions): Filter {
		return this.createFilter(path, 'path', options);
	}

	/**
	 * Creates a filter for exact file path matching
	 * @param filePath Exact file path to match
	 */
	public static exactFileMatcher(filePath: string): Filter {
		const escapedPath = this.escapeRegex(filePath.replace(/\\/g, '/'));
		const regExp = new RegExp(`^${escapedPath}$`);

		return {
			regExp,
			options: {
				target: 'path',
			},
		};
	}
}
