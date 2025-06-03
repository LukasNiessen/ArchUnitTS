import { Filter, MatchingType, Pattern } from '../../common/type';

export class RegexFactory {
	private static escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //.replace('/', '\\/');
	}

	private static containsGlobSyntax(inp: string): boolean {
		return inp.includes('*') || inp.includes('?');
	}

	/**
	 * Convert glob pattern to RegExp using glob-to-regexp algorithm
	 *
	 * Supports standard glob patterns:
	 * - `*` - Matches any characters within a single directory level (excludes path separators)
	 * - `**` - Matches zero or more directories and subdirectories (called globstar)
	 * - `?` - Matches exactly one character (when extended mode is enabled)
	 *
	 * Extended glob patterns (when extended: true):
	 * - `[abc]` - Character class: matches any single character from the set (a, b, or c)
	 * - `[a-z]` - Character range: matches any single character in the range a through z
	 * - `[!abc]` - Negated character class: matches any character NOT in the set
	 * - `{*.js,*.ts}` - Brace expansion: matches either *.js OR *.ts patterns
	 * - `{foo,bar}` - Alternation: matches either "foo" OR "bar"
	 *
	 * @example
	 * ```typescript
	 * // Basic patterns
	 * globToRegExp('*.txt')           // matches: file.txt, readme.txt
	 * globToRegExp('**\/*.js')         // matches: src/file.js, src/utils/helper.js
	 *
	 * // Extended patterns
	 * globToRegExp('test[123].js')    // matches: test1.js, test2.js, test3.js
	 * globToRegExp('file[a-z].txt')   // matches: filea.txt, fileb.txt, filez.txt
	 * globToRegExp('{*.js,*.ts}')     // matches: app.js, index.ts, but not style.css
	 * ```
	 *
	 * @param glob - The glob pattern string to convert
	 * @param opts - Configuration options
	 * @param opts.extended - Enable extended glob features like [], {}, and ? (default: false)
	 * @param opts.globstar - Enable ** globstar matching (default: true)
	 * @param opts.flags - RegExp flags to apply (default: 'i' for case-insensitive)
	 * @returns RegExp object that matches the glob pattern
	 * @throws TypeError if glob is not a string
	 *
	 * Based on the glob-to-regexp library
	 */
	private static globToRegExp(
		glob: string,
		opts?: { extended?: boolean; globstar?: boolean; flags?: string }
	): RegExp {
		if (typeof glob !== 'string') {
			throw new TypeError('Expected a string');
		}

		const str = String(glob);
		let reStr = '';
		const extended = opts ? !!opts.extended : false;
		const globstar = opts ? !!opts.globstar : true; // Default to true for better glob support
		let inGroup = false;

		const flags = opts && typeof opts.flags === 'string' ? opts.flags : 'i'; // Default to case-insensitive

		let c: string;
		for (let i = 0, len = str.length; i < len; i++) {
			c = str[i];
			switch (c) {
				case '/':
				case '$':
				case '^':
				case '+':
				case '.':
				case '(':
				case ')':
				case '=':
				case '!':
				case '|':
					reStr += '\\' + c;
					break;
				case '?':
					if (extended) {
						reStr += '.';
						break;
					}
					// For non-extended mode, treat ? as literal
					reStr += '\\' + c;
					break;
				case '[':
				case ']':
					if (extended) {
						reStr += c;
						break;
					}
					reStr += '\\' + c;
					break;
				case '{':
					if (extended) {
						inGroup = true;
						reStr += '(';
						break;
					}
					reStr += '\\' + c;
					break;
				case '}':
					if (extended) {
						inGroup = false;
						reStr += ')';
						break;
					}
					reStr += '\\' + c;
					break;
				case ',':
					if (inGroup) {
						reStr += '|';
						break;
					}
					reStr += '\\' + c;
					break;
				case '*': {
					// Move over all consecutive "*"'s.
					// Also store the previous and next characters
					const prevChar = str[i - 1];
					let starCount = 1;
					while (str[i + 1] === '*') {
						starCount++;
						i++;
					}
					const nextChar = str[i + 1];

					if (!globstar) {
						// globstar is disabled, so treat any number of "*" as one
						reStr += '.*';
					} else {
						// globstar is enabled, so determine if this is a globstar segment
						const isGlobstar =
							starCount > 1 && // multiple "*"'s
							(prevChar === '/' || prevChar === undefined) && // from the start of the segment
							(nextChar === '/' || nextChar === undefined); // to the end of the segment

						if (isGlobstar) {
							// it's a globstar, so match zero or more path segments
							reStr += '((?:[^/]*(?:\\/|$))*)';
							i++; // move over the "/"
						} else {
							// it's not a globstar, so only match one path segment
							reStr += '([^/]*)';
						}
					}
					break;
				}
				default:
					reStr += c;
			}
		}

		// When regexp 'g' flag is specified don't constrain the regular expression with ^ & $
		if (!flags || !flags.includes('g')) {
			reStr = '^' + reStr + '$';
		}

		return new RegExp(reStr, flags);
	}

	public static fileNameMatcher(name: Pattern): Filter {
		let regExp;
		if (typeof name === 'string') {
			regExp = this.globToRegExp(name, {
				globstar: false,
				extended: true,
			});
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
			regExp = this.globToRegExp(folder, {
				globstar: true,
				extended: true,
			});
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
			regExp = this.globToRegExp(path, {
				globstar: true,
				extended: true,
			});
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
