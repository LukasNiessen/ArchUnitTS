import { projectFiles } from '../..';

const projectPath = __dirname + '/layered-arch-1/tsconfig.json';

describe('Layered architecture', () => {
	it('should not have dependencies from ui to db', async () => {
		const rule = projectFiles(projectPath)
			.inFolder('src/ui')
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/db');

		// commented as this fails, as its supposed to!
		// await expect(rule).toPassAsync();

		const violations = await rule.check();
		expect(violations).toHaveLength(1);
	});

	it('should not have dependencies from ui to db', async () => {
		const rule = projectFiles(projectPath)
			.inFolder('src/ui')
			.withName('ui.ts')
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/db');
		const violations = await rule.check();
		expect(violations).toHaveLength(1);
	});
});
