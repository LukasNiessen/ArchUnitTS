import { CycleUtils } from './cycle-utils';
import { NumberEdge, NumberNode } from './model';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('CycleUtils', () => {
	describe('getOutgoingNeighbours', () => {
		it('should return empty array when node has no outgoing edges', () => {
			const currentNode: NumberNode = {
				node: 1,
				incoming: [],
				outgoing: [],
			};
			const graph: NumberNode[] = [currentNode];

			const result = CycleUtils.getOutgoingNeighbours(currentNode, graph);

			expect(result).toEqual([]);
		});

		it('should return neighbour nodes for outgoing edges', () => {
			const node1: NumberNode = {
				node: 1,
				incoming: [],
				outgoing: [
					{ from: 1, to: 2 },
					{ from: 1, to: 3 },
				],
			};
			const node2: NumberNode = {
				node: 2,
				incoming: [{ from: 1, to: 2 }],
				outgoing: [],
			};
			const node3: NumberNode = {
				node: 3,
				incoming: [{ from: 1, to: 3 }],
				outgoing: [],
			};
			const graph = [node1, node2, node3];

			const result = CycleUtils.getOutgoingNeighbours(node1, graph);

			expect(result).toEqual([node2, node3]);
		});

		it('should filter out nodes not found in graph', () => {
			const currentNode: NumberNode = {
				node: 1,
				incoming: [],
				outgoing: [
					{ from: 1, to: 2 },
					{ from: 1, to: 99 },
				],
			};
			const node2: NumberNode = {
				node: 2,
				incoming: [{ from: 1, to: 2 }],
				outgoing: [],
			};
			const graph = [currentNode, node2];

			const result = CycleUtils.getOutgoingNeighbours(currentNode, graph);

			expect(result).toEqual([node2]);
		});
	});

	describe('transformEdgeData', () => {
		it('should return empty array for empty edges', () => {
			const result = CycleUtils.transformEdgeData([]);

			expect(result).toEqual([]);
		});

		it('should transform single edge correctly', () => {
			const edges: NumberEdge[] = [{ from: 1, to: 2 }];

			const result = CycleUtils.transformEdgeData(edges);

			expect(result).toHaveLength(2);
			expect(result).toContainEqual({
				node: 1,
				incoming: [],
				outgoing: [{ from: 1, to: 2 }],
			});
			expect(result).toContainEqual({
				node: 2,
				incoming: [{ from: 1, to: 2 }],
				outgoing: [],
			});
		});

		it('should handle multiple edges between same nodes', () => {
			const edges: NumberEdge[] = [
				{ from: 1, to: 2 },
				{ from: 1, to: 2 },
				{ from: 2, to: 1 },
			];

			const result = CycleUtils.transformEdgeData(edges);

			expect(result).toHaveLength(2);
			expect(result).toContainEqual({
				node: 1,
				incoming: [{ from: 2, to: 1 }],
				outgoing: [
					{ from: 1, to: 2 },
					{ from: 1, to: 2 },
				],
			});
			expect(result).toContainEqual({
				node: 2,
				incoming: [
					{ from: 1, to: 2 },
					{ from: 1, to: 2 },
				],
				outgoing: [{ from: 2, to: 1 }],
			});
		});

		it('should handle complex graph structure', () => {
			const edges: NumberEdge[] = [
				{ from: 1, to: 2 },
				{ from: 2, to: 3 },
				{ from: 3, to: 1 },
				{ from: 2, to: 4 },
			];

			const result = CycleUtils.transformEdgeData(edges);

			expect(result).toHaveLength(4);
			expect(result.find((n: any) => n.node === 1)).toEqual({
				node: 1,
				incoming: [{ from: 3, to: 1 }],
				outgoing: [{ from: 1, to: 2 }],
			});
			expect(result.find((n: any) => n.node === 2)).toEqual({
				node: 2,
				incoming: [{ from: 1, to: 2 }],
				outgoing: [
					{ from: 2, to: 3 },
					{ from: 2, to: 4 },
				],
			});
			expect(result.find((n: any) => n.node === 3)).toEqual({
				node: 3,
				incoming: [{ from: 2, to: 3 }],
				outgoing: [{ from: 3, to: 1 }],
			});
			expect(result.find((n: any) => n.node === 4)).toEqual({
				node: 4,
				incoming: [{ from: 2, to: 4 }],
				outgoing: [],
			});
		});
	});

	describe('findUniqueNodes', () => {
		it('should return empty array for empty edges', () => {
			const result = CycleUtils.findUniqueNodes([]);

			expect(result).toEqual([]);
		});

		it('should find unique nodes from single edge', () => {
			const edges: NumberEdge[] = [{ from: 1, to: 2 }];

			const result = CycleUtils.findUniqueNodes(edges);

			expect(result).toEqual([1, 2]);
		});

		it('should not duplicate nodes', () => {
			const edges: NumberEdge[] = [
				{ from: 1, to: 2 },
				{ from: 2, to: 3 },
				{ from: 1, to: 3 },
			];

			const result = CycleUtils.findUniqueNodes(edges);

			expect(result).toEqual([1, 2, 3]);
		});

		it('should handle self-referencing edges', () => {
			const edges: NumberEdge[] = [
				{ from: 1, to: 1 },
				{ from: 2, to: 2 },
			];

			const result = CycleUtils.findUniqueNodes(edges);

			expect(result).toEqual([1, 2]);
		});

		it('should preserve order of first appearance', () => {
			const edges: NumberEdge[] = [
				{ from: 3, to: 1 },
				{ from: 1, to: 2 },
				{ from: 2, to: 3 },
			];

			const result = CycleUtils.findUniqueNodes(edges);

			expect(result).toEqual([3, 1, 2]);
		});
	});
});
