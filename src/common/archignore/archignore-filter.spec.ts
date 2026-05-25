import { ArchIgnoreFilter } from './archignore-filter';
import { ArchIgnoreParser } from './archignore-parser';
import { Graph } from '../extraction/graph';

describe('ArchIgnoreFilter', () => {
	let filter: ArchIgnoreFilter;

	beforeEach(() => {
		const parser = ArchIgnoreParser.fromString('node_modules/\ndist/\n');
		filter = new ArchIgnoreFilter(parser);
	});

	describe('graph filtering', () => {
		it('should remove edges with ignored source', () => {
			const graph: Graph = [
				{
					source: 'src/index.ts',
					target: 'node_modules/lib/index.js',
					external: false,
					importKinds: ['default'],
				},
				{
					source: 'src/handler.ts',
					target: 'src/service.ts',
					external: false,
					importKinds: ['named'],
				},
			];

			const filtered = filter.filterGraph(graph);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].source).toBe('src/handler.ts');
		});

		it('should remove edges with ignored target', () => {
			const graph: Graph = [
				{
					source: 'src/index.ts',
					target: 'dist/index.js',
					external: false,
					importKinds: ['default'],
				},
				{
					source: 'src/handler.ts',
					target: 'src/service.ts',
					external: false,
					importKinds: ['named'],
				},
			];

			const filtered = filter.filterGraph(graph);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].target).toBe('src/service.ts');
		});

		it('should keep edges between non-ignored files', () => {
			const graph: Graph = [
				{
					source: 'src/handler.ts',
					target: 'src/service.ts',
					external: false,
					importKinds: ['named'],
				},
				{
					source: 'src/service.ts',
					target: 'src/utils.ts',
					external: false,
					importKinds: ['default'],
				},
			];

			const filtered = filter.filterGraph(graph);

			expect(filtered).toHaveLength(2);
		});
	});

	describe('ignored file counting', () => {
		it('should count unique ignored files', () => {
			const graph: Graph = [
				{
					source: 'src/index.ts',
					target: 'node_modules/lib/index.js',
					external: false,
					importKinds: [],
				},
				{
					source: 'dist/bundle.js',
					target: 'src/service.ts',
					external: false,
					importKinds: [],
				},
				{
					source: 'node_modules/lib/index.js',
					target: 'dist/bundle.js',
					external: false,
					importKinds: [],
				},
			];

			const count = filter.getIgnoredFileCount(graph);

			// Should count: node_modules/lib/index.js and dist/bundle.js
			expect(count).toBe(2);
		});

		it('should get list of ignored files', () => {
			const graph: Graph = [
				{
					source: 'src/index.ts',
					target: 'node_modules/lib/index.js',
					external: false,
					importKinds: [],
				},
				{
					source: 'dist/bundle.js',
					target: 'src/service.ts',
					external: false,
					importKinds: [],
				},
			];

			const ignored = filter.getIgnoredFiles(graph);

			expect(ignored).toContain('node_modules/lib/index.js');
			expect(ignored).toContain('dist/bundle.js');
			expect(ignored).not.toContain('src/index.ts');
		});
	});

	describe('single file checking', () => {
		it('should check if single file should be ignored', () => {
			expect(filter.shouldIgnore('node_modules/package.json')).toBe(true);
			expect(filter.shouldIgnore('dist/index.js')).toBe(true);
			expect(filter.shouldIgnore('src/index.ts')).toBe(false);
		});
	});
});
