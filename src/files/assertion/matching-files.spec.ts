import { gatherRegexMatchingViolations, EmptyTestViolation } from './matching-files';
import { ProjectedNode } from '../../common/projection/project-nodes';

describe('matchingFiles', () => {
	describe('when not negated', () => {
		it('should find EmptyTestViolation because of prefiltering', () => {
			const edges = [node('bad/a'), node('bad/b'), node('bad/c')];
			const violations = gatherRegexMatchingViolations(edges, 'b', ['good'], false);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
			expect((violations[0] as EmptyTestViolation).patterns).toEqual(['good']);
		});

		it('should find violations because check pattern is matching', () => {
			const edges = [node('good/az'), node('good/bz'), node('good/cz')];
			const violations = gatherRegexMatchingViolations(edges, 'z', ['good'], false);
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
			const violations = gatherRegexMatchingViolations(edges, 'b', ['good'], false);
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
			const violations = gatherRegexMatchingViolations(edges, 'b', ['good'], true);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
			expect((violations[0] as EmptyTestViolation).patterns).toEqual(['good']);
		});

		it('should find no violations because check pattern is matching', () => {
			const edges = [node('good/az'), node('good/bz'), node('good/cz')];
			const violations = gatherRegexMatchingViolations(edges, 'z', ['good'], true);
			expect(violations).toEqual([]);
		});

		it('should find violations because one edge is matching check pattern', () => {
			const edges = [node('good/a'), node('good/b'), node('good/c')];
			const violations = gatherRegexMatchingViolations(edges, 'b', ['good'], true);
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
