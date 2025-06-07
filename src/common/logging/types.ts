// Logging type definitions that can be imported by other modules without circular dependencies

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
	debug(options: LoggingOptions | undefined, message: string, ...args: unknown[]): void;
	info(options: LoggingOptions | undefined, message: string, ...args: unknown[]): void;
	warn(options: LoggingOptions | undefined, message: string, ...args: unknown[]): void;
	error(options: LoggingOptions | undefined, message: string, ...args: unknown[]): void;
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
	/**
	 * If true, logs are written to a file (auto created)
	 */
	logFile?: boolean;

	/**
	 * Whether to append to an existing log file (true) or overwrite it (false)
	 */
	appendToLogFile?: boolean;
}
