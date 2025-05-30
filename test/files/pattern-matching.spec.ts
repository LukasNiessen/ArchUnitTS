import {
	matchesPattern,
	matchesAllPatterns,
	matchesAnyPattern,
} from '../../src/files/assertion/pattern-matching';
import { ProjectedNode } from '../../src/common/projection/project-nodes';

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
					pattern: 'Service',
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				},
				{
					pattern: /\.ts$/,
					options: { target: 'filename' as const, matching: 'exact' as const },
				},
				{
					pattern: 'services',
					options: { target: 'path' as const, matching: 'partial' as const },
				},
			];

			expect(matchesAllPatterns(file, patterns)).toBe(true);
		});

		it('should return false when any pattern does not match', () => {
			const file = createProjectedNode('src/services/UserService.ts');
			const patterns = [
				{
					pattern: 'Service',
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				},
				{
					pattern: /\.js$/,
					options: { target: 'filename' as const, matching: 'exact' as const },
				}, // This won't match
				{
					pattern: 'services',
					options: { target: 'path' as const, matching: 'partial' as const },
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
					pattern: 'Repository',
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				}, // Won't match
				{
					pattern: /\.js$/,
					options: { target: 'filename' as const, matching: 'exact' as const },
				}, // Won't match
				{
					pattern: 'Service',
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
					pattern: 'Repository',
					options: {
						target: 'filename' as const,
						matching: 'partial' as const,
					},
				},
				{
					pattern: /\.js$/,
					options: { target: 'filename' as const, matching: 'exact' as const },
				},
				{
					pattern: 'controllers',
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
			expect(matchesPattern(serviceFile, /^Service.*/)).toBe(false);
			expect(matchesPattern(userServiceFile, /^Service.*/)).toBe(false);

			// But using partial matching would match
			expect(
				matchesPattern(serviceFile, {
					pattern: 'Service',
					options: { matching: 'partial' },
				})
			).toBe(true);
			expect(
				matchesPattern(userServiceFile, {
					pattern: 'Service',
					options: { matching: 'partial' },
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
			const servicePattern = {
				pattern: /Service\.ts$/,
				options: { target: 'filename' as const, matching: 'exact' as const },
			};

			expect(matchesPattern(files[0], servicePattern.pattern)).toBe(false); // Controller
			expect(matchesPattern(files[1], servicePattern.pattern)).toBe(true); // Service
			expect(matchesPattern(files[2], servicePattern.pattern)).toBe(false); // Repository      expect(matchesPattern(files[3], servicePattern.pattern, servicePattern.options)).toBe(false); // Model
			expect(matchesPattern(files[4], servicePattern.pattern)).toBe(false); // Utils
		});
	});

	describe('glob pattern support', () => {
		it('should handle wildcard patterns', () => {
			const file = createProjectedNode('src/services/UserService.ts');

			// Test * wildcard
			expect(matchesPattern(file, 'User*')).toBe(true);
			expect(matchesPattern(file, 'Service*')).toBe(false);
			expect(matchesPattern(file, '*Service.ts')).toBe(true);
			expect(matchesPattern(file, '*User*')).toBe(true);
		});

		it('should handle question mark wildcards', () => {
			const file = createProjectedNode('src/test/TestA.ts');

			expect(matchesPattern(file, 'Test?.ts')).toBe(true);
			expect(matchesPattern(file, 'Test??.ts')).toBe(false);
		});

		it('should distinguish glob patterns from exact patterns', () => {
			const file = createProjectedNode('src/literal/Service*.ts');

			// When there are no wildcards, should match exactly
			expect(matchesPattern(file, 'Service*.ts')).toBe(true);
			expect(matchesPattern(file, 'Service.ts')).toBe(false);
		});

		it('should correctly handle the original Service pattern issue', () => {
			const files = [
				createProjectedNode('src/services/Service.ts'),
				createProjectedNode('src/services/ServiceA.ts'),
				createProjectedNode('src/services/ServiceB.ts'),
				createProjectedNode('src/services/SService.ts'),
			];

			// Service* should match files starting with "Service"
			expect(matchesPattern(files[0], 'Service*')).toBe(true); // Service.ts
			expect(matchesPattern(files[1], 'Service*')).toBe(true); // ServiceA.ts
			expect(matchesPattern(files[2], 'Service*')).toBe(true); // ServiceB.ts
			expect(matchesPattern(files[3], 'Service*')).toBe(false); // SService.ts
		});
	});
});
