import { FileConditionBuilder, projectFiles } from '../../../src/files';
import { ViolatingNode } from '../../../src/files/assertion';
import path from 'path';

describe('Integration test', () => {
	let files: FileConditionBuilder;

	beforeAll(() => {
		files = projectFiles(__dirname + '/samples/namingsample/tsconfig.json');
	});

	it('does not find a violation', async () => {
		const violations = await files
			.inFolder('src/controllers/**')
			.should()
			.haveName(/.*Controller\.ts/)
			.check();

		expect(violations).toEqual([]);
	});

	it('does find a violation with controllers', async () => {
		const violations = await files
			.inFolder('src/controllers/**')
			.should()
			.haveName('.*Service*.ts')
			.check();

		expect(violations).toHaveLength(1);
	});

	it('finds a violation when file does not match service pattern', async () => {
		const violations = await files
			.inFolder('src/services/**')
			.should()
			.haveName('Service*')
			.check();
		expect(violations).toHaveLength(1);
		expect((violations[0] as ViolatingNode).projectedNode.label).toBe(
			'src/services/SService.ts'
		);
	});

	it('does find a violation when described as negated rule', async () => {
		const violations = await files
			.inFolder('src/controllers/**')
			.shouldNot()
			.haveName('Controller.ts')
			.check();

		expect(violations).toEqual([
			expect.objectContaining({
				checkPattern: expect.any(String),
				projectedNode: {
					label: 'src/controllers/Controller.ts',
					incoming: expect.any(Array),
					outgoing: expect.any(Array),
				},
				isNegated: true,
			}),
		]);
	});

	it('handles absolute imports', async () => {
		const violations = await projectFiles(
			path.resolve(__dirname, 'samples', 'absoluteimports', 'tsconfig.json')
		)
			.inFolder('src/components/ATest')
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/components/BTest')
			.check();

		expect(violations).toMatchObject([
			{
				dependency: {
					cumulatedEdges: [
						{
							external: false,
							importKinds: expect.any(Array),
							source: 'src/components/ATest/ATest.ts',
							target: 'src/components/BTest/BTest.ts',
						},
					],
					sourceLabel: 'src/components/ATest/ATest.ts',
					targetLabel: 'src/components/BTest/BTest.ts',
				},
				isNegated: true, // X-TODO: this should be true, why does test say its false??!
			},
		]);
	});

	it('does not find a violation when described as negated rule', async () => {
		const violations = await files
			.inFolder('src/controllers/**')
			.shouldNot()
			.haveName('Service.ts')
			.check();

		expect(violations).toEqual([]);
	});

	it('checks for cycles', async () => {
		const violations = await files.inFolder('src/**').should().haveNoCycles().check();
		expect(violations).toHaveLength(1);
	});
});
