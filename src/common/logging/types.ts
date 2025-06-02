// Logging type definitions that can be imported by other modules without circular dependencies

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
	debug(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}

export interface LoggingOptions {
	/**
	 * Whether to enable logging during check execution
	 */
	enabled?: boolean;

	/**
	 * Minimum log level to output (defaults to 'info')
	 */
	level?: LogLevel;

	/**
	 * Custom logger implementation (defaults to console)
	 */
	logger?: Logger;

	/**
	 * Whether to log rule execution start/end times
	 */
	logTiming?: boolean;

	/**
	 * Whether to log violation details as they are found
	 */
	logViolations?: boolean;

	/**
	 * Whether to log file processing progress
	 */
	logProgress?: boolean;
}
