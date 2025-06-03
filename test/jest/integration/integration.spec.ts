import '../../../index';
import { projectFiles } from '../../../src/files/fluentapi/files';

describe('Integration test', () => {
	it('checks the created messages', async () => {
		const rule = projectFiles(__dirname + '/samples/filenamingsample/tsconfig.json')
			.inFolder('src/services/**')
			.should()
			.haveName(/.*Service.*\.ts/);
		await expect(rule).toPassAsync();
	});
});
