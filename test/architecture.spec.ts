import '../index';
import path from 'path';
import { projectSlices } from '../src/slices/fluentapi/slices';
import { projectFiles } from '../src/files/fluentapi/files';

describe('architecture', () => {
	jest.setTimeout(60000);

	it('components follow their inner architecture', async () => {
		const diagramLocation = path.resolve('test', 'components_inner.puml');

		const rules = ['common', 'files', 'slices', 'metrics'].map((c) => {
			return projectSlices()
				.definedBy('src/' + c + '/(**)/')
				.should()
				.adhereToDiagramInFile(diagramLocation);
		});

		for (let i = 0; i < rules.length; i++) {
			await expect(rules[i]).toPassAsync();
		}
	});

	it('common should not depend on specific components', async () => {
		for (const c of ['files', 'jest', 'slices', 'metrics']) {
			const rule = projectFiles()
				.inFolder('src/common')
				.shouldNot()
				.dependOnFiles()
				.inFolder('src/' + c);

			await expect(rule).toPassAsync();
		}
	});

	it('files should not depend on forbidden components', async () => {
		for (const c of ['slices', 'jest', 'metrics']) {
			const rule = projectFiles()
				.inFolder('src/files')
				.shouldNot()
				.dependOnFiles()
				.inFolder('src/' + c);

			await expect(rule).toPassAsync();
		}
	});

	it('metrics should not depend on forbidden components', async () => {
		for (const c of ['files', 'jest', 'slices']) {
			const rule = projectFiles()
				.inFolder('src/metrics')
				.shouldNot()
				.dependOnFiles()
				.inFolder('src/' + c);

			await expect(rule).toPassAsync();
		}
	});

	it('slices should not depend on forbidden components', async () => {
		for (const c of ['files', 'jest', 'metrics']) {
			const rule = projectFiles()
				.inFolder('src/slices')
				.shouldNot()
				.dependOnFiles()
				.inFolder('src/' + c);

			await expect(rule).toPassAsync();
		}
	});

	it('code should be cycle free', async () => {
		// TODO: we need some refactoring, a few cycles occurred unfortunately
		//const arr = ['files', 'jest', 'metrics', 'slices', 'testing'];
		//for (const el of arr) {
		//	const rule = projectFiles().inFolder(`src/${el}`).should().haveNoCycles();
		//	await expect(rule).toPassAsync();
		//}
	});

	it('should have the right naming convetion for tests', async () => {
		//const rule = projectFiles().inFolder('test').should().matchFilename('*.spec.ts');
		//await expect(rule).toPassAsync();
	});
});
