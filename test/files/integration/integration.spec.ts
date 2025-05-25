import { FileConditionBuilder, filesOfProject } from '../../../src/files/fluentapi/files';
import path from 'path';
describe('Integration test', () => {
	let files: FileConditionBuilder;

	beforeAll(() => {
		files = filesOfProject(__dirname + '/samples/namingsample/tsconfig.json');
	});

	it('does not find a violation', async () => {
		const violations = await files
			.inFolder('controllers')
			.should()
			.matchPattern('.*controller.ts')
			.check();

		expect(violations).toEqual([]);
	});

	it('does find a violation', async () => {
		const violations = await files
			.inFolder('controllers')
			.should()
			.matchPattern('.*Service.ts')
			.check();

		expect(violations).toEqual([
			{
				checkPattern: '.*Service.ts',
				projectedNode: { 
					label: 'src/controllers/controller.ts',
					incoming: expect.any(Array),
					outgoing: expect.any(Array) 
				},
				isNegated: false,
			},
		]);
	});

	it('does find a violation when described as negated rule', async () => {
		const violations = await files
			.inFolder('controllers')
			.shouldNot()
			.matchPattern('.*controller.ts')
			.check();

		expect(violations).toEqual([
			{
				checkPattern: '.*controller.ts',
				projectedNode: { 
					label: 'src/controllers/controller.ts',
					incoming: expect.any(Array),
					outgoing: expect.any(Array)
				},
				isNegated: true,
			},
		]);
	});

	it('handles absolute imports', async () => {
		const violations = await filesOfProject(
			path.resolve(__dirname, 'samples', 'absoluteimports', 'tsconfig.json')
		)
			.matchingPattern('src/components/ATest')
			.shouldNot()
			.dependOnFiles()
			.matchingPattern('src/components/BTest')
			.check();

		expect(violations).toEqual([
			{
				dependency: {
					cumulatedEdges: [
						{
							external: false,
							importKinds: expect.any(Array),
							source: 'src/components/ATest/atest.ts',
							target: 'src/components/BTest/btest.ts',
						},
					],
					sourceLabel: 'src/components/ATest/atest.ts',
					targetLabel: 'src/components/BTest/btest.ts',
				},
				isNegated: true,
			},
		]);
	});

	it('does not find a violation when described as negated rule', async () => {
		const violations = await files
			.inFolder('controllers')
			.shouldNot()
			.matchPattern('.*Service.ts')
			.check();

		expect(violations).toEqual([]);
	});

	it('allows multiple patterns', async () => {
		const violations = await files
			.inFolder('controllers')
			.inFolder('services')
			.should()
			.matchPattern('.*Service.ts')
			.check();

		expect(violations).toEqual([]);
	});

	it('checks for cycles', async () => {
		const violations = await files
			.matchingPattern('.*')
			.should()
			.beFreeOfCycles()
			.check();

		expect(violations).toEqual([
			{
				cycle: [
					{
						cumulatedEdges: [
							{
								external: false,
								importKinds: expect.any(Array),
								source: 'src/services/service.ts',
								target: 'src/controllers/controller.ts',
							},
						],
						sourceLabel: 'src/services/service.ts',
						targetLabel: 'src/controllers/controller.ts',
					},
					{
						cumulatedEdges: [
							{
								external: false,
								importKinds: expect.any(Array),
								source: 'src/controllers/controller.ts',
								target: 'src/services/service.ts',
							},
						],
						sourceLabel: 'src/controllers/controller.ts',
						targetLabel: 'src/services/service.ts',
					},
				],
				isNegated: false,
			},
		]);
	});

	it('correctly ignores files excluded by tsconfig', async () => {
		const violations = await filesOfProject(
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
