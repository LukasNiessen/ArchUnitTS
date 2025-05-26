import { extractGraph } from '../../common/extraction/extract-graph';
import { RegexFactory } from './regex-factory';
import { Checkable } from '../../common/fluentapi/checkable';
import { projectEdges } from '../../common/projection/project-edges';
import { perEdge, perInternalEdge } from '../../common/projection/edge-projections';
import { projectToNodes } from '../../common/projection/project-nodes';
import { gatherRegexMatchingViolations } from '../assertion/matching-files';
import { Violation } from '../../common/assertion/violation';
import { gatherCycleViolations } from '../assertion/free-of-cycles';
import { gatherDependOnFileViolations } from '../assertion/depend-on-files';

export const projectFiles = (tsConfigFilePath?: string): FileConditionBuilder => {
	return new FileConditionBuilder(tsConfigFilePath);
};

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

		return gatherRegexMatchingViolations(
			projectedNodes,
			this.pattern,
			this.matchPatternFileConditionBuilder.filesShouldCondition.patterns,
			this.matchPatternFileConditionBuilder.isNegated
		);
	}
}
