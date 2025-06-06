import { Logger, LoggingOptions, LogLevel } from '../logging';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates a default log file path with timestamp
 */
function generateDefaultLogPath(): string {
	const timestamp = new Date()
		.toISOString()
		.replace(/[:.]/g, '-') // Replace colons and dots with hyphens
		.replace('T', '_') // Replace T with underscore
		.slice(0, -5); // Remove milliseconds and Z

	return path.join('logs', `archunit-${timestamp}.log`);
}

/**
 * Logger that writes to both console and file
 */
export class FileLogger implements Logger {
	private readonly consoleLogger: DefaultLogger;
	private readonly filePath: string;
	private readonly append: boolean;
	private logFileInitialized = false;

	constructor(filePath: string, level: LogLevel = 'info', append = false) {
		this.consoleLogger = new DefaultLogger(level);
		this.filePath = filePath;
		this.append = append;

		// Initialize log file
		this.initializeLogFile();
	}
	private initializeLogFile(): void {
		try {
			// Ensure directory exists
			const dir = path.dirname(this.filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			// Create or clear log file
			if (!this.append || !fs.existsSync(this.filePath)) {
				fs.writeFileSync(this.filePath, '');
			}

			this.logFileInitialized = true;
			this.writeToFile(
				`\n=== ArchUnitTS Logging Session Started at ${new Date().toISOString()} ===\n`
			);
		} catch (error) {
			console.warn(`Failed to initialize log file ${this.filePath}:`, error);
			this.logFileInitialized = false;
		}
	}

	private writeToFile(message: string): void {
		if (!this.logFileInitialized) return;

		try {
			fs.appendFileSync(this.filePath, message + '\n');
		} catch (error) {
			console.warn(`Failed to write to log file ${this.filePath}:`, error);
		}
	}

	private formatLogMessage(level: LogLevel, message: string): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
	}

	debug(message: string, ...args: unknown[]): void {
		this.consoleLogger.debug(message, ...args);
		const formattedMessage = this.formatLogMessage('debug', message);
		if (args.length > 0) {
			this.writeToFile(
				`${formattedMessage} ${args
					.map((arg) =>
						typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
					)
					.join(' ')}`
			);
		} else {
			this.writeToFile(formattedMessage);
		}
	}

	info(message: string, ...args: unknown[]): void {
		this.consoleLogger.info(message, ...args);
		const formattedMessage = this.formatLogMessage('info', message);
		if (args.length > 0) {
			this.writeToFile(
				`${formattedMessage} ${args
					.map((arg) =>
						typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
					)
					.join(' ')}`
			);
		} else {
			this.writeToFile(formattedMessage);
		}
	}

	warn(message: string, ...args: unknown[]): void {
		this.consoleLogger.warn(message, ...args);
		const formattedMessage = this.formatLogMessage('warn', message);
		if (args.length > 0) {
			this.writeToFile(
				`${formattedMessage} ${args
					.map((arg) =>
						typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
					)
					.join(' ')}`
			);
		} else {
			this.writeToFile(formattedMessage);
		}
	}

	error(message: string, ...args: unknown[]): void {
		this.consoleLogger.error(message, ...args);
		const formattedMessage = this.formatLogMessage('error', message);
		if (args.length > 0) {
			this.writeToFile(
				`${formattedMessage} ${args
					.map((arg) =>
						typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
					)
					.join(' ')}`
			);
		} else {
			this.writeToFile(formattedMessage);
		}
	}
}

export class DefaultLogger implements Logger {
	private readonly level: LogLevel;
	private readonly logLevels: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
	};

	constructor(level: LogLevel = 'info') {
		this.level = level;
	}

	private shouldLog(level: LogLevel): boolean {
		return this.logLevels[level] >= this.logLevels[this.level];
	}

	private formatMessage(level: LogLevel, message: string): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
	}

	debug(message: string, ...args: unknown[]): void {
		if (this.shouldLog('debug')) {
			console.debug(this.formatMessage('debug', message), ...args);
		}
	}

	info(message: string, ...args: unknown[]): void {
		if (this.shouldLog('info')) {
			console.info(this.formatMessage('info', message), ...args);
		}
	}

	warn(message: string, ...args: unknown[]): void {
		if (this.shouldLog('warn')) {
			console.warn(this.formatMessage('warn', message), ...args);
		}
	}

	error(message: string, ...args: unknown[]): void {
		if (this.shouldLog('error')) {
			console.error(this.formatMessage('error', message), ...args);
		}
	}
}

export class CheckLogger {
	private readonly logger: Logger;
	private readonly options: LoggingOptions;
	private startTime?: number;

	constructor(options: LoggingOptions = {}) {
		this.options = {
			enabled: false,
			level: 'info',
			logger: new DefaultLogger(options.level),
			logTiming: false,
			logViolations: false,
			logProgress: false,
			...options,
		};
		// Use FileLogger if logFile option is provided
		if (this.options.logFile) {
			const logFilePath =
				typeof this.options.logFile === 'string'
					? this.options.logFile
					: generateDefaultLogPath();

			this.logger = new FileLogger(
				logFilePath,
				this.options.level || 'info',
				this.options.appendToLogFile
			);
		} else {
			this.logger = this.options.logger!;
		}
	}

	isEnabled(): boolean {
		return this.options.enabled === true;
	}

	startCheck(ruleName: string): void {
		if (!this.isEnabled()) {
			return;
		}

		if (this.options.logTiming) {
			this.startTime = Date.now();
		}

		this.logger.info(`Starting architecture rule check: ${ruleName}`);
	}

	endCheck(ruleName: string, violationCount: number): void {
		if (!this.isEnabled()) {
			return;
		}

		let message = `Completed architecture rule check: ${ruleName} (${violationCount} violations)`;

		if (this.options.logTiming && this.startTime) {
			const duration = Date.now() - this.startTime;
			message += ` in ${duration}ms`;
		}

		if (violationCount > 0) {
			this.logger.warn(message);
		} else {
			this.logger.info(message);
		}
	}

	logViolation(violation: string): void {
		if (!this.isEnabled() || !this.options.logViolations) {
			return;
		}
		this.logger.warn(`Violation found: ${violation}`);
	}

	logProgress(message: string): void {
		if (!this.isEnabled() || !this.options.logProgress) {
			return;
		}
		this.logger.debug(message);
	}

	logMetric(metricName: string, value: number, threshold?: number): void {
		if (!this.isEnabled()) {
			return;
		}

		let message = `Metric ${metricName}: ${value}`;
		if (threshold !== undefined) {
			message += ` (threshold: ${threshold})`;
		}

		this.logger.debug(message);
	}

	logFileProcessing(fileName: string, matchedRules: number): void {
		if (!this.isEnabled() || !this.options.logProgress) {
			return;
		}
		this.logger.debug(`Processed file: ${fileName} (matched ${matchedRules} rules)`);
	}

	debug(message: string, ...args: unknown[]): void {
		if (!this.isEnabled()) {
			return;
		}
		this.logger.debug(message, ...args);
	}

	info(message: string, ...args: unknown[]): void {
		if (!this.isEnabled()) {
			return;
		}
		this.logger.info(message, ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		if (!this.isEnabled()) {
			return;
		}
		this.logger.warn(message, ...args);
	}
	error(message: string, ...args: unknown[]): void {
		if (!this.isEnabled()) {
			return;
		}
		this.logger.error(message, ...args);
	}
}
