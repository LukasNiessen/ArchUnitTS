import { ClassFilter, ClassInfo, CompositeFilter } from '../../src/metrics';
import { RegexFactory } from '../../src/common';

describe('Class Filtering', () => {
	const sampleClasses: ClassInfo[] = [
		{
			name: 'UserService',
			filePath: '/project/src/services/user-service.ts',
			methods: [],
			fields: [],
		},
		{
			name: 'ProductRepository',
			filePath: '/project/src/repositories/product-repository.ts',
			methods: [],
			fields: [],
		},
		{
			name: 'OrderController',
			filePath: '/project/src/controllers/order-controller.ts',
			methods: [],
			fields: [],
		},
		{
			name: 'DatabaseConnection',
			filePath: '/project/src/infrastructure/database-connection.ts',
			methods: [],
			fields: [],
		},
		{
			name: 'TestHelper',
			filePath: '/project/test/test-helper.ts',
			methods: [],
			fields: [],
		},
	];

	describe('ClassFilter with path filtering', () => {
		it('should filter classes by folder path pattern', () => {
			const filter = new ClassFilter(RegexFactory.pathMatcher(/\/services\//));
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should handle multiple matches', () => {
			const filter = new ClassFilter(RegexFactory.pathMatcher(/\/src\//));
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(4);
			const names = result.map((c) => c.name);
			expect(names).toContain('UserService');
			expect(names).toContain('ProductRepository');
			expect(names).toContain('OrderController');
			expect(names).toContain('DatabaseConnection');
		});

		it('should return empty array when no matches', () => {
			const filter = new ClassFilter(RegexFactory.pathMatcher(/\/nonexistent\//));
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('ClassFilter with exact file filtering', () => {
		it('should filter classes by exact file path', () => {
			const filter = new ClassFilter(
				RegexFactory.exactFileMatcher('/project/src/services/user-service.ts')
			);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should return empty array when file does not match', () => {
			const filter = new ClassFilter(
				RegexFactory.exactFileMatcher('/project/src/nonexistent.ts')
			);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('ClassFilter with class name filtering', () => {
		it('should filter classes by name pattern', () => {
			const filter = new ClassFilter(RegexFactory.classNameMatcher(/.*Service$/));
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should handle multiple matches', () => {
			const filter = new ClassFilter(
				RegexFactory.classNameMatcher(/.*Repository$|.*Controller$/)
			);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(2);
			const names = result.map((c) => c.name);
			expect(names).toContain('ProductRepository');
			expect(names).toContain('OrderController');
		});

		it('should return empty array when no name matches', () => {
			const filter = new ClassFilter(
				RegexFactory.classNameMatcher(/.*Nonexistent$/)
			);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('CompositeFilter', () => {
		it('should combine multiple filters with AND logic', () => {
			const folderFilter = new ClassFilter(RegexFactory.pathMatcher(/\/src\//));
			const nameFilter = new ClassFilter(
				RegexFactory.classNameMatcher(/.*Service$/)
			);
			const compositeFilter = new CompositeFilter([folderFilter, nameFilter]);

			const result = compositeFilter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should return empty array when filters exclude all classes', () => {
			const folderFilter = new ClassFilter(RegexFactory.pathMatcher(/\/test\//));
			const nameFilter = new ClassFilter(
				RegexFactory.classNameMatcher(/.*Service$/)
			);
			const compositeFilter = new CompositeFilter([folderFilter, nameFilter]);

			const result = compositeFilter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('ClassFilter with different target types', () => {
		it('should filter by folder path using string pattern', () => {
			const filter = new ClassFilter(RegexFactory.folderMatcher('**/services/**'));
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should filter by folder path using regex pattern', () => {
			const filter = new ClassFilter(
				RegexFactory.folderMatcher(/.*\/repositories(\/)?.*/)
			);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('ProductRepository');
		});

		it('should filter by filename pattern', () => {
			const filter = new ClassFilter(
				RegexFactory.fileNameMatcher('test-helper.ts')
			);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('TestHelper');
		});

		it('should combine multiple ClassFilters using CompositeFilter', () => {
			const folderFilter = new ClassFilter(
				RegexFactory.folderMatcher('**/infrastructure/**')
			);
			const nameFilter = new ClassFilter(
				RegexFactory.classNameMatcher(/.*Connection$/)
			);
			const combinedFilter = new CompositeFilter([folderFilter, nameFilter]);

			const result = combinedFilter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('DatabaseConnection');
		});
	});
});
