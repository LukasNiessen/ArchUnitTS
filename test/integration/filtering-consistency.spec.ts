import { RegexFactory } from '../../src/common';
import { matchesPattern } from '../../src/common/pattern-matching';
import { ClassFilter, ClassInfo } from '../../src/metrics';

describe('Filtering Consistency Between Modules', () => {
	const testFilePaths = [
		'/src/components/Button.ts',
		'/src/components/Modal.ts',
		'/src/utils/helper.ts',
		'/src/services/api.ts',
		'/test/components/Button.spec.ts',
		'/test/services/api.spec.ts',
	];

	const mockClassInfo: ClassInfo[] = testFilePaths.map((filePath, index) => ({
		name: `TestClass${index}`,
		filePath,
		methods: [],
		fields: [],
		dependencies: [],
		abstractness: 0,
		instability: 0,
		distance: 0,
	}));

	describe('Pattern Matching Consistency', () => {
		it('should use same RegexFactory for filename patterns', () => {
			const pattern = '*.ts';
			const filter = RegexFactory.fileNameMatcher(pattern);
			const metricsFilter = new ClassFilter(filter);

			// Test with metrics filter
			const filteredClasses = metricsFilter.apply(mockClassInfo);

			// Test with files pattern matching function directly
			const matchingPaths = testFilePaths.filter((path) =>
				matchesPattern(path, filter)
			);

			// Both should match all .ts files
			expect(filteredClasses.length).toBe(mockClassInfo.length);
			expect(matchingPaths.length).toBe(testFilePaths.length);
		});

		it('should use same RegexFactory for folder patterns', () => {
			const pattern = '**/components/**';
			const filter = RegexFactory.folderMatcher(pattern);
			const metricsFilter = new ClassFilter(filter);

			// Test with metrics filter
			const filteredClasses = metricsFilter.apply(mockClassInfo);

			// Test with files pattern matching function directly
			const matchingPaths = testFilePaths.filter((path) =>
				matchesPattern(path, filter)
			);

			// Both should match files in components folder
			const expectedMatches = testFilePaths.filter((path) =>
				path.includes('/components/')
			);
			expect(filteredClasses.length).toBe(expectedMatches.length);
			expect(matchingPaths.length).toBe(expectedMatches.length);
		});

		it('should use same RegexFactory for path patterns', () => {
			const pattern = '**/test/**';
			const filter = RegexFactory.pathMatcher(pattern);
			const metricsFilter = new ClassFilter(filter);

			// Test with metrics filter
			const filteredClasses = metricsFilter.apply(mockClassInfo);

			// Test with files pattern matching function directly
			const matchingPaths = testFilePaths.filter((path) =>
				matchesPattern(path, filter)
			);

			// Both should match test files
			const expectedMatches = testFilePaths.filter((path) =>
				path.includes('/test/')
			);
			expect(filteredClasses.length).toBe(expectedMatches.length);
			expect(matchingPaths.length).toBe(expectedMatches.length);
		});

		it('should use same RegexFactory for exact file patterns', () => {
			const exactPath = '/src/components/Button.ts';
			const filter = RegexFactory.exactFileMatcher(exactPath);
			const metricsFilter = new ClassFilter(filter);

			// Test with metrics filter
			const filteredClasses = metricsFilter.apply(mockClassInfo);

			// Test with files pattern matching function directly
			const matchingPaths = testFilePaths.filter((path) =>
				matchesPattern(path, filter)
			);

			// Both should match exactly one file
			expect(filteredClasses.length).toBe(1);
			expect(filteredClasses[0].filePath).toBe(exactPath);
			expect(matchingPaths.length).toBe(1);
			expect(matchingPaths[0]).toBe(exactPath);
		});
	});

	describe('Filter Combination Consistency', () => {
		it('should combine multiple filters consistently', () => {
			const nameFilter = RegexFactory.fileNameMatcher('*.ts');
			const folderFilter = RegexFactory.folderMatcher('**/src/**');

			// Test individual filters
			const nameFilterInstance = new ClassFilter(nameFilter);
			const folderFilterInstance = new ClassFilter(folderFilter);

			// Apply filters sequentially (AND logic)
			let result = nameFilterInstance.apply(mockClassInfo);
			result = folderFilterInstance.apply(result);

			// Should match .ts files in src folder
			const expectedMatches = testFilePaths.filter(
				(path) => path.includes('/src/') && path.endsWith('.ts')
			);
			expect(result.length).toBe(expectedMatches.length);

			// Verify each result
			result.forEach((classInfo: ClassInfo) => {
				expect(classInfo.filePath).toMatch(/\/src\/.*\.ts$/);
			});
		});
	});

	describe('Filter Target Options Consistency', () => {
		it('should respect target: filename option', () => {
			const filter = {
				regExp: /Button/,
				options: { target: 'filename' as const },
			};

			const metricsFilter = new ClassFilter(filter);
			const filteredClasses = metricsFilter.apply(mockClassInfo);

			// Should match files with "Button" in filename
			const expectedMatches = testFilePaths.filter((path) => {
				const filename = path.split('/').pop() || '';
				return /Button/.test(filename);
			});

			expect(filteredClasses.length).toBe(expectedMatches.length);
		});

		it('should respect target: path-no-filename option', () => {
			const filter = {
				regExp: /components/,
				options: { target: 'path-no-filename' as const },
			};

			const metricsFilter = new ClassFilter(filter);
			const filteredClasses = metricsFilter.apply(mockClassInfo);

			// Should match files in folders containing "components"
			const expectedMatches = testFilePaths.filter((path) => {
				const pathWithoutFilename = path.substring(0, path.lastIndexOf('/'));
				return /components/.test(pathWithoutFilename);
			});

			expect(filteredClasses.length).toBe(expectedMatches.length);
		});

		it('should respect target: path option', () => {
			const filter = {
				regExp: /api/,
				options: { target: 'path' as const },
			};

			const metricsFilter = new ClassFilter(filter);
			const filteredClasses = metricsFilter.apply(mockClassInfo);

			// Should match files with "api" anywhere in the full path
			const expectedMatches = testFilePaths.filter((path) => /api/.test(path));

			expect(filteredClasses.length).toBe(expectedMatches.length);
		});
	});
});
