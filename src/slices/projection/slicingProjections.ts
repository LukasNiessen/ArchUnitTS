import { Edge } from '../../common/extraction/graph';
import { safeArrayGet } from '../../common/util/arrayUtils';
import { MapFunction, MappedEdge } from '../../common/projection/projectEdges';

export const identity = (): MapFunction => {
	return (edge) => ({
		sourceLabel: edge.source,
		targetLabel: edge.target,
	});
};
export const sliceByPattern = (pattern: string): MapFunction => {
	const index = pattern.indexOf('(**)');

	if (index === -1) {
		throw new Error(
			"Could not find '(**)' inside slice pattern. It should contain exactly one occurance'(**)'"
		);
	}

	const prefix = escapeForRegexp(pattern.substring(0, index));
	const unescapedSuffix = pattern.substring(index + 4);
	// WATCH-IMP: I replcae substr with substring for both above lines

	if (unescapedSuffix.indexOf('(**)') !== -1) {
		throw new Error(
			"Found too many '(**)' inside slice pattern. It should contain exactly one occurance'(**)'"
		);
	}

	const suffix = escapeForRegexp(unescapedSuffix);
	const regexp = `^${prefix}([\\w]+)${suffix}.*$`;

	return sliceByRegex(new RegExp(regexp));
};

const escapeForRegexp = (input: string): string => {
	return input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const sliceByRegex = (regexp: RegExp): MapFunction => {
	return (edge: Edge): MappedEdge | undefined => {
		// Skip external edges
		if (edge.external) {
			return undefined;
		}

		const strippedSource = stripSlice(edge.source, regexp);
		if (strippedSource === undefined) {
			return undefined;
		}

		const strippedTarget = stripSlice(edge.target, regexp);
		if (strippedTarget === undefined) {
			return undefined;
		}

		// Skip self-references
		if (strippedSource === strippedTarget) {
			return undefined;
		}

		return {
			sourceLabel: strippedSource,
			targetLabel: strippedTarget,
		};
	};
};

const stripSlice = (
	relativeFileName: string,
	stripRegexp: RegExp
): string | undefined => {
	const strippedFileName = stripRegexp.exec(relativeFileName);
	if (strippedFileName === null) {
		return undefined;
	}

	// Return the first capture group if it exists
	return strippedFileName[1];
};

export const sliceByFileSuffix = (labeling: Map<string, string>): MapFunction => {
	return (edge: Edge): MappedEdge | undefined => {
		// Find matching labels for source and target files
		let sourceMatch: string | undefined;
		let targetMatch: string | undefined;

		for (const [suffix, label] of labeling.entries()) {
			// Check if source file matches this suffix
			if (edge.source.endsWith(`${suffix}.ts`)) {
				sourceMatch = label;
			}

			// Check if target file matches this suffix
			if (edge.target.endsWith(`${suffix}.ts`)) {
				targetMatch = label;
			}

			// If we found both matches, return immediately
			if (sourceMatch && targetMatch) {
				return {
					sourceLabel: sourceMatch,
					targetLabel: targetMatch,
				};
			}
		}

		return undefined;
	};
};
