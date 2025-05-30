import { extractGraph } from '../../common/extraction/extract-graph';
import { RegexFactory } from './regex-factory';
import { Checkable } from '../../common/fluentapi/checkable';
import { projectEdges } from '../../common/projection/project-edges';
import { perEdge, perInternalEdge } from '../../common/projection/edge-projections';
import { projectToNodes } from '../../common/projection/project-nodes';
import {
	gatherRegexMatchingViolationsLegacy,
	gatherFilenamePatternViolations,
} from '../assertion/matching-files';
import { Pattern, PatternMatchingOptions } from '../assertion/pattern-matching';
import { Violation } from '../../common/assertion/violation';
import { gatherCycleViolations } from '../assertion/free-of-cycles';
import { gatherDependOnFileViolations } from '../assertion/depend-on-files';
import {
	gatherCustomFileViolations,
	CustomFileCondition,
} from '../assertion/custom-file-logic';

// Re-export types for external use
export type { FileInfo, CustomFileCondition } from '../assertion/custom-file-logic';

export const projectFiles = (tsConfigFilePath?: string): FileConditionBuilder => {
	return new FileConditionBuilder(tsConfigFilePath);
};

export const files = projectFiles;

export class FileConditionBuilder {
	constructor(readonly tsConfigFilePath?: string) {}

	public matchingPattern(pattern: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [pattern]);
	}

	public withName(name: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.fileNameMatcher(name)]);
	}

	public inFolder(folder: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.folderMatcher(folder)]);
	}
}

export class FilesShouldCondition {
	constructor(
		readonly fileCondition: FileConditionBuilder,
		readonly patterns: string[]
	) {}

	public should(): PositiveMatchPatternFileConditionBuilder {
		return new PositiveMatchPatternFileConditionBuilder(this);
	}
	public shouldNot(): NegatedMatchPatternFileConditionBuilder {
		return new NegatedMatchPatternFileConditionBuilder(this);
	}

	public matchingPattern(pattern: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [...this.patterns, pattern]);
	}

	public withName(name: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			...this.patterns,
			RegexFactory.fileNameMatcher(name),
		]);
	}

	public inFolder(folder: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			...this.patterns,
			RegexFactory.folderMatcher(folder),
		]);
	}
}

export class NegatedMatchPatternFileConditionBuilder {
	readonly isNegated: boolean = true;

	constructor(readonly filesShouldCondition: FilesShouldCondition) {}

	public matchPattern(pattern: string): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, pattern);
	}

	public beInFolder(folder: string): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.folderMatcher(folder));
	}

	public dependOnFiles(): DependOnFileConditionBuilder {
		return new DependOnFileConditionBuilder(this);
	}

	/**
	 * Match pattern against filename only (not full path) with exact matching
	 *
	 * @param pattern - String pattern or RegExp to match filename
	 * @example
	 * ```typescript
	 * files.inFolder('services').shouldNot().matchFilename('Service.ts')
	 * files.inFolder('services').shouldNot().matchFilename(/^Service.*\.ts$/)
	 * ```
	 */
	public matchFilename(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'exact',
		});
	}

	/**
	 * Match pattern against full relative path with exact matching
	 *
	 * @param pattern - String pattern or RegExp to match full path
	 * @example
	 * ```typescript
	 * files.shouldNot().matchPath('src/services/UserService.ts')
	 * files.shouldNot().matchPath(/^src\/services\/.*Service\.ts$/)
	 * ```
	 */
	public matchPath(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'path',
			matching: 'exact',
		});
	}

	/**
	 * Match pattern partially against filename (allows substring matching)
	 *
	 * @param pattern - String pattern or RegExp to match within filename
	 * @example
	 * ```typescript
	 * files.inFolder('services').shouldNot().containInFilename('Service')
	 * ```
	 */
	public containInFilename(
		pattern: string | RegExp
	): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'partial',
		});
	}
}

export class PositiveMatchPatternFileConditionBuilder {
	readonly isNegated: boolean = false;

	constructor(readonly filesShouldCondition: FilesShouldCondition) {}

	public matchPattern(pattern: string): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, pattern);
	}

	public haveNoCycles(): CycleFreeFileCondition {
		return new CycleFreeFileCondition(this);
	}

	public beInFolder(folder: string): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.folderMatcher(folder));
	}

	public dependOnFiles(): DependOnFileConditionBuilder {
		return new DependOnFileConditionBuilder(this);
	}

	// Custom logic support
	public adhereTo(
		condition: CustomFileCondition,
		message: string
	): CustomFileCheckableCondition {
		return new CustomFileCheckableCondition(
			this.filesShouldCondition.fileCondition.tsConfigFilePath,
			condition,
			message,
			this.filesShouldCondition.patterns
		);
	}

	/**
	 * Match pattern against filename only (not full path) with exact matching
	 *
	 * @param pattern - String pattern or RegExp to match filename
	 * @example
	 * ```typescript
	 * files.inFolder('services').should().matchFilename('Service.ts')
	 * files.inFolder('services').should().matchFilename(/^Service.*\.ts$/)
	 * ```
	 */
	public matchFilename(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'exact',
		});
	}

	/**
	 * Match pattern against full relative path with exact matching
	 *
	 * @param pattern - String pattern or RegExp to match full path
	 * @example
	 * ```typescript
	 * files.should().matchPath('src/services/UserService.ts')
	 * files.should().matchPath(/^src\/services\/.*Service\.ts$/)
	 * ```
	 */
	public matchPath(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'path',
			matching: 'exact',
		});
	}

	/**
	 * Match pattern partially against filename (allows substring matching)
	 *
	 * @param pattern - String pattern or RegExp to match within filename
	 * @example
	 * ```typescript
	 * files.inFolder('services').should().containInFilename('Service')
	 * ```
	 */
	public containInFilename(
		pattern: string | RegExp
	): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'partial',
		});
	}
}

export class DependOnFileConditionBuilder {
	constructor(
		readonly matchPatternFileConditionBuilder: NegatedMatchPatternFileConditionBuilder
	) {}

	public matchingPattern(pattern: string): DependOnFileCondition {
		return new DependOnFileCondition(this, [pattern]);
	}

	public withName(name: string): DependOnFileCondition {
		return new DependOnFileCondition(this, [RegexFactory.fileNameMatcher(name)]);
	}

	public inFolder(folder: string): DependOnFileCondition {
		return new DependOnFileCondition(this, [RegexFactory.folderMatcher(folder)]);
	}
}

export class DependOnFileCondition implements Checkable {
	constructor(
		readonly dependOnFileConditionBuilder: DependOnFileConditionBuilder,
		readonly subjectPatterns: string[]
	) {}

	public matchingPattern(pattern: string): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.subjectPatterns,
			pattern,
		]);
	}

	public withName(name: string): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.subjectPatterns,
			RegexFactory.fileNameMatcher(name),
		]);
	}

	public inFolder(folder: string): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.subjectPatterns,
			RegexFactory.folderMatcher(folder),
		]);
	}

	public async check(): Promise<Violation[]> {
		const graph = await extractGraph(
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder
				.filesShouldCondition.fileCondition.tsConfigFilePath
		);

		const projectedEdges = projectEdges(graph, perEdge());

		return gatherDependOnFileViolations(
			projectedEdges,
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder
				.filesShouldCondition.patterns,
			this.subjectPatterns,
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder.isNegated
		);
	}
}

export class CycleFreeFileCondition implements Checkable {
	constructor(
		readonly matchPatternFileConditionBuilder: NegatedMatchPatternFileConditionBuilder
	) {}

	public async check(): Promise<Violation[]> {
		const graph = await extractGraph(
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath
		);

		const projectedEdges = projectEdges(graph, perInternalEdge());

		return gatherCycleViolations(
			projectedEdges,
			this.matchPatternFileConditionBuilder.filesShouldCondition.patterns
		);
	}
}

export class MatchPatternFileCondition implements Checkable {
	constructor(
		readonly matchPatternFileConditionBuilder: NegatedMatchPatternFileConditionBuilder,
		readonly pattern: string
	) {}

	public async check(): Promise<Violation[]> {
		const graph = await extractGraph(
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath
		);

		const projectedNodes = projectToNodes(graph);

		// console.log('projectedNodes:', projectedNodes);

		return gatherRegexMatchingViolationsLegacy(
			projectedNodes,
			this.pattern,
			this.matchPatternFileConditionBuilder.filesShouldCondition.patterns,
			this.matchPatternFileConditionBuilder.isNegated
		);
	}
}

/**
 * Enhanced pattern matching condition with configurable matching options
 */
export class EnhancedMatchPatternFileCondition implements Checkable {
	constructor(
		readonly matchPatternFileConditionBuilder:
			| PositiveMatchPatternFileConditionBuilder
			| NegatedMatchPatternFileConditionBuilder,
		readonly pattern: Pattern,
		readonly options: PatternMatchingOptions
	) {}

	public async check(): Promise<Violation[]> {
		const graph = await extractGraph(
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath
		);

		const projectedNodes = projectToNodes(graph);

		return gatherFilenamePatternViolations(
			projectedNodes,
			{ pattern: this.pattern, options: this.options },
			this.matchPatternFileConditionBuilder.filesShouldCondition.patterns,
			this.matchPatternFileConditionBuilder.isNegated
		);
	}
}

// Custom logic checkable condition for files domain
export class CustomFileCheckableCondition implements Checkable {
	constructor(
		readonly tsConfigFilePath?: string,
		readonly condition?: CustomFileCondition,
		readonly message?: string,
		readonly patterns?: string[]
	) {}

	public async check(): Promise<Violation[]> {
		if (!this.condition) {
			return [];
		}

		const graph = await extractGraph(this.tsConfigFilePath);
		const projectedNodes = projectToNodes(graph);

		return gatherCustomFileViolations(
			projectedNodes,
			this.patterns || [],
			this.condition,
			this.message || 'Custom file condition failed'
		);
	}
}
