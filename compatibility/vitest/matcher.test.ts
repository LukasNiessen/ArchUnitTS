import { EmptyTestViolation, type Checkable, type CheckOptions } from 'archunit';
import { expect, test } from 'vitest';

const passingRule: Checkable = { check: async () => [] };
const failingRule: Checkable = {
	check: async () => [new EmptyTestViolation(['missing-files'])],
};

test('registers the packaged matcher and forwards check options', async () => {
	let receivedOptions: CheckOptions | undefined;
	const rule: Checkable = {
		async check(options) {
			receivedOptions = options;
			return [];
		},
	};
	const options: CheckOptions = { allowEmptyTests: true };
	const result: Promise<void> = expect(rule).toPassAsync(options);

	await result;
	expect(receivedOptions).toBe(options);
});

test('rejects when the architecture rule has a violation', async () => {
	await expect(expect(failingRule).toPassAsync()).rejects.toThrow(
		'Architecture rule failed with 1 violation'
	);
});

test('supports negated architecture assertions', async () => {
	await expect(failingRule).not.toPassAsync();
	await expect(expect(passingRule).not.toPassAsync()).rejects.toThrow(
		'expected to not pass'
	);
});
