import {
	Abstractness,
	Instability,
	DistanceFromMainSequence,
	CouplingFactor,
	NormalizedDistance,
	calculateFileDistanceMetrics,
} from './distance';
import { FileAnalysisResult } from '../extraction';
import { countDeclarations } from '../../common/util';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('../../common/util');

describe('Distance Metrics', () => {
	const mockCountDeclarations = countDeclarations as jest.MockedFunction<
		typeof countDeclarations
	>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Abstractness', () => {
		const abstractness = new Abstractness();

		it('should have correct name and description', () => {
			expect(abstractness.name).toBe('Abstractness');
			expect(abstractness.description).toContain('ratio of abstract elements');
		});

		it('should return 0 when sourceFile has no declarations', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				sourceFile: {} as any,
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 0,
				totalTypes: 0,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			mockCountDeclarations.mockReturnValue({
				total: 0,
				interfaces: 0,
				abstractClasses: 0,
				abstractMethods: 0,
			} as any);

			expect(abstractness.calculateForFile(analysisResult)).toBe(0);
		});

		it('should calculate abstractness correctly with sourceFile', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				sourceFile: {} as any,
				classes: [],
				interfaces: 2,
				abstractClasses: 1,
				concreteClasses: 7,
				totalTypes: 10,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			mockCountDeclarations.mockReturnValue({
				total: 20,
				interfaces: 2,
				abstractClasses: 1,
				abstractMethods: 2,
			} as any);

			expect(abstractness.calculateForFile(analysisResult)).toBe(5 / 20);
		});

		it('should fall back to legacy calculation without sourceFile', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 2,
				abstractClasses: 1,
				concreteClasses: 7,
				totalTypes: 10,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(abstractness.calculateForFile(analysisResult)).toBe(3 / 10);
		});

		it('should return 0 when totalTypes is 0 in legacy mode', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 0,
				totalTypes: 0,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(abstractness.calculateForFile(analysisResult)).toBe(0);
		});
	});

	describe('Instability', () => {
		const instability = new Instability();

		it('should have correct name and description', () => {
			expect(instability.name).toBe('Instability');
			expect(instability.description).toContain('instability of a file');
		});

		it('should return 0 when there is no coupling', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(instability.calculateForFile(analysisResult)).toBe(0);
		});

		it('should calculate instability correctly', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 3,
					afferentCoupling: 2,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(instability.calculateForFile(analysisResult)).toBe(3 / 5);
		});

		it('should return 1 when only efferent coupling exists', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 5,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(instability.calculateForFile(analysisResult)).toBe(1);
		});

		it('should return 0 when only afferent coupling exists', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 5,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(instability.calculateForFile(analysisResult)).toBe(0);
		});
	});

	describe('DistanceFromMainSequence', () => {
		const distance = new DistanceFromMainSequence();

		it('should have correct name and description', () => {
			expect(distance.name).toBe('DistanceFromMainSequence');
			expect(distance.description).toContain('Robert Martin');
		});

		it('should return 0 when on main sequence (A + I = 1)', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 3,
				abstractClasses: 0,
				concreteClasses: 7,
				totalTypes: 10,
				dependencies: {
					efferentCoupling: 7,
					afferentCoupling: 3,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(distance.calculateForFile(analysisResult)).toBeCloseTo(0, 5);
		});

		it('should calculate distance correctly for concrete stable file', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 10,
				totalTypes: 10,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 10,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(distance.calculateForFile(analysisResult)).toBe(1);
		});

		it('should calculate distance correctly for abstract unstable file', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 10,
				abstractClasses: 0,
				concreteClasses: 0,
				totalTypes: 10,
				dependencies: {
					efferentCoupling: 10,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(distance.calculateForFile(analysisResult)).toBe(1);
		});
	});

	describe('CouplingFactor', () => {
		const coupling = new CouplingFactor();

		it('should have correct name and description', () => {
			expect(coupling.name).toBe('CouplingFactor');
			expect(coupling.description).toContain('tightly coupled');
		});

		it('should return 0 when no coupling exists', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 0,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(coupling.calculateForFile(analysisResult)).toBe(0);
		});

		it('should calculate coupling factor with totalFiles', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 3,
					afferentCoupling: 2,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(coupling.calculateForFile(analysisResult, 11)).toBe(0.5);
		});

		it('should use default normalization without totalFiles', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 3,
					afferentCoupling: 2,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(coupling.calculateForFile(analysisResult)).toBe(0.5);
		});

		it('should cap at 1 for excessive coupling', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 10,
					afferentCoupling: 10,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(coupling.calculateForFile(analysisResult, 5)).toBe(1);
		});

		it('should return 0 when totalFiles is 1', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 3,
					afferentCoupling: 2,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			expect(coupling.calculateForFile(analysisResult, 1)).toBe(0);
		});
	});

	describe('NormalizedDistance', () => {
		const normalizedDistance = new NormalizedDistance();

		it('should have correct name and description', () => {
			expect(normalizedDistance.name).toBe('NormalizedDistance');
			expect(normalizedDistance.description).toContain('size-adjusted');
		});

		it('should reduce distance for larger files with sourceFile', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				sourceFile: {} as any,
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 10,
				totalTypes: 10,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 10,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			mockCountDeclarations.mockReturnValue({
				total: 50,
				interfaces: 0,
				abstractClasses: 0,
				abstractMethods: 0,
			} as any);

			const result = normalizedDistance.calculateForFile(analysisResult);
			expect(result).toBeLessThan(1);
			expect(result).toBeCloseTo(0.75, 2);
		});

		it('should use totalTypes when sourceFile is not available', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 50,
				totalTypes: 50,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 10,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			const result = normalizedDistance.calculateForFile(analysisResult);
			expect(result).toBeLessThan(1);
			expect(result).toBeCloseTo(0.75, 2);
		});

		it('should cap size factor at 1 for very large files', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				sourceFile: {} as any,
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 200,
				totalTypes: 200,
				dependencies: {
					efferentCoupling: 0,
					afferentCoupling: 10,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			mockCountDeclarations.mockReturnValue({
				total: 200,
				interfaces: 0,
				abstractClasses: 0,
				abstractMethods: 0,
			} as any);

			const result = normalizedDistance.calculateForFile(analysisResult);
			expect(result).toBe(0.5);
		});
	});

	describe('calculateFileDistanceMetrics', () => {
		it('should calculate all metrics for a file', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 3,
				abstractClasses: 0,
				concreteClasses: 7,
				totalTypes: 10,
				dependencies: {
					efferentCoupling: 7,
					afferentCoupling: 3,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};
			const result = calculateFileDistanceMetrics(analysisResult, 20);

			expect(result).toMatchObject({
				filePath: 'test.ts',
				abstractness: 0.3,
				instability: 0.7,
				distanceFromMainSequence: expect.any(Number),
				couplingFactor: expect.any(Number),
				normalizedDistance: expect.any(Number),
				analysisResult,
			});
			expect(result.distanceFromMainSequence).toBeCloseTo(0, 5);
		});

		it('should work without totalFiles parameter', () => {
			const analysisResult: FileAnalysisResult = {
				filePath: 'test.ts',
				classes: [],
				interfaces: 0,
				abstractClasses: 0,
				concreteClasses: 5,
				totalTypes: 5,
				dependencies: {
					efferentCoupling: 2,
					afferentCoupling: 3,
					outgoingDependencies: [],
					incomingDependencies: [],
				},
			};

			const result = calculateFileDistanceMetrics(analysisResult);

			expect(result).toMatchObject({
				filePath: 'test.ts',
				abstractness: 0,
				instability: 0.4,
				distanceFromMainSequence: 0.6,
				couplingFactor: 0.5,
				normalizedDistance: expect.any(Number),
				analysisResult,
			});
		});
	});
});
