import { ArchIgnoreParser } from './archignore-parser';

describe('ArchIgnoreParser', () => {
	describe('pattern parsing', () => {
		it('should parse simple directory patterns', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('node_modules/\ndist/\n');

			const patterns = parser.getPatterns();
			expect(patterns).toContain('**/node_modules/**');
			expect(patterns).toContain('**/dist/**');
		});

		it('should skip comments and empty lines', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('# This is a comment\n\nnode_modules/\n');

			const patterns = parser.getPatterns();
			expect(patterns).toHaveLength(1);
		});

		it('should handle glob patterns', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('**/*.generated.ts\n*.test.ts\n');

			const patterns = parser.getPatterns();
			expect(patterns.length).toBeGreaterThan(0);
		});

		it('should handle negation patterns (! prefix)', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('*.test.ts\n!important.test.ts\n');

			const patterns = parser.getPatterns();
			const negations = parser.getNegationPatterns();

			expect(patterns.length).toBeGreaterThan(0);
			expect(negations.length).toBeGreaterThan(0);
		});
	});

	describe('file matching', () => {
		it('should ignore files matching patterns', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('node_modules/\n');

			expect(parser.shouldIgnore('node_modules/package.json')).toBe(true);
			expect(parser.shouldIgnore('src/index.ts')).toBe(false);
		});

		it('should handle nested directories', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('src/generated/**\n');

			expect(parser.shouldIgnore('src/generated/schema.ts')).toBe(true);
			expect(parser.shouldIgnore('src/generated/nested/file.ts')).toBe(true);
			expect(parser.shouldIgnore('src/manual/file.ts')).toBe(false);
		});

		it('should respect negation patterns', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('*.test.ts\n!important.test.ts\n');

			expect(parser.shouldIgnore('utils.test.ts')).toBe(true);
			expect(parser.shouldIgnore('important.test.ts')).toBe(false);
		});

		it('should handle Windows paths', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('src\\generated\\**\n');

			expect(parser.shouldIgnore('src/generated/schema.ts')).toBe(true);
		});
	});

	describe('pattern normalization', () => {
		it('should normalize trailing slashes', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('node_modules/\n');

			const patterns = parser.getPatterns();
			expect(patterns[0]).toContain('**');
		});

		it('should handle patterns without leading **', () => {
			const parser = new ArchIgnoreParser();
			(parser as any).parse('dist/\n');

			const patterns = parser.getPatterns();
			expect(patterns[0]).toContain('**');
		});
	});
});
