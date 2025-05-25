import { normalizeWindowsPaths } from './path-utils';

describe('normalizeWindowsPaths', () => {
	it('replaces backslashes with forward slashes', () => {
		expect(normalizeWindowsPaths('C:\\Users\\User\\Documents')).toBe(
			'C:/Users/User/Documents'
		);
	});

	it('leaves strings with only forward slashes unchanged', () => {
		expect(normalizeWindowsPaths('/usr/local/bin')).toBe('/usr/local/bin');
	});

	it('handles mixed slashes', () => {
		expect(normalizeWindowsPaths('C:/Users\\User\\Desktop')).toBe(
			'C:/Users/User/Desktop'
		);
	});

	it('handles empty string', () => {
		expect(normalizeWindowsPaths('')).toBe('');
	});

	it('handles string with no slashes', () => {
		expect(normalizeWindowsPaths('noslashes')).toBe('noslashes');
	});
});
