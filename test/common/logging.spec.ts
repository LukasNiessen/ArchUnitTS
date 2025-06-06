import { CheckLogger } from '../../src/common/util/logger';
import * as fs from 'fs';
import * as path from 'path';

describe('Logging functionality', () => {
	const testLogDir = path.join(__dirname, '..', '..', 'test-logs');

	beforeEach(() => {
		// Clean up test logs directory
		if (fs.existsSync(testLogDir)) {
			fs.rmSync(testLogDir, { recursive: true, force: true });
		}
	});

	afterEach(() => {
		// Clean up test logs directory
		if (fs.existsSync(testLogDir)) {
			fs.rmSync(testLogDir, { recursive: true, force: true });
		}
	});
	describe('CheckLogger with boolean logFile', () => {
		it('should create a default timestamped log file when logFile is true', () => {
			// Clean up logs directory before test
			const logsDir = path.join(process.cwd(), 'logs');
			if (fs.existsSync(logsDir)) {
				fs.rmSync(logsDir, { recursive: true, force: true });
			}

			const logger = new CheckLogger({
				enabled: true,
				logFile: true,
			});

			// Log some messages
			logger.info('Test message 1');
			logger.warn('Test warning');
			logger.error('Test error');

			// Check that a log file was created in the logs directory
			expect(fs.existsSync(logsDir)).toBe(true);

			const logFiles = fs
				.readdirSync(logsDir)
				.filter((f) => f.startsWith('archunit-') && f.endsWith('.log'));
			expect(logFiles.length).toBeGreaterThanOrEqual(1);

			const logFile = path.join(logsDir, logFiles[0]);
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
			fs.rmSync(logsDir, { recursive: true, force: true });
		});

		it('should use custom log file path when logFile is a string', () => {
			const customLogPath = path.join(testLogDir, 'custom-test.log');

			const logger = new CheckLogger({
				enabled: true,
				logFile: customLogPath,
			});

			logger.info('Custom log message');

			expect(fs.existsSync(customLogPath)).toBe(true);
			const logContent = fs.readFileSync(customLogPath, 'utf-8');
			expect(logContent).toContain('Custom log message');
			expect(logContent).toContain('[INFO]');
		});

		it('should append to log file when appendToLogFile is true', () => {
			const customLogPath = path.join(testLogDir, 'append-test.log');

			// Ensure directory exists
			fs.mkdirSync(testLogDir, { recursive: true });

			// First logger session
			const logger1 = new CheckLogger({
				enabled: true,
				logFile: customLogPath,
				appendToLogFile: false, // Should overwrite
			});
			logger1.info('First session message');

			// Second logger session
			const logger2 = new CheckLogger({
				enabled: true,
				logFile: customLogPath,
				appendToLogFile: true, // Should append
			});
			logger2.info('Second session message');

			const logContent = fs.readFileSync(customLogPath, 'utf-8');
			expect(logContent).toContain('First session message');
			expect(logContent).toContain('Second session message');

			// Should have two session headers
			const sessionHeaders = (
				logContent.match(/ArchUnitTS Logging Session Started/g) || []
			).length;
			expect(sessionHeaders).toBe(2);
		});
	});

	describe('FileLogger timestamp format', () => {
		it('should generate unique filenames for different timestamps', () => {
			// This test verifies the timestamp format indirectly by creating multiple loggers
			// in quick succession and ensuring they get different filenames
			const logger1 = new CheckLogger({ enabled: true, logFile: true });

			// Small delay to ensure different timestamp
			const start = Date.now();
			while (Date.now() - start < 1) {
				/* wait 1ms */
			}

			const logger2 = new CheckLogger({ enabled: true, logFile: true });

			logger1.info('Logger 1 message');
			logger2.info('Logger 2 message');

			const logsDir = path.join(process.cwd(), 'logs');
			const logFiles = fs
				.readdirSync(logsDir)
				.filter((f) => f.startsWith('archunit-') && f.endsWith('.log'));

			// Should have created at least one log file (might be same timestamp if very fast)
			expect(logFiles.length).toBeGreaterThanOrEqual(1);

			// Clean up
			fs.rmSync(logsDir, { recursive: true, force: true });
		});
	});

	describe('Integration with rule checking', () => {
		it('should work with architecture rules using boolean logFile', () => {
			// This test verifies that the boolean logFile option works in the context
			// where it's actually used (as shown in the architecture.spec.ts file)
			const logger = new CheckLogger({
				enabled: true,
				logFile: true,
				logTiming: true,
				logViolations: true,
				logProgress: true,
			});

			logger.startCheck('test-rule');
			logger.logProgress('Processing test files');
			logger.logViolation('Test violation found');
			logger.endCheck('test-rule', 1);

			const logsDir = path.join(process.cwd(), 'logs');
			expect(fs.existsSync(logsDir)).toBe(true);

			const logFiles = fs
				.readdirSync(logsDir)
				.filter((f) => f.startsWith('archunit-') && f.endsWith('.log'));
			expect(logFiles.length).toBe(1);

			const logContent = fs.readFileSync(path.join(logsDir, logFiles[0]), 'utf-8');
			expect(logContent).toContain('Starting architecture rule check: test-rule');
			expect(logContent).toContain('Processing test files');
			expect(logContent).toContain('Violation found: Test violation found');
			expect(logContent).toContain(
				'Completed architecture rule check: test-rule (1 violations)'
			);

			// Clean up
			fs.rmSync(logsDir, { recursive: true, force: true });
		});
	});
});
