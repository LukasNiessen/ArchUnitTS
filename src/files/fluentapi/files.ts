import { extractGraph } from '../../common/extraction';
import { Checkable, CheckOptions } from '../../common/fluentapi';
import { sharedLogger } from '../../common/util/logger';
import {
	projectEdges,
	perEdge,
	perInternalEdge,
	projectToNodes,
} from '../../common/projection';
import {
	gatherRegexMatchingViolations,
	gatherCycleViolations,
	gatherDependOnFileViolations,
	gatherCustomFileViolations,
	CustomFileCondition,
} from '../assertion';
import { Violation } from '../../common/assertion';
import { Filter, Pattern, RegexFactory } from '../../common';

// Re-export types for external use
export type { FileInfo, CustomFileCondition } from '../assertion/custom-file-logic';

export const projectFiles = (tsConfigFilePath?: string): FileConditionBuilder => {
	return new FileConditionBuilder(tsConfigFilePath);
};

export const files = projectFiles;

export class FileConditionBuilder {
	constructor(readonly tsConfigFilePath?: string) {}

	public withName(name: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.fileNameMatcher(name)]);
	}

	public inFolder(folder: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.folderMatcher(folder)]);
	}

	public inPath(path: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.pathMatcher(path)]);
	}
}

export class FilesShouldCondition {
	constructor(
		readonly fileCondition: FileConditionBuilder,
		readonly filters: Filter[]
	) {}

	public should(): PositiveMatchPatternFileConditionBuilder {
		return new PositiveMatchPatternFileConditionBuilder(this);
	}

	public shouldNot(): NegatedMatchPatternFileConditionBuilder {
		return new NegatedMatchPatternFileConditionBuilder(this);
	}

	public withName(name: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this.fileCondition, [
			...this.filters,
			RegexFactory.fileNameMatcher(name),
		]);
	}

	public inFolder(folder: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this.fileCondition, [
			...this.filters,
			RegexFactory.folderMatcher(folder),
		]);
	}

	public inPath(path: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this.fileCondition, [
			...this.filters,
			RegexFactory.pathMatcher(path),
		]);
	}

	/**
	 * Filter to a specific file by exact path match
	 * @param filePath Exact file path to match
	 */
	public inFile(filePath: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.exactFileMatcher(filePath)]);
	}
}

export class NegatedMatchPatternFileConditionBuilder {
	readonly isNegated: boolean = true;

	constructor(readonly filesShouldCondition: FilesShouldCondition) {}

	public dependOnFiles(): DependOnFileConditionBuilder {
		return new DependOnFileConditionBuilder(this);
	}

	public beInFolder(folder: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.folderMatcher(folder));
	}

	public haveName(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.fileNameMatcher(pattern));
	}

	public beInPath(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.pathMatcher(pattern));
	}

	public adhereTo(
		condition: CustomFileCondition,
		message: string
	): CustomFileCheckableCondition {
		return new CustomFileCheckableCondition(
			this.filesShouldCondition.fileCondition.tsConfigFilePath,
			condition,
			message,
			this.filesShouldCondition.filters,
			this.isNegated
		);
	}
}

export class PositiveMatchPatternFileConditionBuilder {
	readonly isNegated: boolean = false;

	constructor(readonly filesShouldCondition: FilesShouldCondition) {}

	public haveNoCycles(): CycleFreeFileCondition {
		return new CycleFreeFileCondition(this);
	}

	public dependOnFiles(): DependOnFileConditionBuilder {
		return new DependOnFileConditionBuilder(this);
	}

	public beInFolder(folder: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.folderMatcher(folder));
	}

	public haveName(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.fileNameMatcher(pattern));
	}

	public beInPath(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(this, RegexFactory.pathMatcher(pattern));
	}

	public adhereTo(
		condition: CustomFileCondition,
		message: string
	): CustomFileCheckableCondition {
		return new CustomFileCheckableCondition(
			this.filesShouldCondition.fileCondition.tsConfigFilePath,
			condition,
			message,
			this.filesShouldCondition.filters,
			this.isNegated
		);
	}
}

export class DependOnFileConditionBuilder {
	constructor(
		readonly matchPatternFileConditionBuilder: NegatedMatchPatternFileConditionBuilder
	) {}

	public withName(name: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this, [RegexFactory.fileNameMatcher(name)]);
	}

	public inFolder(folder: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this, [RegexFactory.folderMatcher(folder)]);
	}

	public inPath(folder: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this, [RegexFactory.pathMatcher(folder)]);
	}
}

export class DependOnFileCondition implements Checkable {
	constructor(
		readonly dependOnFileConditionBuilder: DependOnFileConditionBuilder,
		readonly dependencyFilters: Filter[]
	) {}

	public inPath(pattern: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.dependencyFilters,
			RegexFactory.pathMatcher(pattern),
		]);
	}

	public withName(name: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.dependencyFilters,
			RegexFactory.fileNameMatcher(name),
		]);
	}

	public inFolder(folder: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.dependencyFilters,
			RegexFactory.folderMatcher(folder),
		]);
	}

	public async check(options?: CheckOptions): Promise<Violation[]> {
		const ruleName = `Dependency check: ${this.dependencyFilters.length} filters`;

		sharedLogger.startCheck(ruleName, options?.logging);
		sharedLogger.logProgress(
			'Extracting project graph for dependency analysis...',
			options?.logging
		);

		const configFileName =
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder
				.filesShouldCondition.fileCondition.tsConfigFilePath;

		const graph = await extractGraph(configFileName, options);

		const projectedEdges = projectEdges(graph, perEdge());
		sharedLogger.logProgress(
			`Analyzing dependencies across ${projectedEdges.length} edges`,
			options?.logging
		);

		projectedEdges.forEach((edge) =>
			sharedLogger.info(
				options?.logging,
				`Found edge: From ${edge.sourceLabel} to ${edge.targetLabel}`
			)
		);

		sharedLogger.info(
			options?.logging,
			'Filters, objectPatterns:',
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder
				.filesShouldCondition.filters
		);
		sharedLogger.info(
			options?.logging,
			'Filters, subjectPatterns:',
			this.dependencyFilters
		);

		const violations = gatherDependOnFileViolations(
			projectedEdges,
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder
				.filesShouldCondition.filters,
			this.dependencyFilters,
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder.isNegated,
			options?.allowEmptyTests || false
		);

		// Log violations if logging is enabled
		violations.forEach((violation) => {
			sharedLogger.logViolation(
				`Dependency violation: ${JSON.stringify(violation)}`,
				options?.logging
			);
		});

		sharedLogger.endCheck(ruleName, violations.length, options?.logging);
		return violations;
	}
}

export class CycleFreeFileCondition implements Checkable {
	constructor(
		readonly matchPatternFileConditionBuilder: NegatedMatchPatternFileConditionBuilder
	) {}

	/**
	 * Executes the cycle detection check by analyzing import/export relationships.
	 * Only checks internal dependencies (within the project) and ignores external libraries.
	 *
	 * @param options Optional check options including allowEmptyTests and logging
	 * @returns Promise<Violation[]> Array of violations representing detected cycles
	 */
	public async check(options?: CheckOptions): Promise<Violation[]> {
		const ruleName = 'Cycle detection check';

		sharedLogger.startCheck(ruleName, options?.logging);
		sharedLogger.logProgress(
			'Extracting project graph for cycle detection...',
			options?.logging
		);

		const configFileName =
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath;
		const graph = await extractGraph(configFileName, options);

		const projectedEdges = projectEdges(graph, perInternalEdge());

		sharedLogger.logProgress(
			`Analyzing ${projectedEdges.length} internal dependencies for cycles`,
			options?.logging
		);
		projectedEdges.forEach((edge) =>
			sharedLogger.info(
				options?.logging,
				`Found edge: From ${edge.sourceLabel} to ${edge.targetLabel}`
			)
		);

		sharedLogger.info(
			options?.logging,
			'Filters:',
			this.matchPatternFileConditionBuilder.filesShouldCondition.filters
		);

		const violations = gatherCycleViolations(
			projectedEdges,
			this.matchPatternFileConditionBuilder.filesShouldCondition.filters,
			options
		);

		violations.forEach((violation) => {
			sharedLogger.logViolation(
				`Cycle detected: ${JSON.stringify(violation)}`,
				options?.logging
			);
		});
		sharedLogger.endCheck(ruleName, violations.length, options?.logging);

		return violations;
	}
}

export class MatchPatternFileCondition implements Checkable {
	constructor(
		readonly matchPatternFileConditionBuilder: NegatedMatchPatternFileConditionBuilder,
		readonly filter: Filter
	) {}

	/**
	 * Executes the pattern matching check against the selected files.
	 *
	 * For positive assertions (should): Validates that files match the pattern.
	 * For negative assertions (shouldNot): Validates that files do NOT match the pattern.
	 *
	 * @param options Optional check options including allowEmptyTests and logging
	 * @returns Promise<Violation[]> Array of violations found during the check
	 */
	public async check(options?: CheckOptions): Promise<Violation[]> {
		const ruleName = `Pattern matching: ${this.filter.regExp}`;

		sharedLogger.startCheck(ruleName, options?.logging);
		sharedLogger.logProgress('Extracting project graph...', options?.logging);

		const configFileName =
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath;
		const graph = await extractGraph(configFileName, options);

		const projectedNodes = projectToNodes(graph);

		sharedLogger.logProgress(
			`Processing ${projectedNodes.length} files`,
			options?.logging
		);
		projectedNodes.forEach((node) =>
			sharedLogger.info(options?.logging, `Found file: ${node.label}`)
		);

		sharedLogger.info(options?.logging, 'Filter:', this.filter);
		sharedLogger.info(
			options?.logging,
			'Precondition filters:',
			this.matchPatternFileConditionBuilder.filesShouldCondition.filters
		);

		const violations = gatherRegexMatchingViolations(
			projectedNodes,
			this.filter,
			this.matchPatternFileConditionBuilder.filesShouldCondition.filters,
			this.matchPatternFileConditionBuilder.isNegated,
			options
		);

		violations.forEach((violation) => {
			sharedLogger.logViolation(
				`Pattern violation: ${JSON.stringify(violation)}`,
				options?.logging
			);
		});
		sharedLogger.endCheck(ruleName, violations.length, options?.logging);

		return violations;
	}
}

/**
 * Custom condition for checking files using user-defined logic.
 * This class allows for highly flexible architectural rules that can't be
 * expressed through the standard API methods. Users can define custom
 * functions that receive file information and return boolean results.
 *
 * The custom condition function receives a FileInfo object containing
 * details about each file including path, content, exports, imports, etc.
 *
 * @example
 * ```typescript
 * // Custom rule: files should have specific exports
 * projectFiles()
 *   .inFolder('services')
 *   .should()
 *   .adhereTo(
 *     (fileInfo) => fileInfo.exports.includes('default'),
 *     'Service files must have default export'
 *   )
 *   .check();
 *
 * // Custom rule: files should not exceed certain complexity
 * projectFiles()
 *   .matching(/.*\.ts$/)
 *   .should()
 *   .adhereTo(
 *     (fileInfo) => fileInfo.content.split('\n').length < 100,
 *     'Files should not exceed 100 lines'
 *   )
 *   .check();
 * ```
 */
export class CustomFileCheckableCondition implements Checkable {
	constructor(
		readonly tsConfigFilePath?: string,
		readonly condition?: CustomFileCondition,
		readonly message?: string,
		readonly filters?: Filter[],
		readonly isNegated?: boolean
	) {}

	/**
	 * Executes the custom file condition check.
	 *
	 * For each file matching the preconditions, the custom condition function
	 * is called with a FileInfo object. If the function returns false for any file,
	 * a violation is generated with the specified message.
	 *
	 * @param options Optional check options including allowEmptyTests and logging
	 * @returns Promise<Violation[]> Array of violations where custom condition failed
	 */
	public async check(options?: CheckOptions): Promise<Violation[]> {
		if (!this.condition) {
			return [];
		}

		const ruleName = `Custom file condition: ${this.message || 'Custom rule'}`;

		sharedLogger.startCheck(ruleName, options?.logging);
		sharedLogger.logProgress(
			'Extracting project graph for custom file analysis...',
			options?.logging
		);

		const graph = await extractGraph(this.tsConfigFilePath, options);
		const projectedNodes = projectToNodes(graph);

		sharedLogger.logProgress(
			`Applying custom condition to ${projectedNodes.length} files`,
			options?.logging
		);
		projectedNodes.forEach((node) =>
			sharedLogger.info(options?.logging, `Found file: ${node.label}`)
		);

		sharedLogger.info(options?.logging, 'Filters:', this.filters || []);
		sharedLogger.info(options?.logging, 'Condition:', this.condition);

		const violations = gatherCustomFileViolations(
			projectedNodes,
			this.filters || [],
			this.condition,
			this.message || 'Custom file condition failed',
			this.isNegated || false,
			options
		);

		// Log violations if logging is enabled
		violations.forEach((violation) => {
			sharedLogger.logViolation(
				`Custom condition violation: ${JSON.stringify(violation)}`,
				options?.logging
			);
		});

		sharedLogger.endCheck(ruleName, violations.length, options?.logging);
		return violations;
	}
}
