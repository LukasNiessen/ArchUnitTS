import { FileInfo, projectFiles } from '../..';

describe('Custom File Logic', () => {
	it('should allow custom file conditions with assertions', async () => {
		const customCondition = (file: FileInfo) => {
			// Custom logic: Files should not have more than 50 lines
			return file.linesOfCode <= 50;
		};

		const violations = await projectFiles()
			.inPath('src/**/*.ts')
			.should()
			.adhereTo(customCondition, 'File should have 50 lines or less')
			.check();

		expect(violations.length).toBeLessThan(50);
	});

	it('should support custom file filtering and assertions', async () => {
		const rule = projectFiles()
			.withName('*.spec.ts')
			.should()
			.adhereTo((file: FileInfo) => {
				// Custom logic: TypeScript files should contain export statements
				return file.content.includes('import');
			}, 'Spec files should import something');

		await expect(rule).toPassAsync();
	});

	it('should create violations when custom conditions fail', async () => {
		const rule = projectFiles()
			.withName('*.ts')
			.should()
			.adhereTo((file: FileInfo) => {
				// Custom logic that will fail: files should be empty
				return file.linesOfCode === 0;
			}, 'Files should be empty');

		const violations = await rule.check();
		expect(violations).not.toBe([]);
	});

	it.only('should create violations when custom conditions fail', async () => {
		const containsDispatching = (file: FileInfo) => {
			const res = /(?:store|ngrxStore)\.dispatch\(/.test(file.content);
			if (res) {
				console.log('Checking: ', file.content);
				console.log('Res: ', res);
				console.log('------------------------');
			}
			return /(?:store|ngrxStore)\.dispatch\(/.test(file.content);
		};
		const rule = projectFiles()
			.withName('*.ts')
			.shouldNot()
			.adhereTo(containsDispatching, 'Files should not contain ngrx dispatching');

		await expect(rule).toPassAsync();
	});
});
