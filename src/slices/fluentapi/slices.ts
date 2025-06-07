import { generateRule } from '../uml';
import { extractGraph, extractNxGraph, Graph } from '../../common/extraction';
import * as fs from 'fs';
import { TechnicalError } from '../../common/error';
import { Checkable, CheckOptions } from '../../common/fluentapi';
import { gatherPositiveViolations, gatherViolations, Rule } from '../assertion';
import { Violation } from '../../common/assertion';
import { identity, sliceByPattern } from '../projection';
import { MapFunction, projectEdges } from '../../common/projection';
import { sharedLogger } from '../../common/util';

export const projectSlices = (filename?: string): SliceConditionBuilder => {
	const graphProvider = () => extractGraph(filename);
	return new SliceConditionBuilder(graphProvider);
};

export class SliceConditionBuilder {
	mapFunction: MapFunction = identity();

	constructor(readonly graphProvider: GraphProvider) {}

	public definedBy = (pattern: string): SliceConditionBuilder => {
		this.mapFunction = sliceByPattern(pattern);
		return this;
	};

	public should = (): PositiveConditionBuilder => {
		return new PositiveConditionBuilder(this);
	};

	public shouldNot = (): NegativeSliceCondition => {
		return new NegativeSliceCondition(this, []);
	};
}

export class NegativeSliceCondition implements Checkable {
	constructor(
		readonly sliceConditionBuilder: SliceConditionBuilder,
		private readonly forbiddenEdges: Rule[]
	) {}

	public containDependency = (from: string, to: string): NegativeSliceCondition => {
		return new NegativeSliceCondition(this.sliceConditionBuilder, [
			...this.forbiddenEdges,
			{ source: from, target: to },
		]);
	};

	public check = async (): Promise<Violation[]> => {
		const graph = await this.sliceConditionBuilder.graphProvider();
		const mapped = projectEdges(graph, this.sliceConditionBuilder.mapFunction);
		return gatherViolations(mapped, this.forbiddenEdges);
	};
}

export class PositiveConditionBuilder {
	ignoreUnknownNodes = false;
	ignoreExternals = false;

	constructor(readonly sliceConditionBuilder: SliceConditionBuilder) {}

	public adhereToDiagram(diagram: string): PositiveSliceCondition {
		return new PositiveSliceCondition(this, { diagram });
	}

	public adhereToDiagramInFile(filename: string): PositiveSliceCondition {
		return new PositiveSliceCondition(this, { filename });
	}

	public ignoringUnknownNodes(): PositiveConditionBuilder {
		this.ignoreUnknownNodes = true;
		return this;
	}

	public ignoringExternalDependencies() {
		this.ignoreExternals = true;
		return this;
	}
}

export class PositiveSliceCondition implements Checkable {
	constructor(
		readonly positiveConditionBuilder: PositiveConditionBuilder,
		readonly diagram: { filename?: string; diagram?: string }
	) {}

	public async check(options?: CheckOptions): Promise<Violation[]> {
		const graph =
			await this.positiveConditionBuilder.sliceConditionBuilder.graphProvider();
		const filtered = this.positiveConditionBuilder.ignoreExternals
			? graph.filter((edge) => !edge.external)
			: graph;

		let diagram = this.diagram.diagram;
		const filename = this.diagram.filename;

		if (diagram === undefined) {
			if (filename !== undefined) {
				diagram = fs.readFileSync(filename).toString();
			} else {
				throw new TechnicalError('No diagram provided');
			}
		}
		const { rules, containedNodes } = generateRule(diagram);

		const mapped = projectEdges(
			filtered,
			this.positiveConditionBuilder.sliceConditionBuilder.mapFunction
		);

		mapped.forEach((edge) =>
			sharedLogger.info(
				options?.logging,
				`Found edge: From ${edge.sourceLabel} to ${edge.targetLabel}`
			)
		);

		return gatherPositiveViolations(
			mapped,
			rules,
			containedNodes,
			this.positiveConditionBuilder.ignoreUnknownNodes
		);
	}
}

type GraphProvider = () => Promise<Graph>;

export const slicesOfNxProject = (rootFolder?: string): SliceConditionBuilder => {
	const graphProvider = () => Promise.resolve(extractNxGraph(rootFolder));
	return new SliceConditionBuilder(graphProvider);
};
