import { ProjectedEdge, projectEdges } from './project-edges';
import { NumberEdge } from './cycles/model';
import { calculateCycles } from './cycles/cycles';
import { perInternalEdge } from './edge-projections';
import { Edge } from '../extraction/graph';

export type ProjectedCycles = Array<ProjectedEdge[]>;

export function projectInternalCycles(graph: Edge[]): ProjectedCycles {
	const edges = projectEdges(graph, perInternalEdge());
	return new CycleProcessor().findCycles(edges);
}

export function projectCycles(graph: ProjectedEdge[]): ProjectedCycles {
	return new CycleProcessor().findCycles(graph);
}

class CycleProcessor {
	private labelToId: Map<string, number> = new Map<string, number>();
	private idToLabel: Map<number, string> = new Map<number, string>();
	private sourceEdges: ProjectedEdge[] = [];

	findCycles(edges: ProjectedEdge[]): ProjectedCycles {
		const domainEdges = this.toDomain(edges);
		const cycles = calculateCycles(domainEdges);
		const result = this.fromDomain(cycles);
		this.clear();
		return result;
	}

	private clear() {
		this.labelToId = new Map<string, number>();
		this.idToLabel = new Map<number, string>();
		this.sourceEdges = [];
	}

	private toDomain(filteredEdges: ProjectedEdge[]): NumberEdge[] {
		this.sourceEdges = filteredEdges;
		this.labelToId = new Map<string, number>();
		this.idToLabel = new Map<number, string>();
		let index = 0;
		filteredEdges.forEach((e) => {
			if (!this.labelToId.has(e.sourceLabel)) {
				this.labelToId.set(e.sourceLabel, index);
				this.idToLabel.set(index++, e.sourceLabel);
			}
			if (!this.labelToId.has(e.targetLabel)) {
				this.labelToId.set(e.targetLabel, index);
				this.idToLabel.set(index++, e.targetLabel);
			}
		});
		return filteredEdges.map((e) => {
			const fromId = this.labelToId.get(e.sourceLabel);
			const toId = this.labelToId.get(e.targetLabel);

			if (fromId === undefined || toId === undefined) {
				throw new Error('Label IDs should be defined at this point');
			}

			return {
				from: fromId,
				to: toId,
			};
		});
	}

	private fromDomain(cycles: NumberEdge[][]): ProjectedEdge[][] {
		return cycles.map((c) => {
			return c.map((e) => {
				const sourceLabel = this.idToLabel.get(e.from);
				const targetLabel = this.idToLabel.get(e.to);
				const foundEdge = this.sourceEdges.find(
					(e) => e.sourceLabel === sourceLabel && e.targetLabel === targetLabel
				);

				if (!foundEdge) {
					throw new Error('Edge should be found at this point');
				}

				return foundEdge;
			});
		});
	}
}
