import { gatherRegexMatchingViolations } from './matching-files';
import { ProjectedNode } from '../../common/projection/project-nodes';
import { EmptyTestViolation } from '../../common/assertion/EmptyTestViolation';
import { RegexFactory } from '../../common/regex-factory';

describe('matchingFiles', () => {
	describe('when not negated', () => {
		it('should find EmptyTestViolation because of prefiltering', () => {
			const edges = [node('bad/a'), node('bad/b'), node('bad/c')];
			const violations = gatherRegexMatchingViolations(
				edges,
				RegexFactory.folderMatcher('b'),
				[RegexFactory.folderMatcher('good')],
				false
			);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
		});

		it('should find violations because check pattern is matching', () => {
			const edges = [node('good/az'), node('good/bz'), node('good/cz')];
			const violations = gatherRegexMatchingViolations(
				edges,
				RegexFactory.folderMatcher('z'),
				[RegexFactory.folderMatcher('good')],
				false
			);
			expect(violations).toEqual([
				{
					checkPattern: '^z$',
					projectedNode: { label: 'good/az', incoming: [], outgoing: [] },
					isNegated: false,
				},
				{
					checkPattern: '^z$',
					projectedNode: { label: 'good/bz', incoming: [], outgoing: [] },
					isNegated: false,
				},
				{
					checkPattern: '^z$',
					projectedNode: { label: 'good/cz', incoming: [], outgoing: [] },
					isNegated: false,
				},
			]);
		});

		it('should find violations because not all edges are matching check pattern', () => {
			const edges = [node('good/a'), node('good/b'), node('good/bro/c')];
			const violations = gatherRegexMatchingViolations(
				edges,
				RegexFactory.folderMatcher('good'),
				[RegexFactory.folderMatcher('good/**')],
				false
			);
			expect(violations).toMatchObject([
				{
					checkPattern: expect.any(String),
					projectedNode: { label: 'good/bro/c', incoming: [], outgoing: [] },
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
				RegexFactory.folderMatcher('b'),
				[RegexFactory.folderMatcher('good')],
				true
			);
			expect(violations).toHaveLength(1);
			expect(violations[0]).toBeInstanceOf(EmptyTestViolation);
		});

		it('should find no violations because check pattern is matching', () => {
			const edges = [node('good/az'), node('good/bz'), node('good/cz')];
			const violations = gatherRegexMatchingViolations(
				edges,
				RegexFactory.folderMatcher('z'),
				[RegexFactory.folderMatcher('good')],
				true
			);
			expect(violations).toEqual([]);
		});

		it('should find no violations because we inverted it (true param)', () => {
			const edges = [node('good/a'), node('good/b'), node('good/c')];
			const violations = gatherRegexMatchingViolations(
				edges,
				RegexFactory.folderMatcher('sss'),
				[RegexFactory.folderMatcher('good/**')],
				true
			);
			expect(violations).toHaveLength(0);
		});
	});

	function node(label: string): ProjectedNode {
		return { label: label, incoming: [], outgoing: [] };
	}
});
