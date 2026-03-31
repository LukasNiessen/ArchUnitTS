import { Checkable, CheckOptions } from '../../common/fluentapi';
import { ResultFactory, TestResult, TestViolation } from '../common/result-factory';
import { ViolationFactory } from '../common/violation-factory';
import { jasmineMatcher } from './jasmine-adapter';

jest.mock('../common/result-factory');
jest.mock('../common/violation-factory');

describe('jasmineMatcher', () => {
	let mockResultFactory: jest.Mocked<typeof ResultFactory>;
	let mockViolationFactory: jest.Mocked<typeof ViolationFactory>;

	beforeEach(() => {
		mockResultFactory = ResultFactory as jest.Mocked<typeof ResultFactory>;
		mockViolationFactory = ViolationFactory as jest.Mocked<typeof ViolationFactory>;
		jest.clearAllMocks();
	});

	describe('toPassAsync', () => {
		it('should return a matcher with a compare function', () => {
			const matcher = jasmineMatcher.toPassAsync();
			expect(matcher).toHaveProperty('compare');
			expect(typeof matcher.compare).toBe('function');
		});

		it('should return failure when checkable is null', async () => {
			const matcher = jasmineMatcher.toPassAsync();
			const result = await matcher.compare(null as unknown as Checkable);

			expect(result).toEqual({
				pass: false,
				message:
					'expected something checkable as an argument for expect()',
			});
		});

		it('should return failure when checkable is undefined', async () => {
			const matcher = jasmineMatcher.toPassAsync();
			const result = await matcher.compare(undefined as unknown as Checkable);

			expect(result).toEqual({
				pass: false,
				message:
					'expected something checkable as an argument for expect()',
			});
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

			mockViolationFactory.from.mockReturnValue(
				mockProcessedViolation as unknown as TestViolation
			);
			mockResultFactory.result.mockReturnValue(mockResult as unknown as TestResult);

			const matcher = jasmineMatcher.toPassAsync();
			const result = await matcher.compare(mockCheckable);

			expect(mockCheckable.check).toHaveBeenCalled();
			expect(mockViolationFactory.from).toHaveBeenCalledWith(
				mockViolations[0]
			);
			expect(mockResultFactory.result).toHaveBeenCalledWith(false, [
				mockProcessedViolation,
			]);
			expect(result.pass).toBe(true);
			expect(result.message).toBe('success');
		});

		it('should handle multiple violations', async () => {
			const mockViolations = [
				{ type: 'error1' },
				{ type: 'error2' },
			];
			const mockCheckable: Checkable = {
				check: jest.fn().mockResolvedValue(mockViolations),
			};
			const mockProcessedViolations = [
				{ message: 'v1', details: {} },
				{ message: 'v2', details: {} },
			];

			mockViolationFactory.from
				.mockReturnValueOnce(mockProcessedViolations[0] as unknown as TestViolation)
				.mockReturnValueOnce(mockProcessedViolations[1] as unknown as TestViolation);
			mockResultFactory.result.mockReturnValue({
				pass: false,
				message: jest.fn().mockReturnValue('2 violations'),
			} as unknown as TestResult);

			const matcher = jasmineMatcher.toPassAsync();
			await matcher.compare(mockCheckable);

			expect(mockViolationFactory.from).toHaveBeenCalledTimes(2);
			expect(mockResultFactory.result).toHaveBeenCalledWith(
				false,
				mockProcessedViolations
			);
		});

		it('should pass CheckOptions to checkable.check', async () => {
			const options: CheckOptions = { allowEmptyTests: true };
			const mockCheckable: Checkable = {
				check: jest.fn().mockResolvedValue([]),
			};
			mockResultFactory.result.mockReturnValue({
				pass: true,
				message: jest.fn().mockReturnValue('passed'),
			} as unknown as TestResult);

			const matcher = jasmineMatcher.toPassAsync();
			await matcher.compare(mockCheckable, options);

			expect(mockCheckable.check).toHaveBeenCalledWith(options);
		});
	});
});
