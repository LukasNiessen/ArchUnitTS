import { minimatch } from 'minimatch';
import { Filter, Pattern } from './type';

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

	public static fileNameMatcher(name: Pattern): Filter {
		let regExp;
		if (typeof name === 'string') {
			regExp = this.globToRegExp(name);
		} else {
			regExp = name;
		}

		return {
			regExp,
			options: {
				target: 'filename',
			},
		};
	}

	public static classNameMatcher(name: Pattern): Filter {
		let regExp;
		if (typeof name === 'string') {
			regExp = this.globToRegExp(name);
		} else {
			regExp = name;
		}

		return {
			regExp,
			options: {
				target: 'classname',
			},
		};
	}

	public static folderMatcher(folder: Pattern): Filter {
		let regExp;
		if (typeof folder === 'string') {
			regExp = this.globToRegExp(folder);
		} else {
			regExp = folder;
		}
		return {
			regExp,
			options: {
				target: 'path-no-filename',
			},
		};
	}

	public static pathMatcher(path: Pattern): Filter {
		let regExp;
		if (typeof path === 'string') {
			regExp = this.globToRegExp(path);
		} else {
			regExp = path;
		}
		return {
			regExp,
			options: {
				target: 'path',
			},
		};
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
