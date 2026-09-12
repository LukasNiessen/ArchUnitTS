import path from 'path';
import { EmptyTestViolation } from '../../../src/common/assertion';
import { projectFiles } from '../../../src/files';

describe('negative dependency empty-test handling', () => {
	it('passes when selected source files have no dependencies to the target folder', async () => {
		const tsConfigPath = path.resolve(
			__dirname,
			'samples',
			'no-target-dependencies',
			'spa',
			'tsconfig.json'
		);

		const violations = await projectFiles(tsConfigPath)
			.inFolder('src/**')
			.shouldNot()
			.dependOnFiles()
			.inFolder('../apps/**')
			.withName('*.{js,jsx,ts,tsx}')
			.check();

		expect(violations).toEqual([]);
		expect(violations).not.toContainEqual(expect.any(EmptyTestViolation));
	});

	it('fails as empty when no file matches the dependency target', async () => {
		const tsConfigPath = path.resolve(
			__dirname,
			'samples',
			'no-target-dependencies',
			'spa',
			'tsconfig.json'
		);

		const violations = await projectFiles(tsConfigPath)
			.inFolder('src/**')
			.shouldNot()
			.dependOnFiles()
			.inFolder('../empty-apps/**')
			.withName('*.{js,jsx,ts,tsx}')
			.check();

		expect(violations).toHaveLength(1);
		expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
	});

	it('fails as empty when no file matches the dependency source', async () => {
		const tsConfigPath = path.resolve(
			__dirname,
			'samples',
			'no-target-dependencies',
			'spa',
			'tsconfig.json'
		);

		const violations = await projectFiles(tsConfigPath)
			.inFolder('missing-src/**')
			.shouldNot()
			.dependOnFiles()
			.inFolder('../apps/**')
			.withName('*.{js,jsx,ts,tsx}')
			.check();

		expect(violations).toHaveLength(1);
		expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
	});
});
