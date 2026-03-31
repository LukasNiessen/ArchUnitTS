import path from 'path';
import { extractGraph, clearGraphCache } from '../../src/common/extraction';

describe('extractGraph', () => {
	const sampleTsConfig = path.resolve(
		__dirname,
		'..',
		'files',
		'integration',
		'samples',
		'namingsample',
		'tsconfig.json'
	);

	beforeEach(() => {
		clearGraphCache();
	});

	it('should extract internal edges for a known project', async () => {
		const edges = await extractGraph(sampleTsConfig);

		// Filter to only internal (non-external) edges, which is what the library
		// uses for all assertions. External edges come from type declarations.
		const internalEdges = edges.filter((e) => !e.external);

		// The namingsample project has 5 files:
		//   controllers/Controller.ts -> services/Service.ts
		//   services/Service.ts -> controllers/Controller.ts
		//   services/ServiceA.ts -> controllers/Controller.ts
		//   services/ServiceB.ts -> controllers/Controller.ts
		//   services/SService.ts -> controllers/Controller.ts
		// = 5 import edges + 5 self-referencing edges = 10 internal edges
		expect(internalEdges).toHaveLength(10);
	});

	it('should include self-referencing edges for all project files', async () => {
		const edges = await extractGraph(sampleTsConfig);

		const selfEdges = edges.filter((e) => e.source === e.target && !e.external);
		// One self-referencing edge per project file (5 files)
		expect(selfEdges).toHaveLength(5);

		const selfEdgeFiles = selfEdges.map((e) => e.source).sort();
		expect(selfEdgeFiles).toEqual([
			'src/controllers/Controller.ts',
			'src/services/SService.ts',
			'src/services/Service.ts',
			'src/services/ServiceA.ts',
			'src/services/ServiceB.ts',
		]);
	});

	it('should produce correct import edges between project files', async () => {
		const edges = await extractGraph(sampleTsConfig);

		const importEdges = edges.filter(
			(e) => e.source !== e.target && !e.external
		);
		expect(importEdges).toHaveLength(5);

		// Controller.ts imports from Service.ts
		expect(importEdges).toContainEqual(
			expect.objectContaining({
				source: 'src/controllers/Controller.ts',
				target: 'src/services/Service.ts',
				external: false,
			})
		);

		// Service.ts imports from Controller.ts (creates a cycle)
		expect(importEdges).toContainEqual(
			expect.objectContaining({
				source: 'src/services/Service.ts',
				target: 'src/controllers/Controller.ts',
				external: false,
			})
		);
	});

	it('should mark project-to-project edges as not external', async () => {
		const edges = await extractGraph(sampleTsConfig);

		// All edges between src/ files should be internal
		const srcEdges = edges.filter(
			(e) => e.source.startsWith('src/') && e.target.startsWith('src/')
		);
		srcEdges.forEach((edge) => {
			expect(edge.external).toBe(false);
		});
	});

	it('should return cached result on second call', async () => {
		const edges1 = await extractGraph(sampleTsConfig);
		const edges2 = await extractGraph(sampleTsConfig);

		// Same reference — served from cache
		expect(edges1).toBe(edges2);
	});

	it('should return fresh result after clearGraphCache', async () => {
		const edges1 = await extractGraph(sampleTsConfig);
		clearGraphCache();
		const edges2 = await extractGraph(sampleTsConfig);

		// Different reference — re-extracted
		expect(edges1).not.toBe(edges2);
		// But same content
		expect(edges2).toHaveLength(edges1.length);
	});

	it('should return fresh result when clearCache option is set', async () => {
		const edges1 = await extractGraph(sampleTsConfig);
		const edges2 = await extractGraph(sampleTsConfig, { clearCache: true });

		expect(edges1).not.toBe(edges2);
		expect(edges2).toHaveLength(edges1.length);
	});

	it('should throw TechnicalError for non-existent tsconfig', async () => {
		await expect(
			extractGraph('/non/existent/tsconfig.json')
		).rejects.toThrow();
	});
});
