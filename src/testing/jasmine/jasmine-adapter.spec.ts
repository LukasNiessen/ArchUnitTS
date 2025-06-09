import { Checkable, CheckOptions } from '../../common/fluentapi';
import { ResultFactory } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';
import { extendJasmineMatchers } from './jasmine-adapter';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock the dependencies
jest.mock('../common/result-factory');
jest.mock('../common/violation-factory');

describe('extendJasmineMatchers', () => {
	let originalJasmine: unknown;
	let originalBeforeEach: unknown;
	let mockAddMatchers: jest.Mock;
	let mockBeforeEach: jest.Mock;
	let mockResultFactory: jest.Mocked<typeof ResultFactory>;
	let mockViolationFactory: jest.Mocked<typeof ViolationFactory>;

	beforeEach(() => {
		// Store original global values
		originalJasmine = (globalThis as any).jasmine;
		originalBeforeEach = (globalThis as any).beforeEach;

		// Setup mocks
		mockAddMatchers = jest.fn();
		mockBeforeEach = jest.fn();
		mockResultFactory = ResultFactory as jest.Mocked<typeof ResultFactory>;
		mockViolationFactory = ViolationFactory as jest.Mocked<typeof ViolationFactory>;

		// Clear all mocks
		jest.clearAllMocks();
	});

	afterEach(() => {
		// Restore original global values
		(globalThis as any).jasmine = originalJasmine;
		(globalThis as any).beforeEach = originalBeforeEach;
	});

	describe('when jasmine is not available', () => {
		beforeEach(() => {
			(globalThis as any).jasmine = undefined;
		});

		it('should not throw an error', () => {
			expect(() => extendJasmineMatchers()).not.toThrow();
		});

		it('should not call any matchers or beforeEach functions', () => {
			extendJasmineMatchers();
			expect(mockAddMatchers).not.toHaveBeenCalled();
			expect(mockBeforeEach).not.toHaveBeenCalled();
		});
	});

	describe('when jasmine is available but addMatchers is not', () => {
		beforeEach(() => {
			(globalThis as any).jasmine = {};
			(globalThis as any).beforeEach = mockBeforeEach;
		});

		it('should not call addMatchers or beforeEach', () => {
			extendJasmineMatchers();
			expect(mockAddMatchers).not.toHaveBeenCalled();
			expect(mockBeforeEach).not.toHaveBeenCalled();
		});
	});

	describe('when jasmine is available but beforeEach is not', () => {
		beforeEach(() => {
			(globalThis as any).jasmine = { addMatchers: mockAddMatchers };
			(globalThis as any).beforeEach = undefined;
		});

		it('should not call addMatchers or beforeEach', () => {
			extendJasmineMatchers();
			expect(mockAddMatchers).not.toHaveBeenCalled();
			expect(mockBeforeEach).not.toHaveBeenCalled();
		});
	});

	describe('when both jasmine and beforeEach are available', () => {
		let registeredBeforeEachCallback: () => void;

		beforeEach(() => {
			(globalThis as any).jasmine = { addMatchers: mockAddMatchers };
			(globalThis as any).beforeEach = mockBeforeEach;

			mockBeforeEach.mockImplementation((callback: () => void) => {
				registeredBeforeEachCallback = callback;
			});

			extendJasmineMatchers();
		});

		it('should call beforeEach with a callback', () => {
			expect(mockBeforeEach).toHaveBeenCalledTimes(1);
			expect(mockBeforeEach).toHaveBeenCalledWith(expect.any(Function));
		});

		it('should register toPassAsync matcher when beforeEach callback is executed', () => {
			registeredBeforeEachCallback();

			expect(mockAddMatchers).toHaveBeenCalledTimes(1);
			expect(mockAddMatchers).toHaveBeenCalledWith({
				toPassAsync: expect.any(Function),
			});
		});

		describe('toPassAsync matcher', () => {
			let toPassAsyncFactory: () => {
				compare: (
					checkable: Checkable,
					options?: CheckOptions
				) => Promise<{ pass: boolean; message: string }>;
			};

			beforeEach(() => {
				registeredBeforeEachCallback();
				const matchersArg = mockAddMatchers.mock.calls[0][0];
				toPassAsyncFactory = matchersArg.toPassAsync;
			});

			it('should return a matcher with compare function', () => {
				const matcher = toPassAsyncFactory();
				expect(matcher).toHaveProperty('compare');
				expect(typeof matcher.compare).toBe('function');
			});

			describe('compare function', () => {
				let compareFunction: (
					checkable: Checkable,
					options?: CheckOptions
				) => Promise<{ pass: boolean; message: string }>;

				beforeEach(() => {
					const matcher = toPassAsyncFactory();
					compareFunction = matcher.compare;
				});

				it('should return failure when checkable is null', async () => {
					const result = await compareFunction(null as any);

					expect(result).toEqual({
						pass: false,
						message:
							'expected something checkable as an argument for expect()',
					});
				});

				it('should return failure when checkable is undefined', async () => {
					const result = await compareFunction(undefined as any);

					expect(result).toEqual({
						pass: false,
						message:
							'expected something checkable as an argument for expect()',
					});
				});

				it('should create result through ResultFactory', async () => {
					const mockViolations = [{ type: 'error' }];
					const mockCheckable: Checkable = {
						check: jest.fn().mockResolvedValue(mockViolations),
					};
					const mockProcessedViolation = { processed: true };
					const mockResult = {
						pass: true,
						message: jest.fn().mockReturnValue('test message'),
					};

					mockViolationFactory.from.mockReturnValue(
						mockProcessedViolation as any
					);
					mockResultFactory.result.mockReturnValue(mockResult as any);

					await compareFunction(mockCheckable);

					expect(mockResultFactory.result).toHaveBeenCalledTimes(1);
					expect(mockResultFactory.result).toHaveBeenCalledWith(false, [
						mockProcessedViolation,
					]);
				});

				it('should return result with pass and message from ResultFactory', async () => {
					const mockCheckable: Checkable = {
						check: jest.fn().mockResolvedValue([]),
					};
					const mockResult = {
						pass: true,
						message: jest.fn().mockReturnValue('success message'),
					};

					mockViolationFactory.from.mockReturnValue({} as any);
					mockResultFactory.result.mockReturnValue(mockResult as any);

					const result = await compareFunction(mockCheckable);

					expect(mockResult.message).toHaveBeenCalledTimes(1);
					expect(result).toEqual({
						pass: true,
						message: 'success message',
					});
				});

				it('should handle multiple violations', async () => {
					const mockViolations = [
						{ type: 'error1', message: 'first violation' },
						{ type: 'error2', message: 'second violation' },
					];
					const mockCheckable: Checkable = {
						check: jest.fn().mockResolvedValue(mockViolations),
					};
					const mockProcessedViolations = [
						{ processed: true, id: 1 },
						{ processed: true, id: 2 },
					];

					mockViolationFactory.from
						.mockReturnValueOnce(mockProcessedViolations[0] as any)
						.mockReturnValueOnce(mockProcessedViolations[1] as any);

					await compareFunction(mockCheckable);

					expect(mockViolationFactory.from).toHaveBeenCalledTimes(2);
					expect(mockViolationFactory.from).toHaveBeenNthCalledWith(
						1,
						mockViolations[0]
					);
					expect(mockViolationFactory.from).toHaveBeenNthCalledWith(
						2,
						mockViolations[1]
					);
					expect(mockResultFactory.result).toHaveBeenCalledWith(
						false,
						mockProcessedViolations
					);
				});

				it('should handle async violations processing', async () => {
					const mockCheckable: Checkable = {
						check: jest.fn().mockResolvedValue([{ async: 'violation' }]),
					};

					mockViolationFactory.from.mockReturnValue({
						processed: 'async',
					} as any);
					mockResultFactory.result.mockReturnValue({
						pass: false,
						message: jest.fn().mockReturnValue('async failure'),
					} as any);

					const result = await compareFunction(mockCheckable);

					expect(result.pass).toBe(false);
					expect(result.message).toBe('async failure');
				});
			});
		});
	});

	describe('edge cases', () => {
		it('should handle jasmine object without proper typing', () => {
			const mockJasmineObject = {
				addMatchers: mockAddMatchers,
				someOtherProperty: 'test',
			};

			(globalThis as any).jasmine = mockJasmineObject;
			(globalThis as any).beforeEach = mockBeforeEach;

			expect(() => extendJasmineMatchers()).not.toThrow();
			expect(mockBeforeEach).toHaveBeenCalledTimes(1);
		});

		it('should handle beforeEach function without proper typing', () => {
			(globalThis as any).jasmine = { addMatchers: mockAddMatchers };
			(globalThis as any).beforeEach = mockBeforeEach;

			expect(() => extendJasmineMatchers()).not.toThrow();
			expect(mockBeforeEach).toHaveBeenCalledTimes(1);
		});
	});
});
