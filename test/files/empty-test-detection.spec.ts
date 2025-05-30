import { projectFiles } from '../../src/files/fluentapi/files';
import { EmptyTestViolation } from '../../src/files/assertion/matching-files';
import path from 'path';

describe('Empty Test Detection', () => {
	const tsConfigPath = path.join(
		__dirname,
		'integration',
		'samples',
		'namingsample',
		'tsconfig.json'
	);

	describe('when no files match patterns', () => {
		it('should detect empty test by default', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('nonexistent-folder')
				.should()
				.matchFilename('*.ts')
				.check();

			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);

			const emptyTestViolation = violations[0] as EmptyTestViolation;
			expect(emptyTestViolation.patterns).toEqual([
				expect.stringMatching(/nonexistent-folder/),
			]);
			expect(emptyTestViolation.message).toContain(
				'No files found matching pattern'
			);
		});
		it('should detect empty test with filename regex matching', async () => {
			const violations = await projectFiles(tsConfigPath)
				.matchingPattern('nonexistent-pattern-.*')
				.should()
				.matchFilename(/.*Service\.ts/)
				.check();

			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
		});

		it('should detect empty test with enhanced pattern methods', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('nonexistent')
				.should()
				.matchPath('src/nonexistent/File.ts')
				.check();

			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
		});
	});

	describe('when allowEmptyTests option is used', () => {
		it('should not create violations when allowEmptyTests is true', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('nonexistent-folder')
				.should()
				.matchFilename('*.ts')
				.check({ allowEmptyTests: true });

			expect(violations).toHaveLength(0);
		});
		it('should not create violations for filename regex when allowEmptyTests is true', async () => {
			const violations = await projectFiles(tsConfigPath)
				.matchingPattern('nonexistent-pattern-.*')
				.should()
				.matchFilename(/.*Service\.ts/)
				.check({ allowEmptyTests: true });

			expect(violations).toHaveLength(0);
		});

		it('should not create violations for enhanced patterns when allowEmptyTests is true', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('nonexistent')
				.should()
				.matchPath('src/nonexistent/File.ts')
				.check({ allowEmptyTests: true });

			expect(violations).toHaveLength(0);
		});
	});

	describe('when files do match patterns', () => {
		it('should not create empty test violations when files are found', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('controllers')
				.should()
				.matchFilename('*.ts')
				.check();

			// Should only contain file pattern violations, no empty test violations
			expect(violations).not.toContain(expect.any(EmptyTestViolation));
		});

		it('should work normally with existing files regardless of allowEmptyTests option', async () => {
			const violationsDefault = await projectFiles(tsConfigPath)
				.inFolder('controllers')
				.should()
				.matchFilename('Service*')
				.check();

			const violationsWithOption = await projectFiles(tsConfigPath)
				.inFolder('controllers')
				.should()
				.matchFilename('Service*')
				.check({ allowEmptyTests: true });

			// Both should have the same violations (no empty test violations)
			expect(violationsDefault).toEqual(violationsWithOption);
			expect(violationsDefault).not.toContain(expect.any(EmptyTestViolation));
		});
	});

	describe('with negated conditions', () => {
		it('should detect empty tests with shouldNot conditions', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('nonexistent-folder')
				.shouldNot()
				.matchFilename('*.ts')
				.check();

			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
		});

		it('should allow empty tests with shouldNot when option is set', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('nonexistent-folder')
				.shouldNot()
				.matchFilename('*.ts')
				.check({ allowEmptyTests: true });

			expect(violations).toHaveLength(0);
		});
	});

	describe('custom empty test violation messages', () => {
		it('should create EmptyTestViolation with default message', async () => {
			const violations = await projectFiles(tsConfigPath)
				.inFolder('nonexistent')
				.should()
				.matchFilename('*.ts')
				.check();

			expect(violations).toHaveLength(1);
			const violation = violations[0] as EmptyTestViolation;
			expect(violation.message).toContain('No files found matching pattern(s)');
			expect(violation.patterns).toEqual([expect.stringMatching(/nonexistent/)]);
		});
	});
});
