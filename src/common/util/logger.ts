import { Logger, LogLevel, LoggingOptions } from '../fluentapi/checkable';

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
		this.logger = this.options.logger!;
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
