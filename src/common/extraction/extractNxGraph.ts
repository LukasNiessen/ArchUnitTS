import * as fs from 'fs';
import * as path from 'path';
import { Graph } from './graph';
import { TechnicalError } from '../error/errors';

type Nodes = {
	[index: string]: Outgoing[];
};

type Outgoing = {
	source: string;
	target: string;
};

export const extractNxGraph = (rootFolder?: string): Graph => {
	const workspaceRoot = rootFolder ?? guessNxWorkspaceRoot();

	// The location of the project graph was moved from .nx/cache to .nx/workspace-data in Nx v19.2.0
	// If using Nx 19.2.0+ use the new location
	let projectGraphCacheDirectory = absolutePath(
		workspaceRoot,
		process.env['NX_PROJECT_GRAPH_CACHE_DIRECTORY'] ??
			defaultWorkspaceDataDirectory(workspaceRoot)
	);

	// If using Nx <19.2.0 use the old location
	if (!fs.existsSync(path.join(projectGraphCacheDirectory, 'project-graph.json'))) {
		projectGraphCacheDirectory = absolutePath(
			workspaceRoot,
			defaultCacheDirectory(workspaceRoot)
		);
	}

	const depGraph = fs.readFileSync(
		path.join(projectGraphCacheDirectory, 'project-graph.json')
	);
	const deps: Nodes = JSON.parse(depGraph.toString('utf-8')).dependencies;

	return mapToGraph(deps);
};

const mapToGraph = (nodes: Nodes): Graph => {
	return Object.values(nodes).flatMap((edges) =>
		edges.map((edge) => ({
			source: edge.source,
			target: edge.target,
			external: edge.target.startsWith('npm:'),
		}))
	);
};

const absolutePath = (root: string, pathName: string): string => {
	return path.isAbsolute(pathName) ? pathName : path.join(root, pathName);
};

const defaultCacheDirectory = (root: string): string => {
	if (
		fs.existsSync(path.join(root, 'lerna.json')) &&
		!fs.existsSync(path.join(root, 'nx.json'))
	) {
		return path.join(root, 'node_modules', '.cache', 'nx');
	}
	return path.join(root, '.nx', 'cache');
};

const defaultWorkspaceDataDirectory = (root: string): string => {
	return path.join(root, '.nx', 'workspace-data');
};

export const guessNxWorkspaceRoot = (): string => {
	const nxConfigFileName = guessLocationOfNxConfigRecursively('.');

	if (!nxConfigFileName) {
		throw new TechnicalError(
			`Unable to extract dependency graph: No root folder of nx project was given and no nx config file could be resolved.`
		);
	}

	return path.dirname(nxConfigFileName);
};

const guessLocationOfNxConfigRecursively = (pathName: string): string | undefined => {
	const dir = fs.readdirSync(pathName);

	// First check if nx.json exists in the current directory
	const nxConfigFile = dir.find((fileName) => path.basename(fileName) === 'nx.json');
	if (nxConfigFile) {
		return path.resolve(pathName, 'nx.json');
	}

	// If not, go up one level in directory structure
	const levelUp = path.resolve(pathName, '..');
	const pr = path.relative(levelUp, pathName);

	// Stop if we've reached the filesystem root
	if (pr === '') {
		return undefined;
	}

	// Continue recursively
	return guessLocationOfNxConfigRecursively(levelUp);
};
