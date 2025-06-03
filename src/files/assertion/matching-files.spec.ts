import { gatherRegexMatchingViolations } from './matching-files';
import { ProjectedNode } from '../../common/projection/project-nodes';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { Filter } from '../../common/type';

describe('matchingFiles', () => {
	describe('when not negated', () => {
		it('should find EmptyTestViolation because of prefiltering', () => {
			const edges = [node('bad/a'), node('bad/b'), node('bad/c')];
			const violations = gatherRegexMatchingViolations(
				edges,
				stringToFilterHelper('b'),
				[stringToFilterHelper('good')],
				false
			);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
		});

		it('should find violations because check pattern is matching', () => {
			const edges = [node('good/az'), node('good/bz'), node('good/cz')];
			const violations = gatherRegexMatchingViolations(
				edges,
				stringToFilterHelper('z'),
				[stringToFilterHelper('good')],
				false
			);
			expect(violations).toEqual([
				{
					checkPattern: 'z',
					projectedNode: { label: 'good/az', incoming: [], outgoing: [] },
					isNegated: false,
				},
				{
					checkPattern: 'z',
					projectedNode: { label: 'good/bz', incoming: [], outgoing: [] },
					isNegated: false,
				},
				{
					checkPattern: 'z',
					projectedNode: { label: 'good/cz', incoming: [], outgoing: [] },
					isNegated: false,
				},
			]);
		});

		it('should find violations because not all edges are matching check pattern', () => {
			const edges = [node('good/a'), node('good/b'), node('good/c')];
			const violations = gatherRegexMatchingViolations(
				edges,
				stringToFilterHelper('b'),
				[stringToFilterHelper('good')],
				false
			);
			expect(violations).toEqual([
				{
					checkPattern: 'b',
					projectedNode: { label: 'good/a', incoming: [], outgoing: [] },
					isNegated: false,
				},
				{
					checkPattern: 'b',
					projectedNode: { label: 'good/c', incoming: [], outgoing: [] },
					isNegated: false,
				},
			]);
		});
	});

	describe('when negated', () => {
		it('should find EmptyTestViolation because of prefiltering', () => {
			const edges = [node('bad/a'), node('bad/b'), node('bad/c')];
			const violations = gatherRegexMatchingViolations(
				edges,
				stringToFilterHelper('b'),
				[stringToFilterHelper('good')],
				true
			);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
		});

		it('should find no violations because check pattern is matching', () => {
			const edges = [node('good/az'), node('good/bz'), node('good/cz')];
			const violations = gatherRegexMatchingViolations(
				edges,
				stringToFilterHelper('z'),
				[stringToFilterHelper('good')],
				true
			);
			expect(violations).toEqual([]);
		});

		it('should find violations because one edge is matching check pattern', () => {
			const edges = [node('good/a'), node('good/b'), node('good/c')];
			const violations = gatherRegexMatchingViolations(
				edges,
				stringToFilterHelper('b'),
				[stringToFilterHelper('good')],
				true
			);
			expect(violations).toEqual([
				{
					checkPattern: 'b',
					projectedNode: { label: 'good/b', incoming: [], outgoing: [] },
					isNegated: true,
				},
			]);
		});
	});

	function node(label: string): ProjectedNode {
		return { label: label, incoming: [], outgoing: [] };
	}
});

function stringToFilterHelper(inp: string): Filter {
	return {
		regExp: new RegExp(inp),
		options: {
			target: 'path',
		},
	};
}
