import {
	matchesPattern,
	matchesPatternClassInfo,
	matchesAllPatterns,
	matchesAnyPattern,
} from '../../src/files/assertion';
import { ProjectedNode } from '../../src/common/projection';
import { RegexFactory } from '../../src/common';
import { ClassInfo } from '../../src/metrics';

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

	describe('pattern exclusions', () => {
		it('should exclude barrel files from folder matchers by file name shorthand', () => {
			const matcher = RegexFactory.folderMatcher('src/app/orders/**', {
				except: ['index.ts', 'public-api.ts'],
			});

			expect(
				matchesPattern(
					createProjectedNode('src/app/orders/internal/order.service.ts'),
					matcher
				)
			).toBe(true);
			expect(
				matchesPattern(createProjectedNode('src/app/orders/index.ts'), matcher)
			).toBe(false);
			expect(
				matchesPattern(
					createProjectedNode('src/app/orders/public-api.ts'),
					matcher
				)
			).toBe(false);
		});

		it('should exclude path matcher results by file name shorthand', () => {
			const matcher = RegexFactory.pathMatcher('src/app/**/*.ts', {
				except: '*.spec.ts',
			});

			expect(
				matchesPattern(
					createProjectedNode('src/app/orders/order.service.ts'),
					matcher
				)
			).toBe(true);
			expect(
				matchesPattern(
					createProjectedNode('src/app/orders/order.service.spec.ts'),
					matcher
				)
			).toBe(false);
		});

		it('should support targeted exclusions for paths, folders, and names', () => {
			const matcher = RegexFactory.pathMatcher('src/app/**/*.ts', {
				except: {
					inPath: 'src/app/generated/**',
					inFolder: 'src/app/testing/**',
					withName: '*.spec.ts',
				},
			});

			expect(
				matchesPattern(
					createProjectedNode('src/app/orders/order.service.ts'),
					matcher
				)
			).toBe(true);
			expect(
				matchesPattern(
					createProjectedNode('src/app/generated/generated-client.ts'),
					matcher
				)
			).toBe(false);
			expect(
				matchesPattern(
					createProjectedNode('src/app/testing/test-helper.ts'),
					matcher
				)
			).toBe(false);
			expect(
				matchesPattern(
					createProjectedNode('src/app/orders/order.service.spec.ts'),
					matcher
				)
			).toBe(false);
		});

		it('should support class name exclusions for metrics filters', () => {
			const matcher = RegexFactory.classNameMatcher('*Service', {
				except: '*Legacy*',
			});
			const orderService = createClassInfo(
				'OrderService',
				'src/app/orders/order.service.ts'
			);
			const legacyService = createClassInfo(
				'OrderLegacyService',
				'src/app/orders/order-legacy.service.ts'
			);

			expect(matchesPatternClassInfo(orderService, matcher)).toBe(true);
			expect(matchesPatternClassInfo(legacyService, matcher)).toBe(false);
		});

		it('should keep matching all patterns only when no filter excludes the file', () => {
			const file = createProjectedNode('src/app/orders/index.ts');
			const patterns = [
				RegexFactory.pathMatcher('src/app/**/*.ts'),
				RegexFactory.folderMatcher('src/app/orders/**', {
					except: 'index.ts',
				}),
			];

			expect(matchesAllPatterns(file, patterns)).toBe(false);
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

	function createClassInfo(name: string, filePath: string): ClassInfo {
		return {
			name,
			filePath,
			methods: [],
			fields: [],
		};
	}
});
