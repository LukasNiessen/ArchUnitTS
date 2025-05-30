import { Violation } from '../assertion/violation';

export interface CheckOptions {
	/**
	 * When true, allows empty tests (no violations created when no files match patterns)
	 * When false (default), creates EmptyTestViolation when no files match patterns
	 */
	allowEmptyTests?: boolean;
}

export interface Checkable {
	check(options?: CheckOptions): Promise<Violation[]>;
}
