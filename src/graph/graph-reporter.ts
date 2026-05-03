import * as fs from 'fs';
import * as path from 'path';
import { minimatch } from 'minimatch';
import { extractGraph } from '../common/extraction';
import { Edge } from '../common/extraction/graph';
import { Pattern } from '../common/type';
import { CheckOptions } from '../common/fluentapi';

export type GraphReportFormat = 'dot' | 'mermaid' | 'd2' | 'csv' | 'json' | 'html';

export interface GraphQueryOptions {
	includeExternalDependencies?: boolean;
	includeSelfDependencies?: boolean;
	focus?: Pattern;
	focusDepth?: number;
	reachableFrom?: Pattern;
	dependentsOf?: Pattern;
	collapse?: GraphCollapseStrategy;
	title?: string;
}

export type GraphCollapseStrategy =
	| {
			type: 'folder-depth';
			depth: number;
	  }
	| {
			type: 'pattern';
			pattern: RegExp;
			replacement: string;
	  };

export interface GraphReportNode {
	id: string;
	label: string;
}

export interface GraphReportEdge {
	source: string;
	target: string;
	count: number;
	external: boolean;
	importKinds: string[];
}

export interface GraphReportSnapshot {
	title: string;
	nodes: GraphReportNode[];
	edges: GraphReportEdge[];
	summary: {
		nodeCount: number;
		edgeCount: number;
		rawEdgeCount: number;
		externalEdgeCount: number;
	};
}

type NodeMatcher = (node: string) => boolean;

const DEFAULT_TITLE = 'ArchUnitTS Dependency Graph';

export const projectGraph = (tsConfigFilePath?: string): ProjectGraphBuilder => {
	return new ProjectGraphBuilder(tsConfigFilePath);
};

export const dependencyGraph = projectGraph;

export class ProjectGraphBuilder {
	constructor(
		readonly tsConfigFilePath?: string,
		private readonly options: GraphQueryOptions = {},
		private readonly checkOptions?: CheckOptions
	) {}

	public includeExternalDependencies(): ProjectGraphBuilder {
		return this.withOptions({ includeExternalDependencies: true });
	}

	public includeSelfDependencies(): ProjectGraphBuilder {
		return this.withOptions({ includeSelfDependencies: true });
	}

	public focusOn(pattern: Pattern, depth: number = 1): ProjectGraphBuilder {
		return this.withOptions({ focus: pattern, focusDepth: depth });
	}

	public reachableFrom(pattern: Pattern): ProjectGraphBuilder {
		return this.withOptions({ reachableFrom: pattern });
	}

	public dependentsOf(pattern: Pattern): ProjectGraphBuilder {
		return this.withOptions({ dependentsOf: pattern });
	}

	public collapseToFolderDepth(depth: number): ProjectGraphBuilder {
		return this.withOptions({
			collapse: {
				type: 'folder-depth',
				depth,
			},
		});
	}

	public collapseByPattern(
		pattern: RegExp,
		replacement: string = '$1'
	): ProjectGraphBuilder {
		return this.withOptions({
			collapse: {
				type: 'pattern',
				pattern,
				replacement,
			},
		});
	}

	public titled(title: string): ProjectGraphBuilder {
		return this.withOptions({ title });
	}

	public withCheckOptions(checkOptions: CheckOptions): ProjectGraphBuilder {
		return new ProjectGraphBuilder(this.tsConfigFilePath, this.options, checkOptions);
	}

	public async snapshot(): Promise<GraphReportSnapshot> {
		const graph = await extractGraph(this.tsConfigFilePath, this.checkOptions);
		return GraphReporter.createSnapshot(graph, this.options);
	}

	public async toDOT(): Promise<string> {
		return GraphReporter.toDOT(await this.getGraph(), this.options);
	}

	public async toMermaid(): Promise<string> {
		return GraphReporter.toMermaid(await this.getGraph(), this.options);
	}

	public async toD2(): Promise<string> {
		return GraphReporter.toD2(await this.getGraph(), this.options);
	}

	public async toCSV(): Promise<string> {
		return GraphReporter.toCSV(await this.getGraph(), this.options);
	}

	public async toJSON(): Promise<string> {
		return GraphReporter.toJSON(await this.getGraph(), this.options);
	}

	public async toHTML(): Promise<string> {
		return GraphReporter.toHTML(await this.getGraph(), this.options);
	}

	public async exportAsDOT(outputPath: string): Promise<void> {
		await GraphReporter.exportAsDOT(await this.getGraph(), outputPath, this.options);
	}

	public async exportAsMermaid(outputPath: string): Promise<void> {
		await GraphReporter.exportAsMermaid(
			await this.getGraph(),
			outputPath,
			this.options
		);
	}

	public async exportAsD2(outputPath: string): Promise<void> {
		await GraphReporter.exportAsD2(await this.getGraph(), outputPath, this.options);
	}

	public async exportAsCSV(outputPath: string): Promise<void> {
		await GraphReporter.exportAsCSV(await this.getGraph(), outputPath, this.options);
	}

	public async exportAsJSON(outputPath: string): Promise<void> {
		await GraphReporter.exportAsJSON(await this.getGraph(), outputPath, this.options);
	}

	public async exportAsHTML(outputPath: string): Promise<void> {
		await GraphReporter.exportAsHTML(await this.getGraph(), outputPath, this.options);
	}

	private withOptions(options: GraphQueryOptions): ProjectGraphBuilder {
		return new ProjectGraphBuilder(
			this.tsConfigFilePath,
			{ ...this.options, ...options },
			this.checkOptions
		);
	}

	private async getGraph(): Promise<Edge[]> {
		return extractGraph(this.tsConfigFilePath, this.checkOptions);
	}
}

export class GraphReporter {
	public static createSnapshot(
		graph: Edge[],
		options: GraphQueryOptions = {}
	): GraphReportSnapshot {
		const filteredByExternal = options.includeExternalDependencies
			? graph
			: graph.filter((edge) => !edge.external);
		const selectedNodes = selectNodes(filteredByExternal, options);
		const displayEdges = filteredByExternal.filter((edge) => {
			if (!options.includeSelfDependencies && edge.source === edge.target) {
				return false;
			}
			return selectedNodes.has(edge.source) && selectedNodes.has(edge.target);
		});

		const collapsedNodes = new Set<string>();
		for (const node of selectedNodes) {
			collapsedNodes.add(collapseNode(node, options.collapse));
		}

		const edgeMap = new Map<string, GraphReportEdge>();
		for (const edge of displayEdges) {
			const source = collapseNode(edge.source, options.collapse);
			const target = collapseNode(edge.target, options.collapse);

			if (!options.includeSelfDependencies && source === target) {
				continue;
			}

			const key = `${source}\u0000${target}`;
			const existing = edgeMap.get(key);
			if (existing) {
				existing.count += 1;
				existing.external = existing.external || edge.external;
				existing.importKinds = uniqueSorted([
					...existing.importKinds,
					...edge.importKinds,
				]);
			} else {
				edgeMap.set(key, {
					source,
					target,
					count: 1,
					external: edge.external,
					importKinds: uniqueSorted(edge.importKinds),
				});
			}
		}

		const edges = Array.from(edgeMap.values()).sort(compareEdges);
		const edgeNodeLabels = edges.flatMap((edge) => [edge.source, edge.target]);
		const labels = uniqueSorted([...collapsedNodes, ...edgeNodeLabels]);
		const nodes = labels.map((label, index) => ({
			id: `n${index}`,
			label,
		}));

		return {
			title: options.title || DEFAULT_TITLE,
			nodes,
			edges,
			summary: {
				nodeCount: nodes.length,
				edgeCount: edges.length,
				rawEdgeCount: displayEdges.length,
				externalEdgeCount: displayEdges.filter((edge) => edge.external).length,
			},
		};
	}

	public static toDOT(graph: Edge[], options: GraphQueryOptions = {}): string {
		const snapshot = this.createSnapshot(graph, options);
		const lines = ['digraph dependencies {', '\trankdir=LR;'];

		for (const node of snapshot.nodes) {
			lines.push(`\t${quoteDOT(node.label)};`);
		}

		for (const edge of snapshot.edges) {
			const label = edge.count > 1 ? ` [label="${edge.count}"]` : '';
			lines.push(
				`\t${quoteDOT(edge.source)} -> ${quoteDOT(edge.target)}${label};`
			);
		}

		lines.push('}');
		return lines.join('\n');
	}

	public static toMermaid(graph: Edge[], options: GraphQueryOptions = {}): string {
		const snapshot = this.createSnapshot(graph, options);
		const nodeIds = new Map(snapshot.nodes.map((node) => [node.label, node.id]));
		const lines = ['flowchart LR'];

		for (const node of snapshot.nodes) {
			lines.push(`  ${node.id}["${escapeMermaidLabel(node.label)}"]`);
		}

		for (const edge of snapshot.edges) {
			const source = nodeIds.get(edge.source);
			const target = nodeIds.get(edge.target);
			if (!source || !target) {
				continue;
			}
			const label = edge.count > 1 ? `|${edge.count}|` : '';
			lines.push(`  ${source} -->${label} ${target}`);
		}

		return lines.join('\n');
	}

	public static toD2(graph: Edge[], options: GraphQueryOptions = {}): string {
		const snapshot = this.createSnapshot(graph, options);
		const lines = [`# ${snapshot.title}`];

		for (const node of snapshot.nodes) {
			lines.push(`${quoteD2(node.label)}`);
		}

		for (const edge of snapshot.edges) {
			const label = edge.count > 1 ? `: ${quoteD2(String(edge.count))}` : '';
			lines.push(`${quoteD2(edge.source)} -> ${quoteD2(edge.target)}${label}`);
		}

		return lines.join('\n');
	}

	public static toCSV(graph: Edge[], options: GraphQueryOptions = {}): string {
		const snapshot = this.createSnapshot(graph, options);
		const rows = [['source', 'target', 'count', 'external', 'importKinds']];

		for (const edge of snapshot.edges) {
			rows.push([
				edge.source,
				edge.target,
				String(edge.count),
				String(edge.external),
				edge.importKinds.join('|'),
			]);
		}

		return rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
	}

	public static toJSON(graph: Edge[], options: GraphQueryOptions = {}): string {
		return JSON.stringify(this.createSnapshot(graph, options), null, 2);
	}

	public static toHTML(graph: Edge[], options: GraphQueryOptions = {}): string {
		const snapshot = this.createSnapshot(graph, options);
		const mermaid = this.toMermaid(graph, options);
		const dot = this.toDOT(graph, options);
		const d2 = this.toD2(graph, options);

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHTML(snapshot.title)}</title>
	<style>
		body { font-family: Arial, sans-serif; margin: 0; color: #1f2933; background: #f8fafc; }
		header { background: #102a43; color: white; padding: 24px 32px; }
		main { padding: 24px 32px; }
		h1 { margin: 0 0 8px; font-size: 28px; }
		h2 { margin-top: 32px; font-size: 20px; }
		.summary { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
		.metric { background: white; border: 1px solid #d9e2ec; border-radius: 6px; padding: 12px 16px; min-width: 140px; }
		.metric strong { display: block; font-size: 24px; color: #102a43; }
		table { border-collapse: collapse; width: 100%; background: white; border: 1px solid #d9e2ec; }
		th, td { text-align: left; border-bottom: 1px solid #d9e2ec; padding: 8px 10px; vertical-align: top; }
		th { background: #eef2f7; font-weight: 700; }
		pre { background: #0b1220; color: #e6edf3; padding: 16px; border-radius: 6px; overflow: auto; }
		pre.mermaid { background: white; color: #1f2933; border: 1px solid #d9e2ec; }
		details { margin: 16px 0; }
		summary { cursor: pointer; font-weight: 700; }
		.empty { color: #627d98; background: white; border: 1px solid #d9e2ec; padding: 16px; border-radius: 6px; }
	</style>
</head>
<body>
	<header>
		<h1>${escapeHTML(snapshot.title)}</h1>
		<div>Generated by ArchUnitTS graph reporting</div>
	</header>
	<main>
		<section class="summary">
			<div class="metric"><strong>${snapshot.summary.nodeCount}</strong>Nodes</div>
			<div class="metric"><strong>${snapshot.summary.edgeCount}</strong>Aggregated Edges</div>
			<div class="metric"><strong>${snapshot.summary.rawEdgeCount}</strong>Raw Edges</div>
			<div class="metric"><strong>${snapshot.summary.externalEdgeCount}</strong>External Edges</div>
		</section>

		<h2>Dependencies</h2>
		${renderEdgeTable(snapshot)}

		<h2>Mermaid Preview</h2>
		<pre class="mermaid">${escapeHTML(mermaid)}</pre>

		<details>
			<summary>Mermaid Source</summary>
			<pre>${escapeHTML(mermaid)}</pre>
		</details>

		<details>
			<summary>DOT</summary>
			<pre>${escapeHTML(dot)}</pre>
		</details>

		<details>
			<summary>D2</summary>
			<pre>${escapeHTML(d2)}</pre>
		</details>
	</main>
	<script type="module">
		import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
		mermaid.initialize({ startOnLoad: true, securityLevel: 'loose' });
	</script>
</body>
</html>`;
	}

	public static async exportAsDOT(
		graph: Edge[],
		outputPath: string,
		options: GraphQueryOptions = {}
	): Promise<void> {
		await writeReport(outputPath, this.toDOT(graph, options));
	}

	public static async exportAsMermaid(
		graph: Edge[],
		outputPath: string,
		options: GraphQueryOptions = {}
	): Promise<void> {
		await writeReport(outputPath, this.toMermaid(graph, options));
	}

	public static async exportAsD2(
		graph: Edge[],
		outputPath: string,
		options: GraphQueryOptions = {}
	): Promise<void> {
		await writeReport(outputPath, this.toD2(graph, options));
	}

	public static async exportAsCSV(
		graph: Edge[],
		outputPath: string,
		options: GraphQueryOptions = {}
	): Promise<void> {
		await writeReport(outputPath, this.toCSV(graph, options));
	}

	public static async exportAsJSON(
		graph: Edge[],
		outputPath: string,
		options: GraphQueryOptions = {}
	): Promise<void> {
		await writeReport(outputPath, this.toJSON(graph, options));
	}

	public static async exportAsHTML(
		graph: Edge[],
		outputPath: string,
		options: GraphQueryOptions = {}
	): Promise<void> {
		await writeReport(outputPath, this.toHTML(graph, options));
	}
}

function selectNodes(graph: Edge[], options: GraphQueryOptions): Set<string> {
	const allNodes = new Set(graph.flatMap((edge) => [edge.source, edge.target]));
	const hasQuery = options.focus || options.reachableFrom || options.dependentsOf;

	if (!hasQuery) {
		return allNodes;
	}

	const selected = new Set<string>();

	if (options.focus) {
		for (const node of expandFocus(graph, options.focus, options.focusDepth ?? 1)) {
			selected.add(node);
		}
	}

	if (options.reachableFrom) {
		for (const node of walkGraph(graph, options.reachableFrom, 'outgoing')) {
			selected.add(node);
		}
	}

	if (options.dependentsOf) {
		for (const node of walkGraph(graph, options.dependentsOf, 'incoming')) {
			selected.add(node);
		}
	}

	return selected;
}

function expandFocus(graph: Edge[], pattern: Pattern, depth: number): Set<string> {
	const matcher = createMatcher(pattern);
	const selected = new Set<string>();
	const queue: Array<{ node: string; depth: number }> = [];

	for (const node of new Set(graph.flatMap((edge) => [edge.source, edge.target]))) {
		if (matcher(node)) {
			selected.add(node);
			queue.push({ node, depth: 0 });
		}
	}

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (current.depth >= depth) {
			continue;
		}

		for (const neighbor of neighborsOf(graph, current.node)) {
			if (!selected.has(neighbor)) {
				selected.add(neighbor);
				queue.push({ node: neighbor, depth: current.depth + 1 });
			}
		}
	}

	return selected;
}

function walkGraph(
	graph: Edge[],
	pattern: Pattern,
	direction: 'incoming' | 'outgoing'
): Set<string> {
	const matcher = createMatcher(pattern);
	const selected = new Set<string>();
	const queue: string[] = [];
	const allNodes = new Set(graph.flatMap((edge) => [edge.source, edge.target]));

	for (const node of allNodes) {
		if (matcher(node)) {
			selected.add(node);
			queue.push(node);
		}
	}

	while (queue.length > 0) {
		const current = queue.shift()!;
		const nextNodes = graph
			.filter((edge) =>
				direction === 'outgoing'
					? edge.source === current
					: edge.target === current
			)
			.map((edge) => (direction === 'outgoing' ? edge.target : edge.source));

		for (const next of nextNodes) {
			if (!selected.has(next)) {
				selected.add(next);
				queue.push(next);
			}
		}
	}

	return selected;
}

function neighborsOf(graph: Edge[], node: string): string[] {
	return graph.flatMap((edge) => {
		if (edge.source === node && edge.target !== node) {
			return [edge.target];
		}
		if (edge.target === node && edge.source !== node) {
			return [edge.source];
		}
		return [];
	});
}

function collapseNode(node: string, strategy?: GraphCollapseStrategy): string {
	if (!strategy) {
		return node;
	}

	const normalized = normalizeNode(node);

	if (strategy.type === 'pattern') {
		return normalized.replace(strategy.pattern, strategy.replacement);
	}

	const depth = Math.max(1, strategy.depth);
	const parts = normalized.split('/').filter(Boolean);
	if (parts.length <= 1) {
		return normalized;
	}

	const folderParts = parts.slice(0, -1);
	if (folderParts.length === 0) {
		return normalized;
	}

	return folderParts.slice(0, depth).join('/');
}

function createMatcher(pattern: Pattern): NodeMatcher {
	if (typeof pattern === 'string') {
		return (node) => minimatch(normalizeNode(node), pattern, { dot: true });
	}

	return (node) => {
		pattern.lastIndex = 0;
		return pattern.test(normalizeNode(node));
	};
}

function normalizeNode(node: string): string {
	return node.replace(/\\/g, '/');
}

function uniqueSorted(values: Array<string | { toString(): string }>): string[] {
	return Array.from(new Set(values.map((value) => value.toString()))).sort();
}

function compareEdges(left: GraphReportEdge, right: GraphReportEdge): number {
	return (
		left.source.localeCompare(right.source) ||
		left.target.localeCompare(right.target)
	);
}

function quoteDOT(input: string): string {
	return `"${input.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function quoteD2(input: string): string {
	return `"${input.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function escapeMermaidLabel(input: string): string {
	return input.replace(/\\/g, '\\\\').replace(/"/g, '#quot;');
}

function escapeCSV(input: string): string {
	if (/[",\n\r]/.test(input)) {
		return `"${input.replace(/"/g, '""')}"`;
	}
	return input;
}

function escapeHTML(input: string): string {
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function renderEdgeTable(snapshot: GraphReportSnapshot): string {
	if (snapshot.edges.length === 0) {
		return '<div class="empty">No dependency edges matched this graph query.</div>';
	}

	const rows = snapshot.edges
		.map(
			(edge) => `<tr>
			<td>${escapeHTML(edge.source)}</td>
			<td>${escapeHTML(edge.target)}</td>
			<td>${edge.count}</td>
			<td>${edge.external ? 'yes' : 'no'}</td>
			<td>${escapeHTML(edge.importKinds.join(', '))}</td>
		</tr>`
		)
		.join('\n');

	return `<table>
	<thead>
		<tr>
			<th>Source</th>
			<th>Target</th>
			<th>Count</th>
			<th>External</th>
			<th>Import Kinds</th>
		</tr>
	</thead>
	<tbody>
		${rows}
	</tbody>
</table>`;
}

async function writeReport(outputPath: string, content: string): Promise<void> {
	const dir = path.dirname(outputPath);
	if (dir && dir !== '.' && !fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(outputPath, content, 'utf8');
}
