// @ts-ignore This fixture's alias is configured in its referenced tsconfig.
import { testPathAlias } from '@/utils/TestUtils';
import { testRelativePath } from '../utils/RelativeUtils';

export class TestService {
	public dummyMethod(): void {
		testPathAlias();
		testRelativePath();
	}
}
