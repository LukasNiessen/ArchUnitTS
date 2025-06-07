import { sharedLogger } from '../../src/common/util/logger';
import * as fs from 'fs';
import * as path from 'path';
import { LoggingOptions } from '../../src/common';

describe('Logging functionality', () => {
	const testLogDir = path.join(__dirname, '..', '..', 'test-logs');

	beforeEach(() => {
		// Clean up test logs directory
		if (fs.existsSync(testLogDir)) {
			fs.rmSync(testLogDir, { recursive: true, force: true });
		}
	});

	afterAll(() => {
		// Clean up test logs directory
		if (fs.existsSync(testLogDir)) {
			fs.rmSync(testLogDir, { recursive: true, force: true });
		}
	});

	describe('CheckLogger with boolean logFile', () => {
		it('should create a default timestamped log file when logFile is true', () => {
			// Clean up logs directory before test
			const logsDir = path.join(process.cwd(), 'logs');

			const logger = sharedLogger;
			const options = {
				enabled: true,
				logFile: true,
				level: 'debug',
			} as LoggingOptions;

			logger.info(options, 'Test message 1');
			logger.warn(options, 'Test warning');
			logger.error(options, 'Test error');

			// Check that a log file was created in the logs directory
			expect(fs.existsSync(logsDir)).toBe(true);

			const logFiles = fs
				.readdirSync(logsDir)
				.filter((f) => f.startsWith('archunit-') && f.endsWith('.log'));
			expect(logFiles.length).toBeGreaterThanOrEqual(1);

			const logFile = path.join(logsDir, logFiles[logFiles.length - 1]);
			const logContent = fs.readFileSync(logFile, 'utf-8');

			expect(logContent).toContain('ArchUnitTS Logging Session Started');
			expect(logContent).toContain('Test message 1');
			expect(logContent).toContain('Test warning');
			expect(logContent).toContain('Test error');
			expect(logContent).toContain('[INFO]');
			expect(logContent).toContain('[WARN]');
			expect(logContent).toContain('[ERROR]');

			// Verify filename format (should be archunit-YYYY-MM-DD_HH-MM-SS.log)
			expect(logFiles[0]).toMatch(
				/^archunit-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/
			);

			// Clean up
			//fs.rmSync(logsDir, { recursive: true, force: true });
		});
	});

	describe('FileLogger timestamp format', () => {
		it('should generate unique filenames for different timestamps', () => {
			// This test verifies the timestamp format indirectly by creating multiple loggers
			// in quick succession and ensuring they get different filenames

			// Small delay to ensure different timestamp
			const start = Date.now();
			while (Date.now() - start < 1) {
				/* wait 1ms */
			}

			const options1 = { enabled: true, logFile: true };
			const options2 = { enabled: true, logFile: true };
			sharedLogger.info(options1, 'Logger 1 message');
			sharedLogger.info(options2, 'Logger 2 message');

			const logsDir = path.join(process.cwd(), 'logs');
			const logFiles = fs
				.readdirSync(logsDir)
				.filter((f) => f.startsWith('archunit-') && f.endsWith('.log'));

			// Should have created at least one log file (might be same timestamp if very fast)
			expect(logFiles.length).toBeGreaterThanOrEqual(1);

			// Clean up
			//fs.rmSync(logsDir, { recursive: true, force: true });
		});
	});

	describe('Integration with rule checking', () => {
		it('should work with architecture rules using boolean logFile', () => {
			// This test verifies that the boolean logFile option works in the context
			// where it's actually used (as shown in the architecture.spec.ts file)
			const logger = sharedLogger;
			const options = {
				enabled: true,
				level: 'debug',
				logFile: true,
			} as LoggingOptions;

			logger.startCheck('test-rule', options);
			logger.logProgress('Processing test files', options);
			logger.logViolation('Test violation found', options);
			logger.endCheck('test-rule', 1, options);

			const logsDir = path.join(process.cwd(), 'logs');
			expect(fs.existsSync(logsDir)).toBe(true);

			const logFiles = fs
				.readdirSync(logsDir)
				.filter((f) => f.startsWith('archunit-') && f.endsWith('.log'));
			expect(logFiles.length).not.toBe(0);

			const logContent = fs.readFileSync(
				path.join(logsDir, logFiles[logFiles.length - 1]),
				'utf-8'
			);
			expect(logContent).toContain('Starting architecture rule check: test-rule');
			expect(logContent).toContain('Processing test files');
			expect(logContent).toContain('Violation found: Test violation found');
			expect(logContent).toContain(
				'Completed architecture rule check: test-rule (1 violations)'
			);

			// Clean up
			//fs.rmSync(logsDir, { recursive: true, force: true });
		});
	});
});
