/**
 * ANSI color codes for terminal output formatting
 * Inspired by popular testing frameworks like Jest, Mocha, and Vitest
 */
export class ColorUtils {
	// Color codes
	private static readonly RESET = '\x1b[0m';
	private static readonly BOLD = '\x1b[1m';
	private static readonly DIM = '\x1b[2m';

	// Text colors
	private static readonly RED = '\x1b[31m';
	private static readonly GREEN = '\x1b[32m';
	private static readonly YELLOW = '\x1b[33m';
	private static readonly BLUE = '\x1b[34m';
	private static readonly MAGENTA = '\x1b[35m';
	private static readonly CYAN = '\x1b[36m';
	private static readonly WHITE = '\x1b[37m';
	private static readonly GRAY = '\x1b[90m';

	// Background colors
	private static readonly BG_RED = '\x1b[41m';
	private static readonly BG_GREEN = '\x1b[42m';

	/**
	 * Check if colors should be disabled (CI environments, non-TTY, etc.)
	 */
	private static get shouldUseColors(): boolean {
		// Check for common environment variables that indicate no color support
		if (process.env.NO_COLOR || process.env.CI === 'true') {
			return false;
		}

		// Check if stdout is a TTY (terminal)
		if (process.stdout && typeof process.stdout.isTTY === 'boolean') {
			return process.stdout.isTTY;
		}

		// Default to true for better developer experience
		return true;
	}

	/**
	 * Apply color formatting if colors are supported
	 */
	private static colorize(text: string, colorCode: string): string {
		if (!this.shouldUseColors) {
			return text;
		}
		return `${colorCode}${text}${this.RESET}`;
	}

	// Public color methods
	static red(text: string): string {
		return this.colorize(text, this.RED);
	}

	static green(text: string): string {
		return this.colorize(text, this.GREEN);
	}

	static yellow(text: string): string {
		return this.colorize(text, this.YELLOW);
	}

	static blue(text: string): string {
		return this.colorize(text, this.BLUE);
	}

	static magenta(text: string): string {
		return this.colorize(text, this.MAGENTA);
	}

	static cyan(text: string): string {
		return this.colorize(text, this.CYAN);
	}

	static gray(text: string): string {
		return this.colorize(text, this.GRAY);
	}

	static dim(text: string): string {
		return this.colorize(text, this.DIM);
	}

	static bold(text: string): string {
		return this.colorize(text, this.BOLD);
	}

	static redBold(text: string): string {
		return this.colorize(text, this.BOLD + this.RED);
	}

	static greenBold(text: string): string {
		return this.colorize(text, this.BOLD + this.GREEN);
	}

	/**
	 * Format a clickable file path with colors
	 * File path in blue, line:column numbers in gray/dim
	 */
	static formatFilePath(filePath: string): string {
		// Split the path and line:column info
		const parts = filePath.split(':');
		if (parts.length >= 3) {
			// We have file:line:column format
			const file = parts.slice(0, -2).join(':'); // Handle paths with colons and ensure forward slashes
			const line = parts[parts.length - 2];
			const column = parts[parts.length - 1];

			return `${this.blue(file)}${this.gray(`:${line}:${column}`)}`;
		}

		// Fallback: just color the whole path blue and ensure forward slashes
		return this.blue(filePath);
	}

	/**
	 * Format a violation number (e.g., "1.", "2.")
	 */
	static formatViolationNumber(number: string): string {
		return this.redBold(number);
	}

	/**
	 * Format a violation type/category
	 */
	static formatViolationType(type: string): string {
		return this.red(type);
	}

	/**
	 * Format rule descriptions
	 */
	static formatRule(rule: string): string {
		return this.yellow(rule);
	}

	/**
	 * Format metric values
	 */
	static formatMetricValue(value: string): string {
		return this.cyan(value);
	}

	/**
	 * Format success messages
	 */
	static formatSuccess(message: string): string {
		return this.green(message);
	}

	/**
	 * Format error summary headers
	 */
	static formatErrorSummary(message: string): string {
		return this.redBold(message);
	}
}
