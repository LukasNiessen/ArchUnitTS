import { ResultFactory, TestViolation } from './result-factory';
import { ColorUtils } from './color-utils';

describe('ResultFactory', () => {
	beforeEach(() => {
		// Mock stdout.isTTY to true to enable colors in tests
		Object.defineProperty(process.stdout, 'isTTY', {
			value: true,
			configurable: true
		});
		delete process.env.NO_COLOR;
		delete process.env.CI;
	});

	describe('result', () => {
		it('should return passing result when no violations', () => {
			const result = ResultFactory.result(false, []);

			expect(result.pass).toBe(true);
			expect(result.message()).toContain('Architecture rule validation passed');
			expect(result.message()).not.toContain('expected to not pass');
		});

		it('should return passing result with shouldNotPass message when shouldNotPass is true', () => {
			const result = ResultFactory.result(true, []);

			expect(result.pass).toBe(true);
			expect(result.message()).toContain('expected to not pass');
		});

		it('should return failing result with single violation', () => {
			const violations: TestViolation[] = [
				{
					message: 'Test violation message',
					details: { type: 'test' }
				}
			];

			const result = ResultFactory.result(false, violations);

			expect(result.pass).toBe(false);
			expect(result.message()).toContain('Architecture rule failed with 1 violation:');
			expect(result.message()).toContain('1.');
			expect(result.message()).toContain('Test violation message');
		});

		it('should return failing result with multiple violations', () => {
			const violations: TestViolation[] = [
				{
					message: 'First violation',
					details: { type: 'test1' }
				},
				{
					message: 'Second violation',
					details: { type: 'test2' }
				},
				{
					message: 'Third violation',
					details: { type: 'test3' }
				}
			];

			const result = ResultFactory.result(false, violations);

			expect(result.pass).toBe(false);
			expect(result.message()).toContain('Architecture rule failed with 3 violations:');
			expect(result.message()).toContain('1.');
			expect(result.message()).toContain('First violation');
			expect(result.message()).toContain('2.');
			expect(result.message()).toContain('Second violation');
			expect(result.message()).toContain('3.');
			expect(result.message()).toContain('Third violation');
		});

		it('should format violation numbers and messages correctly', () => {
			const violations: TestViolation[] = [
				{
					message: 'Test message',
					details: {}
				}
			];

			const result = ResultFactory.result(false, violations);
			const message = result.message();

			// Should contain ANSI color codes for formatting
			expect(message).toContain('\x1b['); // Some ANSI code should be present
		});
	});

	describe('error', () => {
		it('should return error result with formatted message', () => {
			const result = ResultFactory.error('Something went wrong');

			expect(result.pass).toBe(false);
			expect(result.message()).toContain('Error: Something went wrong');
			expect(result.message()).toContain('\x1b['); // Should contain ANSI color codes
		});

		it('should format error messages in red bold', () => {
			const result = ResultFactory.error('Test error');

			const message = result.message();
			expect(message).toContain('\x1b[1m'); // Bold
			expect(message).toContain('\x1b[31m'); // Red
			expect(message).toContain('Error: Test error');
		});
	});

	describe('without colors', () => {
		beforeEach(() => {
			process.env.NO_COLOR = '1';
		});

		it('should work without color formatting', () => {
			const violations: TestViolation[] = [
				{
					message: 'Test violation',
					details: {}
				}
			];

			const result = ResultFactory.result(false, violations);

			expect(result.pass).toBe(false);
			expect(result.message()).toContain('Architecture rule failed with 1 violation:');
			expect(result.message()).toContain('Test violation');
			expect(result.message()).not.toContain('\x1b['); // No ANSI codes
		});

		it('should format error without colors', () => {
			const result = ResultFactory.error('Test error');

			expect(result.pass).toBe(false);
			expect(result.message()).toBe('Error: Test error');
		});
	});
});
