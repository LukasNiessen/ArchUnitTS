import type { CheckOptions } from '../../../common/fluentapi/checkable.js';

// This folder's package.json selects Vitest's ESM types for both module formats.
// Omit type parameters to merge with both Vitest 4's and Vitest 5's Matchers.
declare module 'vitest' {
	interface Matchers {
		toPassAsync(options?: CheckOptions): Promise<void>;
	}
}
