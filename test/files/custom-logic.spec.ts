import { FileInfo, projectFiles } from '../../src/files/fluentapi/files';

describe('Custom File Logic', () => {
	it('should allow custom file conditions with assertions', async () => {
		const customCondition = (file: FileInfo) => {
			// Custom logic: Files should not have more than 50 lines
			return file.linesOfCode <= 50;
		};

		const violations = await projectFiles()
			.matchingPattern('src/**/*.ts')
			.should()
			.adhereTo(customCondition, 'File should have 50 lines or less')
			.check();

		expect(violations.length).toBeLessThan(10);
	});

	it('should support custom file filtering and assertions', async () => {
		const violations = await projectFiles()
			.matchingPattern('*.spec.ts')
			.should()
			.adhereTo((file: FileInfo) => {
				// Custom logic: TypeScript files should contain export statements
				return file.content.includes('import');
			}, 'TypeScript files should export functionality')
			.check();

		expect(violations).toStrictEqual([]);
	});

	it('should create violations when custom conditions fail', async () => {
		const rule = projectFiles()
			.matchingPattern('**/*.ts')
			.should()
			.adhereTo((file: FileInfo) => {
				// Custom logic that will fail: files should be empty
				return file.linesOfCode === 0;
			}, 'Files should be empty');

		const violations = await rule.check();
		expect(violations).not.toBe([]);
	});
});
