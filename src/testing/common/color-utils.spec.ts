import { ColorUtils } from './color-utils';

describe('ColorUtils', () => {
	describe('color methods', () => {
		beforeEach(() => {
			// Mock stdout.isTTY to true to enable colors in tests
			Object.defineProperty(process.stdout, 'isTTY', {
				value: true,
				configurable: true
			});
			// Clear environment variables that disable colors
			delete process.env.NO_COLOR;
			delete process.env.CI;
		});

		afterEach(() => {
			// Restore original environment
			delete process.env.NO_COLOR;
			delete process.env.CI;
		});

		it('should apply red color', () => {
			const result = ColorUtils.red('test');
			expect(result).toContain('\x1b[31m'); // Red color code
			expect(result).toContain('test');
			expect(result).toContain('\x1b[0m'); // Reset code
		});

		it('should apply green color', () => {
			const result = ColorUtils.green('test');
			expect(result).toContain('\x1b[32m'); // Green color code
			expect(result).toContain('test');
		});

		it('should apply yellow color', () => {
			const result = ColorUtils.yellow('test');
			expect(result).toContain('\x1b[33m'); // Yellow color code
			expect(result).toContain('test');
		});

		it('should apply blue color', () => {
			const result = ColorUtils.blue('test');
			expect(result).toContain('\x1b[34m'); // Blue color code
			expect(result).toContain('test');
		});

		it('should apply magenta color', () => {
			const result = ColorUtils.magenta('test');
			expect(result).toContain('\x1b[35m'); // Magenta color code
			expect(result).toContain('test');
		});

		it('should apply cyan color', () => {
			const result = ColorUtils.cyan('test');
			expect(result).toContain('\x1b[36m'); // Cyan color code
			expect(result).toContain('test');
		});

		it('should apply gray color', () => {
			const result = ColorUtils.gray('test');
			expect(result).toContain('\x1b[90m'); // Gray color code
			expect(result).toContain('test');
		});

		it('should apply dim formatting', () => {
			const result = ColorUtils.dim('test');
			expect(result).toContain('\x1b[2m'); // Dim code
			expect(result).toContain('test');
		});

		it('should apply bold formatting', () => {
			const result = ColorUtils.bold('test');
			expect(result).toContain('\x1b[1m'); // Bold code
			expect(result).toContain('test');
		});

		it('should apply red bold formatting', () => {
			const result = ColorUtils.redBold('test');
			expect(result).toContain('\x1b[1m'); // Bold code
			expect(result).toContain('\x1b[31m'); // Red color code
			expect(result).toContain('test');
		});

		it('should apply green bold formatting', () => {
			const result = ColorUtils.greenBold('test');
			expect(result).toContain('\x1b[1m'); // Bold code
			expect(result).toContain('\x1b[32m'); // Green color code
			expect(result).toContain('test');
		});
	});

	describe('color disabling', () => {
		it('should disable colors when NO_COLOR is set', () => {
			process.env.NO_COLOR = '1';
			const result = ColorUtils.red('test');
			expect(result).toBe('test');
			expect(result).not.toContain('\x1b[');
		});

		it('should disable colors when CI is true', () => {
			process.env.CI = 'true';
			const result = ColorUtils.green('test');
			expect(result).toBe('test');
			expect(result).not.toContain('\x1b[');
		});

		it('should disable colors when stdout is not a TTY', () => {
			Object.defineProperty(process.stdout, 'isTTY', {
				value: false,
				configurable: true
			});
			const result = ColorUtils.blue('test');
			expect(result).toBe('test');
			expect(result).not.toContain('\x1b[');
		});
	});

	describe('formatFilePath', () => {
		beforeEach(() => {
			Object.defineProperty(process.stdout, 'isTTY', {
				value: true,
				configurable: true
			});
			delete process.env.NO_COLOR;
			delete process.env.CI;
		});

		it('should format file path with line and column', () => {
			const result = ColorUtils.formatFilePath('src/test.ts:10:5');
			expect(result).toContain('\x1b[34m'); // Blue for file path
			expect(result).toContain('\x1b[90m'); // Gray for line:column
			expect(result).toContain('src/test.ts');
			expect(result).toContain(':10:5');
		});

		it('should handle paths with colons', () => {
			const result = ColorUtils.formatFilePath('C:/Users/test/file.ts:10:5');
			expect(result).toContain('C:/Users/test/file.ts');
			expect(result).toContain(':10:5');
		});

		it('should handle paths without line:column', () => {
			const result = ColorUtils.formatFilePath('src/test.ts');
			expect(result).toContain('\x1b[34m'); // Blue for whole path
			expect(result).toContain('src/test.ts');
		});

		it('should handle paths with only one colon', () => {
			const result = ColorUtils.formatFilePath('src/test.ts:10');
			expect(result).toContain('\x1b[34m'); // Blue for whole path
			expect(result).toContain('src/test.ts:10');
		});
	});

	describe('formatting methods', () => {
		beforeEach(() => {
			Object.defineProperty(process.stdout, 'isTTY', {
				value: true,
				configurable: true
			});
			delete process.env.NO_COLOR;
			delete process.env.CI;
		});

		it('should format violation number', () => {
			const result = ColorUtils.formatViolationNumber('1.');
			expect(result).toContain('\x1b[1m'); // Bold
			expect(result).toContain('\x1b[31m'); // Red
			expect(result).toContain('1.');
		});

		it('should format violation type', () => {
			const result = ColorUtils.formatViolationType('Error');
			expect(result).toContain('\x1b[31m'); // Red
			expect(result).toContain('Error');
		});

		it('should format rule description', () => {
			const result = ColorUtils.formatRule('This is a rule');
			expect(result).toContain('\x1b[33m'); // Yellow
			expect(result).toContain('This is a rule');
		});

		it('should format metric value', () => {
			const result = ColorUtils.formatMetricValue('42');
			expect(result).toContain('\x1b[36m'); // Cyan
			expect(result).toContain('42');
		});

		it('should format success message', () => {
			const result = ColorUtils.formatSuccess('All tests passed');
			expect(result).toContain('\x1b[32m'); // Green
			expect(result).toContain('All tests passed');
		});

		it('should format error summary', () => {
			const result = ColorUtils.formatErrorSummary('Tests failed');
			expect(result).toContain('\x1b[1m'); // Bold
			expect(result).toContain('\x1b[31m'); // Red
			expect(result).toContain('Tests failed');
		});
	});
});
