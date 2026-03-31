import { Checkable, CheckOptions } from '../../common/fluentapi';
import { ResultFactory } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';
import { extendVitestMatchers } from './vitest-adapter';

jest.mock('../common/result-factory');
jest.mock('../common/violation-factory');

describe('extendVitestMatchers', () => {
	let mockResultFactory: jest.Mocked<typeof ResultFactory>;
	let mockViolationFactory: jest.Mocked<typeof ViolationFactory>;

	beforeEach(() => {
		mockResultFactory = ResultFactory as jest.Mocked<typeof ResultFactory>;
		mockViolationFactory = ViolationFactory as jest.Mocked<typeof ViolationFactory>;
		jest.clearAllMocks();
	});

	it('should throw an error when expect is not defined', () => {
		const originalExpect = (globalThis as any).expect;
		try {
			(globalThis as any).expect = undefined;
			// We can't call expect() after removing it, so we use a try/catch
			let threw = false;
			let errorMessage = '';
			try {
				extendVitestMatchers();
			} catch (e: any) {
				threw = true;
				errorMessage = e.message;
			}
			// Restore before asserting
			(globalThis as any).expect = originalExpect;
			expect(threw).toBe(true);
			expect(errorMessage).toContain('ArchUnitTS Vitest Integration Error');
		} catch (e) {
			(globalThis as any).expect = originalExpect;
			throw e;
		}
	});

	it('should not throw when force is false and not a vitest project', () => {
		const originalVitest = process.env.VITEST;
		delete process.env.VITEST;
		try {
			// force=false and no VITEST env var should just return early
			expect(() => extendVitestMatchers(false)).not.toThrow();
		} finally {
			if (originalVitest !== undefined) {
				process.env.VITEST = originalVitest;
			}
		}
	});

	it('should call expect.extend when expect is available', () => {
		const extendSpy = jest.spyOn(expect, 'extend');
		extendVitestMatchers();
		expect(extendSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				toPassAsync: expect.any(Function),
			})
		);
		extendSpy.mockRestore();
	});

	describe('toPassAsync matcher', () => {
		let toPassAsync: Function;

		beforeEach(() => {
			const extendSpy = jest.spyOn(expect, 'extend');
			extendVitestMatchers();
			toPassAsync = extendSpy.mock.calls[0][0].toPassAsync;
			extendSpy.mockRestore();
		});

		it('should return error when checkable is null', async () => {
			mockResultFactory.error.mockReturnValue({
				pass: false,
				message: () =>
					'expected something checkable as an argument for expect()',
			});

			const result = await toPassAsync.call({ isNot: false }, null);

			expect(mockResultFactory.error).toHaveBeenCalledWith(
				'expected something checkable as an argument for expect()'
			);
			expect(result.pass).toBe(false);
		});

		it('should return error when checkable is undefined', async () => {
			mockResultFactory.error.mockReturnValue({
				pass: false,
				message: () =>
					'expected something checkable as an argument for expect()',
			});

			const result = await toPassAsync.call({ isNot: false }, undefined);

			expect(mockResultFactory.error).toHaveBeenCalledWith(
				'expected something checkable as an argument for expect()'
			);
		});

		it('should process violations and return result', async () => {
			const mockViolations = [{ type: 'test' }];
			const mockCheckable: Checkable = {
				check: jest.fn().mockResolvedValue(mockViolations),
			};
			const mockProcessedViolation = { message: 'test', details: {} };
			const mockResult = {
				pass: true,
				message: jest.fn().mockReturnValue('success'),
			};

			mockViolationFactory.from.mockReturnValue(mockProcessedViolation as any);
			mockResultFactory.result.mockReturnValue(mockResult as any);

			const result = await toPassAsync.call({ isNot: false }, mockCheckable);

			expect(mockCheckable.check).toHaveBeenCalled();
			expect(mockViolationFactory.from).toHaveBeenCalledWith(mockViolations[0]);
			expect(mockResultFactory.result).toHaveBeenCalledWith(false, [
				mockProcessedViolation,
			]);
		});

		it('should pass isNot flag to ResultFactory', async () => {
			const mockCheckable: Checkable = {
				check: jest.fn().mockResolvedValue([]),
			};
			const mockResult = {
				pass: true,
				message: jest.fn().mockReturnValue('success'),
			};

			mockResultFactory.result.mockReturnValue(mockResult as any);

			await toPassAsync.call({ isNot: true }, mockCheckable);

			expect(mockResultFactory.result).toHaveBeenCalledWith(true, []);
		});

		it('should pass CheckOptions to checkable.check', async () => {
			const options: CheckOptions = { allowEmptyTests: true };
			const mockCheckable: Checkable = {
				check: jest.fn().mockResolvedValue([]),
			};
			const mockResult = {
				pass: true,
				message: jest.fn().mockReturnValue('success'),
			};

			mockResultFactory.result.mockReturnValue(mockResult as any);

			await toPassAsync.call({ isNot: false }, mockCheckable, options);

			expect(mockCheckable.check).toHaveBeenCalledWith(options);
		});
	});
});
