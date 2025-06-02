import { CheckOptions, projectFiles } from '../..';

describe('CheckOptions Integration Test', () => {
	it('should work without options', async () => {
		const rule = projectFiles()
			.inFolder('nonexistent-folder')
			.should()
			.haveNoCycles();

		await expect(rule).toPassAsync();
	});

	it('should work with combined options', async () => {
		const rule = projectFiles()
			.inFolder('nonexistent-folder')
			.should()
			.haveNoCycles();

		const options: CheckOptions = {
			allowEmptyTests: true,
			clearCache: true,
			logging: {
				enabled: true,
				level: 'info',
			},
		};

		await expect(rule).toPassAsync(options);
	});

	it('should work with allowEmptyTests option', async () => {
		const rule = projectFiles()
			.inFolder('completely-nonexistent')
			.should()
			.haveNoCycles();

		const options: CheckOptions = {
			allowEmptyTests: true,
		};

		await expect(rule).toPassAsync(options);
	});

	it('should work with pattern matching and options', async () => {
		const rule = projectFiles()
			.matchingPattern('hey/nonexistent-*.ts')
			.should()
			.matchFilename(/.*\.ts$/);

		await expect(rule).toPassAsync({
			allowEmptyTests: true,
		});
	});
});
