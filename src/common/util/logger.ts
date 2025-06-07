import { LoggingOptions, Logger } from '../logging/types';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';

/**
 * CheckLogger is designed to output logging information during the execution of architectural checks.
 * It creates a single log file per instance and supports both console and file logging.
 */
class CheckLogger implements Logger {
	private readonly logFilePath: string;
	private isFileInitialized = false;
	constructor() {
		// Auto-assign log file path with timestamp in logs directory
		const now = new Date();
		const timestamp = now
			.toISOString()
			.replace(/T/, '_')
			.replace(/:/g, '-')
			.replace(/\.\d{3}Z$/, '');
		this.logFilePath = path.join(process.cwd(), 'logs', `archunit-${timestamp}.log`);
	}

	/**
	 * Determines whether to log to console based on options
	 */
	private shouldLogToConsole(options?: LoggingOptions): boolean {
		return options?.enabled || false;
	}

	/**
	 * Determines whether to log to file based on options
	 */
	private shouldLogToFile(options?: LoggingOptions): boolean {
		return options?.enabled === true && options?.logFile === true;
	} /**
	 * Prepares file for writing if needed
	 */
	private prepareFileWriting(options?: LoggingOptions): void {
		if (!this.shouldLogToFile(options)) {
			return;
		}

		if (!this.isFileInitialized) {
			const append = options?.appendToLogFile ?? true;
			const dir = path.dirname(this.logFilePath);

			// Ensure directory exists
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}

			if (!append || !existsSync(this.logFilePath)) {
				// Create new file or overwrite existing
				const sessionHeader = `ArchUnitTS Logging Session Started\n${new Date().toISOString()}\n${'='.repeat(50)}\n`;
				writeFileSync(this.logFilePath, sessionHeader);
			}
			this.isFileInitialized = true;
		}
	}

	/**
	 * Writes message to file if file logging is enabled
	 */
	private writeToFile(message: string, options?: LoggingOptions): void {
		if (!this.shouldLogToFile(options)) {
			return;
		}
		this.prepareFileWriting(options);
		const timestamp = new Date().toISOString();
		const logEntry = `[${timestamp}] ${message}\n`;
		appendFileSync(this.logFilePath, logEntry);
	}

	/**
	 * Formats log message with level and arguments
	 */
	private formatMessage(level: string, message: string, args: unknown[]): string {
		const formattedArgs =
			args.length > 0 ? ` ${args.map((arg) => String(arg)).join(' ')}` : '';
		return `[${level}] ${message}${formattedArgs}`;
	}

	debug(
		options: LoggingOptions | undefined,
		message: string,
		...args: unknown[]
	): void {
		const fullMessage = this.formatMessage('DEBUG', message, args);

		if (this.shouldLogToConsole(options)) {
			console.debug(fullMessage);
		}
		this.writeToFile(fullMessage, options);
	}

	info(options: LoggingOptions | undefined, message: string, ...args: unknown[]): void {
		const fullMessage = this.formatMessage('INFO', message, args);

		if (this.shouldLogToConsole(options)) {
			console.info(fullMessage);
		}
		this.writeToFile(fullMessage, options);
	}

	warn(options: LoggingOptions | undefined, message: string, ...args: unknown[]): void {
		const fullMessage = this.formatMessage('WARN', message, args);

		if (this.shouldLogToConsole(options)) {
			console.warn(fullMessage);
		}
		this.writeToFile(fullMessage, options);
	}

	error(
		options: LoggingOptions | undefined,
		message: string,
		...args: unknown[]
	): void {
		const fullMessage = this.formatMessage('ERROR', message, args);

		if (this.shouldLogToConsole(options)) {
			console.error(fullMessage);
		}
		this.writeToFile(fullMessage, options);
	}

	/**
	 * Gets the path to the log file for this logger instance
	 */
	getLogFilePath(): string {
		return this.logFilePath;
	}

	// Additional specialized methods for architectural checks
	isEnabled(): boolean {
		return true; // Always enabled, controlled by options passed to individual calls
	}
	startCheck(ruleName: string, options?: LoggingOptions): void {
		const message = `Starting architecture rule check: ${ruleName}`;
		this.info(options || { enabled: true }, message);
	}
	endCheck(ruleName: string, violationCount: number, options?: LoggingOptions): void {
		const message = `Completed architecture rule check: ${ruleName} (${violationCount} violations)`;
		if (violationCount > 0) {
			this.warn(options || { enabled: true }, message);
		} else {
			this.info(options || { enabled: true }, message);
		}
	}
	logViolation(violation: string, options?: LoggingOptions): void {
		const message = `Violation found: ${violation}`;
		this.warn(options || { enabled: true }, message);
	}
	logProgress(message: string, options?: LoggingOptions): void {
		this.debug(options || { enabled: true }, message);
	}
	logMetric(
		metricName: string,
		value: number,
		threshold?: number,
		options?: LoggingOptions
	): void {
		let message = `Metric ${metricName}: ${value}`;
		if (threshold !== undefined) {
			message += ` (threshold: ${threshold})`;
		}
		this.debug(options || { enabled: true }, message);
	}
	logFileProcessing(
		fileName: string,
		matchedRules: number,
		options?: LoggingOptions
	): void {
		const message = `Processed file: ${fileName} (matched ${matchedRules} rules)`;
		this.debug(options || { enabled: true }, message);
	}
}

// Shared logger instance used across all architecture checks
export const sharedLogger = new CheckLogger();

// Export the class for potential direct usage
export { CheckLogger };
