import { gatherCycleViolations } from './free-of-cycles';
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
					isNegated: false,
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
						{ cumulatedEdges: [], sourceLabel: 'a', targetLabel: 'b' },
						{ cumulatedEdges: [], sourceLabel: 'b', targetLabel: 'a' },
					],
					isNegated: false,
				},
				{
					cycle: [
						{ cumulatedEdges: [], sourceLabel: 'a', targetLabel: 'd' },
						{ cumulatedEdges: [], sourceLabel: 'd', targetLabel: 'a' },
					],
					isNegated: false,
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
			expect(violations).toEqual([
				{
					cycle: [
						{ cumulatedEdges: [], sourceLabel: 'aa', targetLabel: 'ab' },
						{ cumulatedEdges: [], sourceLabel: 'ab', targetLabel: 'aa' },
					],
					isNegated: false,
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
