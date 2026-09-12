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

	/**
	 * When true, skips unreadable or invalid referenced TypeScript configs.
	 * The root config must always be valid. Defaults to false because skipping a
	 * referenced config can produce an incomplete dependency graph.
	 */
	ignoreReferencedConfigErrors?: boolean;

	clearCache?: boolean;
}

export interface Checkable {
	check(options?: CheckOptions): Promise<Violation[]>;
}
