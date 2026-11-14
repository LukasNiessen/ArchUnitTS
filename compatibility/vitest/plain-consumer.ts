import { projectFiles, type Checkable } from 'archunit';

export const rule: Checkable = projectFiles().inFolder('src').should().haveNoCycles();

export async function assertWithJest(checkable: Checkable): Promise<void> {
	const result: Promise<void> = expect(checkable).toPassAsync({
		allowEmptyTests: true,
	});
	await result;
	await expect(checkable).not.toPassAsync();
}
