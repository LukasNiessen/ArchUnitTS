import { LoggingOptions } from '..';
import { Violation } from '../assertion';

export interface CheckOptions {
	/**
	 * When true, allows empty tests (no violations created when no files match patterns)
	 * When false (default), creates EmptyTestViolation when no files match patterns
	 */
	allowEmptyTests?: boolean;

	/**
	 * Logging configuration for check execution
	 */
	logging?: LoggingOptions;

	clearCache?: boolean;
}

export interface Checkable {
	check(options?: CheckOptions): Promise<Violation[]>;
}
