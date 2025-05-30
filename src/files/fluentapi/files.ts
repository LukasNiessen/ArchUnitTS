import { extractGraph } from '../../common/extraction/extract-graph';
import { RegexFactory } from './regex-factory';
import { Checkable, CheckOptions } from '../../common/fluentapi/checkable';
import { projectEdges } from '../../common/projection/project-edges';
import { projectToNodes } from '../../common/projection/project-nodes';
import { gatherFilenamePatternViolations } from '../assertion/matching-files';
import { Pattern, PatternMatchingOptions } from '../assertion/pattern-matching';
import { Violation } from '../../common/assertion/violation';
import { gatherCycleViolations } from '../assertion/free-of-cycles';
import { gatherDependOnFileViolations } from '../assertion/depend-on-files';
import {
	gatherCustomFileViolations,
	CustomFileCondition,
} from '../assertion/custom-file-logic';
import { perEdge, perInternalEdge } from '../../common/projection/edge-projections';

// Re-export types for external use
export type { FileInfo, CustomFileCondition } from '../assertion/custom-file-logic';

export const projectFiles = (tsConfigFilePath?: string): FileConditionBuilder => {
	return new FileConditionBuilder(tsConfigFilePath);
};

export const files = projectFiles;

export class FileConditionBuilder {
	constructor(readonly tsConfigFilePath?: string) {}

	/**
	 * This filters all files that match this pattern. The pattern can be a string or a regex. It will internally be converted to a regex.
	 * Strings can be glob pattern, that is, they can contain * and ?, and this will be treated as it is in a normal RegEx, that is:
	 * --> * means zero or more chars, excluding /
	 * --> ? means a single char
	 *
	 * For example, if the input is '*component-*.ts':
	 * - Matches: 'src/cool-components/my-component-a.ts
	 * - Matches: 'src/cool-components/my-component.ts
	 * - Matches: 'src/cool-components/component-abc.ts
	 * - NOT matching: 'src/other-components/my-component.ts    <-- the -* is missing
	 * - NOT matching: 'src/views/view-a.ts
	 *
	 * If the input is 'component-?.ts':
	 * - Matches: 'src/cool-components/component-a.ts
	 * - Matches: 'src/cool-components/component-b.ts
	 * - NOT matching: 'src/cool-components/component-abc.ts
	 * - NOIT matching: 'src/cool-components/my-component-a.ts
	 *
	 *
	 * @param pattern
	 * @returns
	 */
	public matching(pattern: string | RegExp): FilesShouldCondition {
		return new FilesShouldCondition(this, [pattern]);
	}

	/**
	 * Matches all files that have this name. You must include the file extension.
	 *
	 * For example, if the input is 'my-component.ts':
	 * - Matches: 'src/cool-components/my-component.ts
	 * - Matches: 'src/other-components/my-component.ts
	 * - NOT matching: 'src/cool-components/component
	 * - NOT matching: 'src/views/view-a.ts
	 *
	 * However, if the input is 'my-component':
	 * - NOT matching: 'src/cool-components/my-component.ts
	 * - NOT matching: 'src/other-components/my-component.ts
	 * - Matching: 'src/cool-components/component
	 * - NOT matching: 'src/views/view-a.ts
	 *
	 * @param name
	 * @returns
	 */
	public withName(name: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.fileNameMatcher(name)]);
	}

	/**
	 * This will return all files that are in a folder as you specified.
	 * You can specify a path as well though, like so: src/components
	 *
	 * What happens is, the input is is converted to: .\*\/?${escapedFolder}/.*
	 * and we check if a file path matches this or not.
	 *
	 * For example, if the input is 'components':
	 * - Matches: 'src/components/component-a.ts
	 * - Matches: 'src/components/component-b.ts
	 * - Matches: 'src/domain/helper/components/helper-component.ts    <-- notice /components/ is in the path
	 * - NOT matching: 'src/views/view-a.ts
	 * - NOT matching: 'src/views/view-b.ts
	 *
	 * However, if the input is 'src/components':
	 * - Matches: 'src/components/component-a.ts
	 * - Matches: 'src/components/component-b.ts
	 * - NOT Matches: 'src/domain/helper/components/helper-component.ts
	 * - NOT matching: 'src/views/view-a.ts
	 * - NOT matching: 'src/views/view-b.ts
	 *
	 * @param folder string
	 * @returns
	 */
	public inFolder(folder: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.folderMatcher(folder)]);
	}
}

export class FilesShouldCondition {
	constructor(
		readonly fileCondition: FileConditionBuilder,
		readonly patterns: (string | RegExp)[]
	) {}

	public should(): PositiveMatchPatternFileConditionBuilder {
		return new PositiveMatchPatternFileConditionBuilder(this);
	}
	public shouldNot(): NegatedMatchPatternFileConditionBuilder {
		return new NegatedMatchPatternFileConditionBuilder(this);
	}

	public matching(pattern: RegExp): FilesShouldCondition {
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

	/*
	Dicontinued due to being very clear
	public matchPattern(pattern: string): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, pattern);
	}
	*/

	public beInFolder(folder: string): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.folderMatcher(folder));
	}

	public dependOnFiles(): DependOnFileConditionBuilder {
		return new DependOnFileConditionBuilder(this);
	}

	public matchFilename(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'exact',
		});
	}

	public matchPath(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'path',
			matching: 'exact',
		});
	}

	public containInFilename(
		pattern: string | RegExp
	): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'partial',
		});
	}

	public containInPath(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'path',
			matching: 'partial',
		});
	}
}

export class PositiveMatchPatternFileConditionBuilder {
	readonly isNegated: boolean = false;

	constructor(readonly filesShouldCondition: FilesShouldCondition) {}

	/*
	public matchPattern(pattern: string): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, pattern);
	}
	*/

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
	 * pattern may be a string or Regex. A string can be a glob pattern, X-TODO
	 *
	 * @param pattern
	 * @returns
	 */
	public matchFilename(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'exact',
		});
	}

	public matchPath(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'path',
			matching: 'exact',
		});
	}

	public containInFilename(
		pattern: string | RegExp
	): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'filename',
			matching: 'partial',
		});
	}

	public containInPath(pattern: string | RegExp): EnhancedMatchPatternFileCondition {
		return new EnhancedMatchPatternFileCondition(this, pattern, {
			target: 'path',
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

	public async check(options?: CheckOptions): Promise<Violation[]> {
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

	public async check(_options?: CheckOptions): Promise<Violation[]> {
		const graph = await extractGraph(
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath
		);

		const projectedNodes = projectToNodes(graph);

		// console.log('projectedNodes:', projectedNodes);

		return gatherFilenamePatternViolations(
			projectedNodes,
			this.pattern,
			this.matchPatternFileConditionBuilder.filesShouldCondition.patterns,
			this.matchPatternFileConditionBuilder.isNegated,
			_options?.allowEmptyTests || false
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

	public async check(_options?: CheckOptions): Promise<Violation[]> {
		const graph = await extractGraph(
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath
		);

		const projectedNodes = projectToNodes(graph);

		return gatherFilenamePatternViolations(
			projectedNodes,
			{ pattern: this.pattern, options: this.options },
			this.matchPatternFileConditionBuilder.filesShouldCondition.patterns,
			this.matchPatternFileConditionBuilder.isNegated,
			_options?.allowEmptyTests || false
		);
	}
}

/**
 * Simple pattern matching condition with explicit matching types
 */
export class SimpleMatchFileCondition implements Checkable {
	constructor(
		readonly matchPatternFileConditionBuilder:
			| PositiveMatchPatternFileConditionBuilder
			| NegatedMatchPatternFileConditionBuilder,
		readonly pattern: string | RegExp,
		readonly matchType:
			| 'filename-exact'
			| 'filename-contains'
			| 'filename-regex'
			| 'path-exact'
			| 'path-contains'
			| 'path-regex'
	) {}

	public async check(options?: CheckOptions): Promise<Violation[]> {
		const graph = await extractGraph(
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath
		);

		const projectedNodes = projectToNodes(graph);

		// Convert matchType to PatternMatchingOptions
		const target = this.matchType.startsWith('filename') ? 'filename' : 'path';
		const matching = this.matchType.includes('contains') ? 'partial' : 'exact';

		// For regex types, use the RegExp directly; for string types, wrap in exact/partial logic
		const actualPattern = this.matchType.endsWith('regex')
			? (this.pattern as RegExp)
			: (this.pattern as string);

		return gatherFilenamePatternViolations(
			projectedNodes,
			{ pattern: actualPattern, options: { target, matching } },
			this.matchPatternFileConditionBuilder.filesShouldCondition.patterns,
			this.matchPatternFileConditionBuilder.isNegated,
			options?.allowEmptyTests || false
		);
	}
}

// Custom logic checkable condition for files domain
export class CustomFileCheckableCondition implements Checkable {
	constructor(
		readonly tsConfigFilePath?: string,
		readonly condition?: CustomFileCondition,
		readonly message?: string,
		readonly patterns?: (string | RegExp)[]
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
