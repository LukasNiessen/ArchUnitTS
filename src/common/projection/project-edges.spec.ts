import { Edge } from '../extraction/graph';
import { projectEdges } from './project-edges';

const edge = (source: string, target: string): Edge => ({
	source,
	target,
	external: false,
	importKinds: [],
});

const folder = (path: string) => path.split('/')[0];

describe('projectEdges', () => {
	it('should merge edges with the same label pair, keeping first-seen order', () => {
		const graph = [
			edge('a/1', 'b/1'),
			edge('c/1', 'b/1'),
			edge('a/2', 'b/2'),
			edge('a/3', 'd/1'),
		];

		const projected = projectEdges(graph, (e) => ({
			sourceLabel: folder(e.source),
			targetLabel: folder(e.target),
		}));

		expect(projected.map((p) => [p.sourceLabel, p.targetLabel])).toEqual([
			['a', 'b'],
			['c', 'b'],
			['a', 'd'],
		]);
		expect(projected[0].cumulatedEdges).toEqual([graph[0], graph[2]]);
	});

	it('should not merge label pairs that would collide if joined', () => {
		const labels: Record<string, [string, string]> = {
			x: ['a', 'bc'],
			x2: ['ab', 'c'],
		};

		const projected = projectEdges([edge('x', 'y'), edge('x2', 'y2')], (e) => {
			const [sourceLabel, targetLabel] = labels[e.source];
			return { sourceLabel, targetLabel };
		});

		expect(projected).toHaveLength(2);
	});

	it('should skip edges the mapper drops', () => {
		expect(projectEdges([edge('a', 'b')], () => undefined)).toEqual([]);
	});
});
