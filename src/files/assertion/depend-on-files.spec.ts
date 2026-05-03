import { gatherDependOnFileViolations } from './depend-on-files';
import { ProjectedEdge } from '../../common/projection/project-edges';
import { RegexFactory } from '../../common/regex-factory';

describe('dependOnFiles', () => {
	describe('when negated', () => {
		it('should find violations', () => {
			const edges = [
				simpleEdge('a', 'b'),
				simpleEdge('b', 'c'),
				simpleEdge('a', 'c'),
			];
			const violations = gatherDependOnFileViolations(
				edges,
				[
					{
						regExp: /a/,
						options: {
							target: 'path',
						},
					},
				],
				[
					{
						regExp: /b/,
						options: {
							target: 'path',
						},
					},
				],
				true
			);
			expect(violations).toMatchObject([
				{
					dependency: {
						cumulatedEdges: expect.any(Array),
						sourceLabel: 'a',
						targetLabel: 'b',
					},
					isNegated: true,
				},
			]);
		});

		it('should find multiple violations', () => {
			const edges = [
				simpleEdge('a1', 'b'),
				simpleEdge('a2', 'c'),
				simpleEdge('b', 'c'),
			];
			const violations = gatherDependOnFileViolations(
				edges,
				[
					{
						regExp: /a./,
						options: {
							target: 'path',
						},
					},
				],
				[
					{
						regExp: /(b|c)/,
						options: {
							target: 'path',
						},
					},
				],
				true
			);
			expect(violations).toMatchObject([
				{
					dependency: {
						cumulatedEdges: expect.any(Array),
						sourceLabel: 'a1',
						targetLabel: 'b',
					},
					isNegated: true,
				},
				{
					dependency: {
						cumulatedEdges: expect.any(Array),
						sourceLabel: 'a2',
						targetLabel: 'c',
					},
					isNegated: true,
				},
			]);
		});

		it('should not report dependencies that match target exclusions', () => {
			const edges = [
				simpleEdge(
					'src/app/customers/customer.component.ts',
					'src/app/orders/index.ts'
				),
				simpleEdge(
					'src/app/customers/customer.component.ts',
					'src/app/orders/internal/order.service.ts'
				),
			];
			const violations = gatherDependOnFileViolations(
				edges,
				[RegexFactory.pathMatcher('src/app/customers/**')],
				[
					RegexFactory.folderMatcher('src/app/orders/**', {
						except: ['index.ts', 'public-api.ts'],
					}),
				],
				true
			);

			expect(violations).toMatchObject([
				{
					dependency: {
						sourceLabel: 'src/app/customers/customer.component.ts',
						targetLabel: 'src/app/orders/internal/order.service.ts',
					},
					isNegated: true,
				},
			]);
		});

		it('should not report dependencies whose source matches source exclusions', () => {
			const edges = [
				simpleEdge(
					'src/app/orders/orders-shell.component.ts',
					'src/app/orders/internal/order.service.ts'
				),
				simpleEdge(
					'src/app/customers/customer.component.ts',
					'src/app/orders/internal/order.service.ts'
				),
			];
			const violations = gatherDependOnFileViolations(
				edges,
				[
					RegexFactory.pathMatcher('src/app/**/*.ts', {
						except: 'src/app/orders/**',
					}),
				],
				[RegexFactory.folderMatcher('src/app/orders/**')],
				true
			);

			expect(violations).toMatchObject([
				{
					dependency: {
						sourceLabel: 'src/app/customers/customer.component.ts',
						targetLabel: 'src/app/orders/internal/order.service.ts',
					},
					isNegated: true,
				},
			]);
		});

		it('should throw a user error when no patterns are given', () => {
			expect(() => gatherDependOnFileViolations([], [], [], true)).toThrow(
				'object and subject patterns must be set'
			);
		});
	});

	describe('when not negated', () => {
		it('should throw a user error when no patterns are given', () => {
			expect(() => gatherDependOnFileViolations([], [], [], false)).toThrow(
				'object and subject patterns must be set'
			);
		});

		it('should find multiple violations', () => {
			const edges = [
				simpleEdge('a', 'b'),
				simpleEdge('b', 'c'),
				simpleEdge('a', 'c'),
			];
			const violations = gatherDependOnFileViolations(
				edges,
				[
					{
						regExp: /a/,
						options: {
							target: 'path',
						},
					},
				],
				[
					{
						regExp: /b/,
						options: {
							target: 'path',
						},
					},
				],
				false
			);
			expect(violations).toHaveLength(2);
			expect(violations[0]).toMatchObject({
				dependency: {
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
				isNegated: false,
			});
			expect(violations[1]).toMatchObject({
				dependency: {
					cumulatedEdges: [
						{
							source: 'a',
							target: 'c',
							external: false,
							importKinds: [],
						},
					],
					sourceLabel: 'a',
					targetLabel: 'c',
				},
				isNegated: false,
			});
		});

		it('should not find violations', () => {
			const edges = [simpleEdge('a', 'b')];
			const violations = gatherDependOnFileViolations(
				edges,
				[
					{
						regExp: /a/,
						options: {
							target: 'path',
						},
					},
				],
				[
					{
						regExp: /b/,
						options: {
							target: 'path',
						},
					},
				],
				false
			);
			expect(violations).toEqual([]);
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
