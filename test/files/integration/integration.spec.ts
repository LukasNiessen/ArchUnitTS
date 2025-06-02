import { ImportKind } from '../../../src/common/util/import-kinds';
import { FileConditionBuilder, projectFiles } from '../../../src/files/fluentapi/files';
import { ViolatingNode } from '../../../src/files/assertion/matching-files';
import path from 'path';

describe('Integration test', () => {
	let files: FileConditionBuilder;

	beforeAll(() => {
		files = projectFiles(__dirname + '/samples/namingsample/tsconfig.json');
	});

	it('does not find a violation', async () => {
		const violations = await files
			.inFolder('controllers')
			.should()
			.matchFilename(/.*Controller\.ts/)
			.check();

		expect(violations).toEqual([]);
	});

	it('does find a violation with controllers', async () => {
		const violations = await files
			.inFolder('src/controllers')
			.should()
			.matchFilename('.*Service*.ts')
			.check();

		expect(violations).toHaveLength(1);
	});

	it('finds a violation when file does not match service pattern', async () => {
		const violations = await files
			.inFolder('services')
			.should()
			.matchFilename('Service*')
			.check();
		expect(violations).toHaveLength(1);
		expect((violations[0] as ViolatingNode).projectedNode.label).toBe(
			'src/services/SService.ts'
		);
	});

	it('does find a violation when described as negated rule', async () => {
		const violations = await files
			.inFolder('controllers')
			.shouldNot()
			.matchFilename('Controller.ts')
			.check();

		expect(violations).toEqual([
			expect.objectContaining({
				checkPattern: 'Controller.ts',
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
			.matchingPattern('src/components/BTest')
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
				isNegated: true,
			},
		]);
	});

	it('does not find a violation when described as negated rule', async () => {
		const violations = await files
			.inFolder('controllers')
			.shouldNot()
			.matchFilename('Service.ts')
			.check();

		expect(violations).toEqual([]);
	});

	it('checks for cycles', async () => {
		const violations = await files.inFolder('src').should().haveNoCycles().check();
		console.log(JSON.stringify(violations, null, '\t'));
		expect(violations).toHaveLength(1);
	});

	it('correctly ignores files excluded by tsconfig', async () => {
		const violations = await projectFiles(
			path.resolve(__dirname, 'samples', 'ignores', 'tsconfig.json')
		)
			.inFolder('ignore')
			.shouldNot()
			.dependOnFiles()
			.inFolder('dontImport')
			.check();

		expect(violations).toEqual([]);
	});
});
