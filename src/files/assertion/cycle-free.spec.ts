import { gatherCycleViolations } from './cycle-free';
import { ProjectedEdge } from '../../common/projection/project-edges';

describe('freeOfCycles', () => {
	describe('when not negated', () => {
		it('should find one violation', () => {
			const edges = [
				simpleEdge('a', 'b'),
				simpleEdge('b', 'c'),
				simpleEdge('c', 'a'),
			];
			const violations = gatherCycleViolations(edges, []);
			expect(violations).toEqual([
				{
					cycle: [
						{
							cumulatedEdges: [
								{
									source: 'a',
									target: 'b',
									external: false,
									importKinds: [],
								},
							],
							sourceLabel: 'a',
							targetLabel: 'b',
						},
						{
							cumulatedEdges: [
								{
									source: 'b',
									target: 'c',
									external: false,
									importKinds: [],
								},
							],
							sourceLabel: 'b',
							targetLabel: 'c',
						},
						{
							cumulatedEdges: [
								{
									source: 'c',
									target: 'a',
									external: false,
									importKinds: [],
								},
							],
							sourceLabel: 'c',
							targetLabel: 'a',
						},
					],
				},
			]);
		});

		it('should find two violations', () => {
			const edges = [
				simpleEdge('a', 'b'),
				simpleEdge('b', 'a'),
				simpleEdge('d', 'a'),
				simpleEdge('a', 'd'),
			];
			const violations = gatherCycleViolations(edges, []);
			expect(violations).toEqual([
				{
					cycle: [
						{
							cumulatedEdges: expect.any(Array),
							sourceLabel: 'a',
							targetLabel: 'b',
						},
						{
							cumulatedEdges: expect.any(Array),
							sourceLabel: 'b',
							targetLabel: 'a',
						},
					],
				},
				{
					cycle: [
						{
							cumulatedEdges: expect.any(Array),
							sourceLabel: 'a',
							targetLabel: 'd',
						},
						{
							cumulatedEdges: expect.any(Array),
							sourceLabel: 'd',
							targetLabel: 'a',
						},
					],
				},
			]);
		});

		it('should find one violation because of preconditions', () => {
			const edges = [
				simpleEdge('aa', 'ab'),
				simpleEdge('ab', 'aa'),
				simpleEdge('fd', 'fa'),
				simpleEdge('fa', 'fd'),
			];
			const violations = gatherCycleViolations(edges, ['a.']);
			expect(violations).toMatchObject([
				{
					cycle: [
						{
							cumulatedEdges: expect.any(Array),
							sourceLabel: 'aa',
							targetLabel: 'ab',
						},
						{
							cumulatedEdges: expect.any(Array),
							sourceLabel: 'ab',
							targetLabel: 'aa',
						},
					],
				},
			]);
		});
	});

	function simpleEdge(from: string, to: string): ProjectedEdge {
		return {
			sourceLabel: from,
			targetLabel: to,
			cumulatedEdges: [
				{
					source: from,
					target: to,
					external: false,
					importKinds: [],
				},
			],
		};
	}
});
