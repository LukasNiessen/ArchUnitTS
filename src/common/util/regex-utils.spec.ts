import { matchingAllPatterns } from './regex-utils';

describe('matchingAllPatterns', () => {
	it('returns true when all string patterns are included in input', () => {
		expect(matchingAllPatterns('hello world foo bar', ['hello', 'foo'])).toBe(true);
	});

	it('returns false when at least one string pattern is missing', () => {
		expect(matchingAllPatterns('hello world', ['hello', 'missing'])).toBe(false);
	});

	it('returns true when all RegExp patterns match', () => {
		expect(matchingAllPatterns('abc123xyz', [/abc/, /\d{3}/, /xyz$/])).toBe(true);
	});

	it('returns false when one RegExp pattern does not match', () => {
		expect(matchingAllPatterns('abc123xyz', [/abc/, /notfound/])).toBe(false);
	});

	it('works with mixed string and RegExp patterns', () => {
		expect(matchingAllPatterns('foo123bar', ['foo', /\d{3}/, 'bar'])).toBe(true);
	});

	it('returns true for empty patterns array', () => {
		expect(matchingAllPatterns('anything', [])).toBe(true);
	});

	it('returns false if input is empty but patterns expect content', () => {
		expect(matchingAllPatterns('', ['something'])).toBe(false);
	});
});
