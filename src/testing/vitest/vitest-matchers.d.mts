import type { CheckOptions } from '../../common/fluentapi/checkable.js';

// Keep this declaration in ESM so it augments Vitest's import entry point.
// Omit type parameters to merge with both Vitest 4's and Vitest 5's Matchers.
declare module 'vitest' {
	interface Matchers {
		toPassAsync(options?: CheckOptions): Promise<void>;
	}
}
