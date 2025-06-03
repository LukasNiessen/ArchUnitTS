import {
	matchesPattern,
	matchesAllPatterns,
	matchesAnyPattern,
} from '../../src/files/assertion/pattern-matching';
import { ProjectedNode } from '../../src/common/projection/project-nodes';
import { RegexFactory } from '../../src/common/regex-factory';

describe('Pattern Matching', () => {
	const createProjectedNode = (path: string): ProjectedNode => {
		return {
			label: path,
			incoming: [],
			outgoing: [],
		};
	};

	describe('matchesAllPatterns', () => {
		it('should return true when all patterns match', () => {
			const file = createProjectedNode('src/services/UserService.ts');
			const patterns = [
				{
					regExp: /.*Service.*/,
					options: {
						target: 'filename' as const,
					},
				},
				{
					regExp: /\.ts$/,
					options: { target: 'filename' as const },
				},
				{
					regExp: /.*services.*/,
					options: { target: 'path' as const },
				},
			];

			expect(matchesAllPatterns(file, patterns)).toBe(true);
		});

		it('should return false when any pattern does not match', () => {
			const file = createProjectedNode('src/services/UserService.ts');
			const patterns = [
				{
					regExp: /.*Service.*/,
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				},
				{
					regExp: /\.js$/,
					options: { target: 'filename' as const },
				}, // This won't match
				{
					regExp: /.*services.*/,
					options: { target: 'path' as const },
				},
			];

			expect(matchesAllPatterns(file, patterns)).toBe(false);
		});

		it('should handle empty patterns array', () => {
			const file = createProjectedNode('src/services/UserService.ts');
			expect(matchesAllPatterns(file, [])).toBe(true);
		});
	});

	describe('matchesAnyPattern', () => {
		it('should return true when any pattern matches', () => {
			const file = createProjectedNode('src/services/UserService.ts');
			const patterns = [
				{
					regExp: /Repository/,
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				}, // Won't match
				{
					regExp: /\.js$/,
					options: { target: 'filename' as const, matching: 'exact' as const },
				}, // Won't match
				{
					regExp: /Service/,
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				}, // Will match
			];

			expect(matchesAnyPattern(file, patterns)).toBe(true);
		});

		it('should return false when no patterns match', () => {
			const file = createProjectedNode('src/services/UserService.ts');
			const patterns = [
				{
					regExp: /Repository/,
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				},
				{
					regExp: /\.js$/,
					options: { target: 'filename' as const, matching: 'exact' as const },
				},
				{
					regExp: /controllers/,
					options: { target: 'path' as const, matching: 'partial' as const },
				},
			];

			expect(matchesAnyPattern(file, patterns)).toBe(false);
		});

		it('should handle empty patterns array', () => {
			const file = createProjectedNode('src/services/UserService.ts');
			expect(matchesAnyPattern(file, [])).toBe(false);
		});
	});

	describe('real-world scenarios', () => {
		it('should correctly identify Service pattern violations', () => {
			// This is the actual test case that was failing
			const serviceFile = createProjectedNode('src/services/SService.ts');
			const userServiceFile = createProjectedNode('src/services/UserService.ts');

			// Using filename-only exact matching, "Service.*" should not match "SService.ts"
			expect(
				matchesPattern(serviceFile, RegexFactory.fileNameMatcher(/^Service.*/))
			).toBe(false);
			expect(
				matchesPattern(
					userServiceFile,
					RegexFactory.fileNameMatcher(/^Service.*/)
				)
			).toBe(false);

			// But using partial matching would match
			expect(
				matchesPattern(serviceFile, {
					regExp: /Service/,
					options: { target: 'filename', matching: 'partial' },
				})
			).toBe(true);
			expect(
				matchesPattern(userServiceFile, {
					regExp: /Service/,
					options: { target: 'filename', matching: 'partial' },
				})
			).toBe(true);
		});

		it('should handle complex naming patterns', () => {
			const files = [
				createProjectedNode('src/controllers/UserController.ts'),
				createProjectedNode('src/services/UserService.ts'),
				createProjectedNode('src/repositories/UserRepository.ts'),
				createProjectedNode('src/models/User.ts'),
				createProjectedNode('src/utils/StringUtils.ts'),
			];

			// Test that only files ending with "Service.ts" match the service pattern
			const servicePattern = RegexFactory.fileNameMatcher(/Service\.ts$/);

			expect(matchesPattern(files[0], servicePattern)).toBe(false); // Controller
			expect(matchesPattern(files[1], servicePattern)).toBe(true); // Service
			expect(matchesPattern(files[2], servicePattern)).toBe(false); // Repository
			expect(matchesPattern(files[3], servicePattern)).toBe(false); // Model
			expect(matchesPattern(files[4], servicePattern)).toBe(false); // Utils
		});
	});

	describe('glob pattern support', () => {
		it('should handle wildcard patterns', () => {
			const file = createProjectedNode('src/services/UserService.ts');

			// Test * wildcard
			expect(matchesPattern(file, RegexFactory.fileNameMatcher('User*'))).toBe(
				true
			);
			expect(matchesPattern(file, RegexFactory.fileNameMatcher('Service*'))).toBe(
				false
			);
			expect(
				matchesPattern(file, RegexFactory.fileNameMatcher('*Service.ts'))
			).toBe(true);
			expect(matchesPattern(file, RegexFactory.fileNameMatcher('*User*'))).toBe(
				true
			);
		});

		it('should handle question mark wildcards', () => {
			const file = createProjectedNode('src/test/TestA.ts');

			expect(matchesPattern(file, RegexFactory.fileNameMatcher('Test?.ts'))).toBe(
				true
			);
			expect(matchesPattern(file, RegexFactory.fileNameMatcher('Test??.ts'))).toBe(
				false
			);
		});

		it('should distinguish glob patterns from exact patterns', () => {
			const file = createProjectedNode('src/literal/Service*.ts');

			// When there are no wildcards, should match exactly
			expect(
				matchesPattern(file, RegexFactory.fileNameMatcher('Service*.ts'))
			).toBe(true);
			expect(matchesPattern(file, RegexFactory.fileNameMatcher('Service.ts'))).toBe(
				false
			);
		});

		it('should correctly handle the original Service pattern issue', () => {
			const files = [
				createProjectedNode('src/services/Service.ts'),
				createProjectedNode('src/services/ServiceA.ts'),
				createProjectedNode('src/services/ServiceB.ts'),
				createProjectedNode('src/services/SService.ts'),
			];

			// Service* should match files starting with "Service"
			expect(
				matchesPattern(files[0], RegexFactory.fileNameMatcher('Service*'))
			).toBe(true); // Service.ts
			expect(
				matchesPattern(files[1], RegexFactory.fileNameMatcher('Service*'))
			).toBe(true); // ServiceA.ts
			expect(
				matchesPattern(files[2], RegexFactory.fileNameMatcher('Service*'))
			).toBe(true); // ServiceB.ts
			expect(
				matchesPattern(files[3], RegexFactory.fileNameMatcher('Service*'))
			).toBe(false); // SService.ts
		});
	});
});
