import { ViolationFactory } from './violation-factory';
import { ViolatingNode } from '../../files/assertion/matching-files';
import { ViolatingCycle } from '../../files/assertion/cycle-free';
import { ViolatingFileDependency } from '../../files/assertion/depend-on-files';
import { ViolatingEdge } from '../../slices/assertion/admissible-edges';
import { CustomFileViolation } from '../../files/assertion/custom-file-logic';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { MetricViolation } from '../../metrics/assertion/metric-thresholds';
import { FileCountViolation } from '../../metrics/fluentapi/metrics/count-metrics';
import { ProjectedNode } from '../../common/projection/project-nodes';
import { ProjectedEdge } from '../../common/projection/project-edges';
import { Violation } from '../../common/assertion';

describe('ViolationFactory', () => {
	beforeEach(() => {
		Object.defineProperty(process.stdout, 'isTTY', {
			value: true,
			configurable: true,
		});
		delete process.env.NO_COLOR;
		delete process.env.CI;
	});

	describe('from', () => {
		it('should handle ViolatingNode', () => {
			const node: ProjectedNode = {
				label: 'src/test.ts',
				incoming: [],
				outgoing: [],
			};
			const violation = new ViolatingNode('*.test.ts', node, false);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('File pattern violation');
			expect(result.details).toBe(violation);
		});

		it('should handle negated ViolatingNode', () => {
			const node: ProjectedNode = {
				label: 'src/test.ts',
				incoming: [],
				outgoing: [],
			};
			const violation = new ViolatingNode('*.test.ts', node, true);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('should not match');
		});

		it('should handle EmptyTestViolation', () => {
			const violation = new EmptyTestViolation(['src/**/*.ts']);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('Empty test violation');
			expect(result.details).toBe(violation);
		});

		it('should handle ViolatingEdge', () => {
			const edge: ProjectedEdge = {
				sourceLabel: 'sliceA',
				targetLabel: 'sliceB',
				cumulatedEdges: [],
			};
			const violation = new ViolatingEdge(null, edge);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('Slice dependency violation');
			expect(result.details).toBe(violation);
		});

		it('should handle ViolatingCycle', () => {
			const edges: ProjectedEdge[] = [
				{
					sourceLabel: 'a.ts',
					targetLabel: 'b.ts',
					cumulatedEdges: [],
				},
				{
					sourceLabel: 'b.ts',
					targetLabel: 'a.ts',
					cumulatedEdges: [],
				},
			];
			const violation = new ViolatingCycle(edges);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('Circular dependency detected');
			expect(result.details).toBe(violation);
		});

		it('should handle ViolatingFileDependency', () => {
			const edge: ProjectedEdge = {
				sourceLabel: 'src/a.ts',
				targetLabel: 'src/b.ts',
				cumulatedEdges: [],
			};
			const violation = new ViolatingFileDependency(edge);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('File dependency violation');
			expect(result.details).toBe(violation);
		});

		it('should handle MetricViolation', () => {
			const violation = new MetricViolation(
				'MyClass',
				'src/my-class.ts',
				'methodCount',
				15,
				10,
				'below'
			);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('Metric violation');
			expect(result.message).toContain('MyClass');
			expect(result.details).toBe(violation);
		});

		it('should handle FileCountViolation', () => {
			const violation = new FileCountViolation(
				'src/test.ts',
				'linesOfCode',
				200,
				100,
				'below'
			);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('File count violation');
			expect(result.details).toBe(violation);
		});

		it('should handle CustomFileViolation', () => {
			const fileInfo = {
				path: 'src/test.ts',
				name: 'test',
				extension: 'ts',
				directory: 'src',
				content: 'const x = 1;',
				linesOfCode: 1,
			};
			const violation = new CustomFileViolation(
				'Custom rule failed',
				fileInfo,
				'custom-rule'
			);

			const result = ViolationFactory.from(violation);

			expect(result.message).toContain('Custom file condition violation');
			expect(result.message).toContain('Custom rule failed');
			expect(result.details).toBe(violation);
		});

		it('should return UnknownTestViolation for unknown types', () => {
			const unknownViolation = { someField: 'value' } as unknown as Violation;

			const result = ViolationFactory.from(unknownViolation);

			expect(result.message).toBe('Unknown Violation found');
		});
	});
});
