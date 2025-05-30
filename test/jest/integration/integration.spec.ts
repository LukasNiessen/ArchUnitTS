import '../../../index';
import { projectFiles } from '../../../src/files/fluentapi/files';

describe('Integration test', () => {
	it('checks the created messages', async () => {
		const rule = projectFiles(__dirname + '/samples/filenamingsample/tsconfig.json')
			.inFolder('services')
			.should()
			.matchFilename(/.*Service.*\.ts/);
		await expect(rule).toPassAsync();
	});
});
