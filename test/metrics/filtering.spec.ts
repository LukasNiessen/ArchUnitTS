import {
	ClassInfo,
	FolderPathFilter,
	SingleFileFilter,
	ClassNameFilter,
	CompositeFilter,
	byFolderPath,
	bySingleFile,
	byClassName,
	combineFilters,
} from '../../src/metrics';

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

	describe('FolderPathFilter', () => {
		it('should filter classes by folder path pattern', () => {
			const filter = new FolderPathFilter(/\/services\//);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should handle multiple matches', () => {
			const filter = new FolderPathFilter(/\/src\//);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(4);
			const names = result.map((c) => c.name);
			expect(names).toContain('UserService');
			expect(names).toContain('ProductRepository');
			expect(names).toContain('OrderController');
			expect(names).toContain('DatabaseConnection');
		});

		it('should return empty array when no matches', () => {
			const filter = new FolderPathFilter(/\/nonexistent\//);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('SingleFileFilter', () => {
		it('should filter classes by exact file path', () => {
			const filter = new SingleFileFilter('/project/src/services/user-service.ts');
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should return empty array when file does not match', () => {
			const filter = new SingleFileFilter('/project/src/nonexistent.ts');
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('ClassNameFilter', () => {
		it('should filter classes by name pattern', () => {
			const filter = new ClassNameFilter(/.*Service$/);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should handle multiple matches', () => {
			const filter = new ClassNameFilter(/.*Repository$|.*Controller$/);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(2);
			const names = result.map((c) => c.name);
			expect(names).toContain('ProductRepository');
			expect(names).toContain('OrderController');
		});

		it('should return empty array when no name matches', () => {
			const filter = new ClassNameFilter(/.*Nonexistent$/);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('CompositeFilter', () => {
		it('should combine multiple filters with AND logic', () => {
			const folderFilter = new FolderPathFilter(/\/src\//);
			const nameFilter = new ClassNameFilter(/.*Service$/);
			const compositeFilter = new CompositeFilter([folderFilter, nameFilter]);

			const result = compositeFilter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('should return empty array when filters exclude all classes', () => {
			const folderFilter = new FolderPathFilter(/\/test\//);
			const nameFilter = new ClassNameFilter(/.*Service$/);
			const compositeFilter = new CompositeFilter([folderFilter, nameFilter]);

			const result = compositeFilter.apply(sampleClasses);

			expect(result).toHaveLength(0);
		});
	});

	describe('Helper functions', () => {
		it('byFolderPath should create FolderPathFilter with string pattern', () => {
			const filter = byFolderPath('services');
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('UserService');
		});

		it('byFolderPath should create FolderPathFilter with regex pattern', () => {
			const filter = byFolderPath(/\/repositories\//);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('ProductRepository');
		});

		it('bySingleFile should create SingleFileFilter', () => {
			const filter = bySingleFile('/project/src/controllers/order-controller.ts');
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('OrderController');
		});

		it('byClassName should create ClassNameFilter with string pattern', () => {
			const filter = byClassName('TestHelper');
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('TestHelper');
		});

		it('byClassName should create ClassNameFilter with regex pattern', () => {
			const filter = byClassName(/.*Connection$/);
			const result = filter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('DatabaseConnection');
		});
		it('combineFilters should create CompositeFilter', () => {
			const folderFilter = byFolderPath(/\/infrastructure\//);
			const nameFilter = byClassName(/.*Connection$/);
			const combinedFilter = combineFilters([folderFilter, nameFilter]);

			const result = combinedFilter.apply(sampleClasses);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('DatabaseConnection');
		});
	});
});
