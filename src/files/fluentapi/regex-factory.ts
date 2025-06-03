import { minimatch } from 'minimatch';
import { Filter, Pattern } from '../../common/type';

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
}
