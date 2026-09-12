import path from 'path';
import { CheckOptions, extractGraph, TechnicalError } from '../../../src/common';
import { ViolatingFileDependency } from '../../../src/files/assertion';
import { projectFiles } from '../../../src/files';
import { projectSlices } from '../../../src/slices';
import { extendJestMatchers } from '../../../src/testing/jest';

extendJestMatchers();

describe('TypeScript path aliases', () => {
	it('keeps relative imports while resolving an inherited alias from a referenced config', async () => {
		const targets = await dependencyTargets('tsconfig.json');

		expect(targets).toEqual(['src/utils/RelativeUtils.ts', 'src/utils/TestUtils.ts']);
	});

	it('resolves referenced aliases when the solution config has no compilerOptions', async () => {
		const targets = await dependencyTargets('tsconfig.no-root-options.json');

		expect(targets).toEqual(['src/utils/RelativeUtils.ts', 'src/utils/TestUtils.ts']);
	});

	it('resolves a file in every project context regardless of reference order', async () => {
		const appFirst = await overlappingAliasTargets('tsconfig.json');
		const vitestFirst = await overlappingAliasTargets('tsconfig.reversed.json');

		expect(appFirst).toEqual(['src/app-shared.ts', 'src/test-shared.ts']);
		expect(vitestFirst).toEqual(appFirst);
	});

	it.each(['tsconfig.invalid-reference.json', 'tsconfig.missing-reference.json'])(
		'fails when a referenced config cannot be loaded: %s',
		async (configFileName) => {
			await expect(
				extractGraph(pathAliasConfig(configFileName), { clearCache: true })
			).rejects.toBeInstanceOf(TechnicalError);
		}
	);

	it('can explicitly extract a partial graph when a referenced config is invalid', async () => {
		const configFileName = 'tsconfig.partially-invalid.json';
		const targets = await dependencyTargets(configFileName, {
			ignoreReferencedConfigErrors: true,
		});

		expect(targets).toEqual(['src/utils/RelativeUtils.ts', 'src/utils/TestUtils.ts']);
		await expect(
			extractGraph(pathAliasConfig(configFileName))
		).rejects.toBeInstanceOf(TechnicalError);
	});

	it('keeps root config errors strict in best-effort mode', async () => {
		await expect(
			extractGraph(pathAliasConfig('tsconfig.invalid-options.json'), {
				clearCache: true,
				ignoreReferencedConfigErrors: true,
			})
		).rejects.toBeInstanceOf(TechnicalError);
	});

	it('shows migration guidance through toPassAsync', async () => {
		const rule = projectFiles(pathAliasConfig('tsconfig.invalid-reference.json'))
			.inFolder('src/**')
			.should()
			.haveNoCycles();

		await expect(expect(rule).toPassAsync({ clearCache: true })).rejects.toThrow(
			/ArchUnitTS 2\.5\.0[\s\S]*ignoreReferencedConfigErrors: true[\s\S]*#referenced-typescript-config-errors/
		);
	});

	it('forwards best-effort extraction through the slices API', async () => {
		const rule = projectSlices(pathAliasConfig('tsconfig.partially-invalid.json'))
			.definedBy('src/(**)/')
			.shouldNot()
			.containDependency('service', 'utils');

		const violations = await rule.check({
			clearCache: true,
			ignoreReferencedConfigErrors: true,
		});

		expect(violations).toHaveLength(1);
	});

	async function dependencyTargets(
		configFileName: string,
		options: CheckOptions = {}
	): Promise<string[]> {
		const violations = await projectFiles(pathAliasConfig(configFileName))
			.inFolder('src/service/**')
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/utils/**')
			.check({ ...options, clearCache: true });

		return (violations as ViolatingFileDependency[])
			.map((violation) => violation.dependency.targetLabel)
			.sort();
	}

	async function overlappingAliasTargets(configFileName: string): Promise<string[]> {
		const graph = await extractGraph(
			path.resolve(__dirname, 'samples', 'path-alias-overlap', configFileName),
			{ clearCache: true }
		);

		return graph
			.filter(
				(edge) => edge.source === 'src/consumer.ts' && edge.source !== edge.target
			)
			.map((edge) => edge.target)
			.sort();
	}

	function pathAliasConfig(configFileName: string): string {
		return path.resolve(
			__dirname,
			'samples',
			'path-alias-references',
			configFileName
		);
	}
});
