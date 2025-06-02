import { Filter, MatchingType, Pattern } from '../../common/type';

export class RegexFactory {
	private static escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //.replace('/', '\\/');
	}

	private static containsGlobSyntax(inp: string): boolean {
		return inp.includes('*') || inp.includes('?');
	}

	/**
	 * Convert glob pattern (with *, **, and ?) to regex pattern
	 */
	private static convertGlobToRegex(pattern: string): string {
		// Escape all special regex characters except * and ?
		let regexPattern = this.escapeRegex(pattern);

		// Convert glob wildcards to regex - handle ** first, then *
		regexPattern = regexPattern.replace(/\*\*/g, '.*'); // ** matches any number of directories/characters
		regexPattern = regexPattern.replace(/\*/g, '[^/\\\\]*'); // * matches any characters except path separators
		regexPattern = regexPattern.replace(/\?/g, '.'); // ? matches single character

		return regexPattern;
	}

	public static fileNameMatcher(name: Pattern, matchingType: MatchingType): Filter {
		let regExp;
		if (typeof name === 'string') {
			const pattern = this.convertGlobToRegex(name);
			regExp = new RegExp(`.*${pattern}$`);
		} else {
			regExp = name;
		}
		return {
			regExp,
			options: {
				target: 'filename',
				matching: matchingType,
			},
		};
	}

	public static folderMatcher(folder: Pattern, matchingType: MatchingType): Filter {
		let regExp;
		if (typeof folder === 'string') {
			const pattern = this.convertGlobToRegex(folder);
			regExp = new RegExp(`(^|.*/)${pattern}/.*`);
		} else {
			regExp = folder;
		}
		return {
			regExp,
			options: {
				target: 'path-no-filename',
				matching: matchingType,
			},
		};
	}

	public static pathMatcher(path: Pattern, matchingType: MatchingType): Filter {
		let regExp;
		if (typeof path === 'string') {
			const pattern = this.convertGlobToRegex(path);
			regExp = new RegExp(`^${pattern}/.*`);
		} else {
			regExp = path;
		}
		return {
			regExp,
			options: {
				target: 'path',
				matching: matchingType,
			},
		};
	}
}
