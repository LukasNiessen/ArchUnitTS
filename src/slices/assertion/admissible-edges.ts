import { Violation } from '../../common/assertion/violation';
import { ProjectedEdge, ProjectedGraph } from '../../common/projection/project-edges';

export type Rule = {
	source: string;
	target: string;
};

export class ViolatingEdge implements Violation {
	public rule: Rule | null;
	public projectedEdge: ProjectedEdge;
	public isNegated: boolean;

	constructor(
		rule: Rule | null,
		projectedEdge: ProjectedEdge,
		isNegated: boolean = false
	) {
		this.rule = rule;
		this.projectedEdge = projectedEdge;
		this.isNegated = isNegated;
	}
}

export const gatherViolations = (
	graph: ProjectedEdge[],
	forbidden: Rule[]
): ViolatingEdge[] => {
	const violatingEdges: ViolatingEdge[] = [];
	for (const edge of graph) {
		for (const rule of forbidden) {
			if (edge.sourceLabel === rule.source && edge.targetLabel === rule.target) {
				violatingEdges.push(new ViolatingEdge(rule, edge, false));
			}
		}
	}
	return violatingEdges;
};

export const gatherPositiveViolations = (
	graph: ProjectedGraph,
	allowed: Rule[],
	nodesOfInterest: string[],
	ignoreNonListed: boolean
): ViolatingEdge[] => {
	const violatingEdges: ViolatingEdge[] = [];
	for (const edge of graph) {
		if (
			ignoreNonListed &&
			!(
				nodesOfInterest.includes(edge.sourceLabel) &&
				nodesOfInterest.includes(edge.targetLabel)
			)
		) {
			continue;
		}

		const match = allowed.find((allowedRule) => {
			return (
				edge.sourceLabel === allowedRule.source &&
				edge.targetLabel === allowedRule.target
			);
		});
		if (match === undefined) {
			violatingEdges.push(new ViolatingEdge(null, edge, false));
		}
	}
	return violatingEdges;
};

export interface CoherenceOptions {
	ignoreOrphans?: boolean;
	ignoreExternal?: boolean;
}

/**
 * Checks for complete coherence in the architecture, ensuring all nodes are properly connected
 * according to the defined rules.
 *
 * @param graph The projected graph to check
 * @param allowed List of allowed rules
 * @param nodes List of nodes that should be checked for coherence
 * @param options Configuration options for coherence checking
 * @returns List of violations where coherence rules are broken
 */
export const checkCoherence = (
	graph: ProjectedGraph,
	allowed: Rule[],
	nodes: string[],
	options: CoherenceOptions = {}
): ViolatingEdge[] => {
	const violations: ViolatingEdge[] = [];

	const { ignoreOrphans = false } = options;

	// Create a map of all allowed source -> target connections
	const allowedConnections = new Map<string, string[]>();

	for (const rule of allowed) {
		if (!allowedConnections.has(rule.source)) {
			allowedConnections.set(rule.source, []);
		}
		allowedConnections.get(rule.source)?.push(rule.target);
	}

	// Check for nodes that should have connections but don't
	for (const node of nodes) {
		// Skip if this node doesn't have any defined rules
		if (!allowedConnections.has(node)) {
			continue;
		}

		// Get actual edges for this node
		const nodeEdges = graph.filter((edge) => edge.sourceLabel === node);

		// Check that each allowed target is actually connected
		const expectedTargets = allowedConnections.get(node) || [];
		for (const expectedTarget of expectedTargets) {
			const hasConnection = nodeEdges.some(
				(edge) => edge.targetLabel === expectedTarget
			);

			if (!hasConnection) {
				// This is a coherence violation - missing a required connection
				violations.push(
					new ViolatingEdge(
						{ source: node, target: expectedTarget },
						{
							sourceLabel: node,
							targetLabel: expectedTarget,
							cumulatedEdges: [],
						},
						true
					)
				);
			}
		}

		// Check for orphaned nodes (no incoming or outgoing edges) if not ignoring orphans
		if (!ignoreOrphans && nodeEdges.length === 0) {
			const incomingEdges = graph.filter((edge) => edge.targetLabel === node);
			if (incomingEdges.length === 0) {
				// This node is completely orphaned - no connections at all
				violations.push(
					new ViolatingEdge(
						null,
						{
							sourceLabel: node,
							targetLabel: node, // Self-reference to indicate orphan
							cumulatedEdges: [],
						},
						true
					)
				);
			}
		}
	}

	return violations;
};
