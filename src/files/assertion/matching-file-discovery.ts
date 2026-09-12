import fs from 'fs';
import path from 'path';
import { matchesAllPatterns } from '../../common/pattern-matching';
import { Filter } from '../../common/type';
import { normalizeWindowsPaths } from '../../common/util/path-utils';

const SKIPPED_DIRECTORIES = new Set(['.git', 'dist', 'node_modules']);
const GLOB_MAGIC = /[*?[\]{}()!+@]/;

/**
 * Finds files on disk that can satisfy dependency-target filters.
 *
 * Dependency targets can legitimately live outside the tsconfig's include set.
 * For example, a frontend project can prohibit imports from a sibling `apps`
 * directory. Such files do not appear in TypeScript's program when the rule is
 * obeyed, so the dependency graph alone cannot distinguish a non-empty target
 * directory from a typo or an empty directory.
 */
export function discoverMatchingFiles(projectRoot: string, filters: Filter[]): string[] {
	const files = new Set<string>();

	for (const searchRoot of determineSearchRoots(projectRoot, filters)) {
		collectFiles(searchRoot, files);
	}

	return [...files]
		.map((file) =>
			normalizeWindowsPaths(path.relative(projectRoot, path.resolve(file)))
		)
		.filter((file) => matchesAllPatterns(file, filters));
}

function determineSearchRoots(projectRoot: string, filters: Filter[]): string[] {
	const pathFilters = filters.filter(
		(filter) =>
			filter.options.target === 'path' ||
			filter.options.target === 'path-no-filename'
	);
	const searchRoots =
		pathFilters.length === 0
			? [projectRoot]
			: pathFilters.map((filter) => searchRootForFilter(projectRoot, filter));

	return [...new Set(searchRoots.map((root) => path.resolve(root)))];
}

function searchRootForFilter(projectRoot: string, filter: Filter): string {
	if (typeof filter.pattern !== 'string') {
		return projectRoot;
	}

	const normalizedPattern = normalizeWindowsPaths(filter.pattern);
	if (path.isAbsolute(normalizedPattern)) {
		return projectRoot;
	}

	const magicIndex = normalizedPattern.search(GLOB_MAGIC);
	if (magicIndex === -1) {
		const literalPath = path.resolve(projectRoot, normalizedPattern);
		return filter.options.target === 'path-no-filename'
			? literalPath
			: path.dirname(literalPath);
	}

	const literalPrefix = normalizedPattern.slice(0, magicIndex);
	const relativeSearchRoot = literalPrefix.endsWith('/')
		? literalPrefix.slice(0, -1)
		: path.posix.dirname(literalPrefix);

	return path.resolve(
		projectRoot,
		relativeSearchRoot === '.' ? '' : relativeSearchRoot
	);
}

function collectFiles(searchRoot: string, files: Set<string>): void {
	let stats: fs.Stats;
	try {
		stats = fs.statSync(searchRoot);
	} catch (error) {
		if (isMissingPathError(error)) {
			return;
		}
		throw error;
	}

	if (stats.isFile()) {
		files.add(searchRoot);
		return;
	}
	if (!stats.isDirectory()) {
		return;
	}

	for (const entry of fs.readdirSync(searchRoot, { withFileTypes: true })) {
		const entryPath = path.join(searchRoot, entry.name);
		if (entry.isDirectory()) {
			if (!SKIPPED_DIRECTORIES.has(entry.name)) {
				collectFiles(entryPath, files);
			}
		} else if (entry.isFile()) {
			files.add(entryPath);
		}
	}
}

function isMissingPathError(error: unknown): boolean {
	if (typeof error !== 'object' || error === null || !('code' in error)) {
		return false;
	}

	const code = (error as { code?: string }).code;
	return code === 'ENOENT' || code === 'ENOTDIR';
}
