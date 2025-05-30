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

	describe('matchesPattern', () => {
		describe('string patterns', () => {
			it('should match filename exactly when target is filename and matching is exact', () => {
				const file = createProjectedNode('src/services/UserService.ts');

				expect(
					matchesPattern(file, 'UserService.ts', {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'Service.ts', {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(false);
				expect(
					matchesPattern(file, 'UserService', {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(false);
			});

			it('should match filename partially when target is filename and matching is partial', () => {
				const file = createProjectedNode('src/services/UserService.ts');

				expect(
					matchesPattern(file, 'UserService', {
						target: 'filename',
						matching: 'partial',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'Service', {
						target: 'filename',
						matching: 'partial',
					})
				).toBe(true);
				expect(
					matchesPattern(file, '.ts', {
						target: 'filename',
						matching: 'partial',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'Repository', {
						target: 'filename',
						matching: 'partial',
					})
				).toBe(false);
			});

			it('should match path exactly when target is path and matching is exact', () => {
				const file = createProjectedNode('src/services/UserService.ts');

				expect(
					matchesPattern(file, 'src/services/UserService.ts', {
						target: 'path',
						matching: 'exact',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'services/UserService.ts', {
						target: 'path',
						matching: 'exact',
					})
				).toBe(false);
				expect(
					matchesPattern(file, 'UserService.ts', {
						target: 'path',
						matching: 'exact',
					})
				).toBe(false);
			});

			it('should match path partially when target is path and matching is partial', () => {
				const file = createProjectedNode('src/services/UserService.ts');

				expect(
					matchesPattern(file, 'services', {
						target: 'path',
						matching: 'partial',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'Service', {
						target: 'path',
						matching: 'partial',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'src/services', {
						target: 'path',
						matching: 'partial',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'controllers', {
						target: 'path',
						matching: 'partial',
					})
				).toBe(false);
			});
		});

		describe('regex patterns', () => {
			it('should match filename with regex when target is filename', () => {
				const file = createProjectedNode('src/services/UserService.ts');

				expect(
					matchesPattern(file, /^User.*\.ts$/, {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(true);
				expect(
					matchesPattern(file, /Service/, {
						target: 'filename',
						matching: 'partial',
					})
				).toBe(true);
				expect(
					matchesPattern(file, /^Repository.*\.ts$/, {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(false);
			});

			it('should match path with regex when target is path', () => {
				const file = createProjectedNode('src/services/UserService.ts');

				expect(
					matchesPattern(file, /services\/.*Service\.ts$/, {
						target: 'path',
						matching: 'exact',
					})
				).toBe(true);
				expect(
					matchesPattern(file, /controllers/, {
						target: 'path',
						matching: 'partial',
					})
				).toBe(false);
			});
		});

		describe('edge cases', () => {
			it('should handle files without extensions', () => {
				const file = createProjectedNode('src/utils/helpers');

				expect(
					matchesPattern(file, 'helpers', {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'help', {
						target: 'filename',
						matching: 'partial',
					})
				).toBe(true);
			});

			it('should handle files with multiple dots', () => {
				const file = createProjectedNode('src/test/user.service.spec.ts');

				expect(
					matchesPattern(file, 'user.service.spec.ts', {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'service.spec', {
						target: 'filename',
						matching: 'partial',
					})
				).toBe(true);
			});

			it('should handle files in root directory', () => {
				const file = createProjectedNode('index.ts');

				expect(
					matchesPattern(file, 'index.ts', {
						target: 'filename',
						matching: 'exact',
					})
				).toBe(true);
				expect(
					matchesPattern(file, 'index.ts', {
						target: 'path',
						matching: 'exact',
					})
				).toBe(true);
			});
		});
	});

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
			expect(
				matchesPattern(serviceFile, /^Service.*/, {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(false);
			expect(
				matchesPattern(userServiceFile, /^Service.*/, {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(false);

			// But using partial matching or path matching would match
			expect(
				matchesPattern(serviceFile, 'Service', {
					target: 'filename',
					matching: 'partial',
				})
			).toBe(true);
			expect(
				matchesPattern(serviceFile, 'Service', {
					target: 'path',
					matching: 'partial',
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

			expect(
				matchesPattern(files[0], servicePattern.pattern, servicePattern.options)
			).toBe(false); // Controller
			expect(
				matchesPattern(files[1], servicePattern.pattern, servicePattern.options)
			).toBe(true); // Service
			expect(
				matchesPattern(files[2], servicePattern.pattern, servicePattern.options)
			).toBe(false); // Repository      expect(matchesPattern(files[3], servicePattern.pattern, servicePattern.options)).toBe(false); // Model
			expect(
				matchesPattern(files[4], servicePattern.pattern, servicePattern.options)
			).toBe(false); // Utils
		});
	});

	describe('glob pattern support', () => {
		it('should handle wildcard patterns', () => {
			const file = createProjectedNode('src/services/UserService.ts');

			// Test * wildcard
			expect(
				matchesPattern(file, 'User*', { target: 'filename', matching: 'exact' })
			).toBe(true);
			expect(
				matchesPattern(file, 'Service*', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(false);
			expect(
				matchesPattern(file, '*Service.ts', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(true);
			expect(
				matchesPattern(file, '*User*', { target: 'filename', matching: 'exact' })
			).toBe(true);
		});

		it('should handle question mark wildcards', () => {
			const file = createProjectedNode('src/test/TestA.ts');

			expect(
				matchesPattern(file, 'Test?.ts', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(true);
			expect(
				matchesPattern(file, 'Test??.ts', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(false);
		});

		it('should distinguish glob patterns from exact patterns', () => {
			const file = createProjectedNode('src/literal/Service*.ts');

			// When there are no wildcards, should match exactly
			expect(
				matchesPattern(file, 'Service*.ts', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(true);
			expect(
				matchesPattern(file, 'Service.ts', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(false);
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
				matchesPattern(files[0], 'Service*', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(true); // Service.ts
			expect(
				matchesPattern(files[1], 'Service*', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(true); // ServiceA.ts
			expect(
				matchesPattern(files[2], 'Service*', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(true); // ServiceB.ts
			expect(
				matchesPattern(files[3], 'Service*', {
					target: 'filename',
					matching: 'exact',
				})
			).toBe(false); // SService.ts
		});
	});
});
