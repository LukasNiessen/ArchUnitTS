import { extractGraph } from '../../common/extraction/extract-graph';
import { RegexFactory } from './regex-factory';
import { Checkable, CheckOptions } from '../../common/fluentapi/checkable';
import { CheckLogger } from '../../common/util/logger';
import { projectEdges } from '../../common/projection/project-edges';
import { perEdge, perInternalEdge } from '../../common/projection/edge-projections';
import { projectToNodes } from '../../common/projection/project-nodes';
import { gatherRegexMatchingViolations } from '../assertion/matching-files';
import { Violation } from '../../common/assertion/violation';
import { gatherCycleViolations } from '../assertion/cycle-free';
import { gatherDependOnFileViolations } from '../assertion/depend-on-files';
import {
	gatherCustomFileViolations,
	CustomFileCondition,
} from '../assertion/custom-file-logic';
import { Filter, Pattern } from '../../common/type';

// Re-export types for external use
export type { FileInfo, CustomFileCondition } from '../assertion/custom-file-logic';

export const projectFiles = (tsConfigFilePath?: string): FileConditionBuilder => {
	return new FileConditionBuilder(tsConfigFilePath);
};

export const files = projectFiles;

/**
 * Supports glob everywhere. If its a string, glob is always applied, if its a regex,
 * its checked with the reges as it is. X-TODO: is it rly as it is?
 */
export class FileConditionBuilder {
	constructor(readonly tsConfigFilePath?: string) {}

	/*
	public matchingPattern(pattern: Pattern): FilesShouldCondition {
		const patterns = typeof pattern === 'string' ? [RegexFactory.] : [pattern.source];
		return new FilesShouldCondition(this, patterns);
	}
	*/

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
	public withFilename(name: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			RegexFactory.fileNameMatcher(name, 'exact'),
		]);
	}

	public containsInFilename(name: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			RegexFactory.fileNameMatcher(name, 'partial'),
		]);
	}

	/**
	 * This will return all files that are in a folder as you specified.
	 * You can specify a path as well though, like so: src/components
	 *
	 * If he input is a string, the input is is converted to: .\*\/?${escapedFolder}/.*
	 * and we check if a file path matches this or not.
	 *
	 * If the input is a regex, the path is checked whether it matches the regex or not.
	 *
	 * Important note: files in node_modules or dist are never matched.
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
	public inFolder(folder: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			RegexFactory.folderMatcher(folder, 'exact'),
		]);
	}

	// X-TODO: great doc comments here. Also explain the diff of path and folder!
	public inPath(path: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.pathMatcher(path, 'exact')]);
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

	/*
	public matchingPattern(pattern: string): FilesShouldCondition {
		return new FilesShouldCondition(this, [...this.filters, pattern]);
	}
	*/

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
	public withFilename(name: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			RegexFactory.fileNameMatcher(name, 'exact'),
		]);
	}

	// X-TODO: great doc comments here
	public containsInFilename(name: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			RegexFactory.fileNameMatcher(name, 'partial'),
		]);
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
	public inFolder(folder: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [
			RegexFactory.folderMatcher(folder, 'exact'),
		]);
	}

	// X-TODO: great doc comments here. Also explain the diff of path and folder!
	public inPath(path: Pattern): FilesShouldCondition {
		return new FilesShouldCondition(this, [RegexFactory.pathMatcher(path, 'exact')]);
	}
}

export class NegatedMatchPatternFileConditionBuilder {
	readonly isNegated: boolean = true;

	constructor(readonly filesShouldCondition: FilesShouldCondition) {}

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
	 * - NOT matching: 'src/cool-components/my-component-a.ts
	 *
	 * @param pattern
	 * @returns
	 */
	public matchPattern(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.fileNameMatcher(pattern, 'exact')
		);
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
	public beInFolder(folder: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.folderMatcher(folder, 'exact')
		);
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
	public matchFilename(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.fileNameMatcher(pattern, 'exact')
		);
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
	public matchPath(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.pathMatcher(pattern, 'exact')
		);
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
	public containInFilename(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.fileNameMatcher(pattern, 'partial')
		);
	}

	/**
	 * Match pattern partially against full relative path (allows substring matching)
	 *
	 * @param pattern - String pattern or RegExp to match within path
	 * @example
	 * ```typescript
	 * files.shouldNot().containInPath('services')
	 * files.shouldNot().containInPath(/test|spec/)
	 * ```
	 */
	public containInPath(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.pathMatcher(pattern, 'partial')
		);
	}
}

/**
 * Builder for creating positive file assertions. Files matching the preconditions
 * SHOULD meet the conditions defined through this builder.
 *
 * This class provides methods to define architectural rules that files should follow,
 * such as naming patterns, folder locations, dependency relationships, and custom conditions.
 *
 * @example
 * ```typescript
 * // Components should be in the components folder
 * projectFiles()
 *   .matching(/.*Component\.ts$/)
 *   .should()
 *   .beInFolder('components')
 *   .check();
 *
 * // Services should not have cycles
 * projectFiles()
 *   .inFolder('services')
 *   .should()
 *   .haveNoCycles()
 *   .check();
 *
 * // Models should follow naming convention
 * projectFiles()
 *   .inFolder('models')
 *   .should()
 *   .matchFilename(/.*Model\.ts$/)
 *   .check();
 * ```
 */
export class PositiveMatchPatternFileConditionBuilder {
	readonly isNegated: boolean = false;

	constructor(readonly filesShouldCondition: FilesShouldCondition) {}

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
	 * - NOT matching: 'src/cool-components/my-component-a.ts
	 *
	 *
	 * @param pattern
	 * @returns
	 */
	public matchPattern(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.fileNameMatcher(pattern, 'exact')
		);
	}

	/**
	 * Asserts that the files should have no circular dependencies.
	 * This checks for import cycles between the selected files.
	 *
	 * @example
	 * ```typescript
	 * // Services should not have circular dependencies
	 * projectFiles()
	 *   .inFolder('services')
	 *   .should()
	 *   .haveNoCycles()
	 *   .check();
	 *
	 * // All TypeScript files should be cycle-free
	 * projectFiles()
	 *   .matching(/.*\.ts$/)
	 *   .should()
	 *   .haveNoCycles()
	 *   .check();
	 * ```
	 *
	 * @returns CycleFreeFileCondition for checking the rule
	 */
	public haveNoCycles(): CycleFreeFileCondition {
		return new CycleFreeFileCondition(this);
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
	 * @example
	 * ```typescript
	 * // Components should be in the components folder
	 * projectFiles()
	 *   .matching(/.*Component\.ts$/)
	 *   .should()
	 *   .beInFolder('components')
	 *   .check();
	 *
	 * // Controllers should be in controllers subfolder
	 * projectFiles()
	 *   .withName('UserController.ts')
	 *   .should()
	 *   .beInFolder('src/controllers')
	 *   .check();
	 * ```
	 *
	 * @param folder String folder path for exact or glob pattern matching
	 * @returns MatchPatternFileCondition for checking the rule
	 */
	public beInFolder(folder: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.folderMatcher(folder, 'exact')
		);
	}

	/**
	 * Creates a dependency assertion builder. Files matching the current filters
	 * SHOULD depend on files matching the conditions defined through the returned builder.
	 *
	 * @example
	 * ```typescript
	 * // Controllers should depend on services
	 * projectFiles()
	 *   .inFolder('controllers')
	 *   .should()
	 *   .dependOnFiles()
	 *   .inFolder('services')
	 *   .check();
	 *
	 * // All components should depend on the base component
	 * projectFiles()
	 *   .matching(/.*Component\.ts$/)
	 *   .should()
	 *   .dependOnFiles()
	 *   .withName('BaseComponent.ts')
	 *   .check();
	 * ```
	 *
	 * @returns DependOnFileConditionBuilder for defining dependency conditions
	 */
	public dependOnFiles(): DependOnFileConditionBuilder {
		return new DependOnFileConditionBuilder(this);
	}

	/**
	 * Allows files to adhere to custom conditions defined by a callback function.
	 * This provides flexibility for complex architectural rules that can't be expressed
	 * through the standard API methods.
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
	 *
	 * @param condition Custom function that receives FileInfo and returns boolean
	 * @param message Error message to display when condition fails
	 * @returns CustomFileCheckableCondition for checking the rule
	 */
	public adhereTo(
		condition: CustomFileCondition,
		message: string
	): CustomFileCheckableCondition {
		return new CustomFileCheckableCondition(
			this.filesShouldCondition.fileCondition.tsConfigFilePath,
			condition,
			message,
			this.filesShouldCondition.filters
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
	public matchFilename(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.fileNameMatcher(pattern, 'exact')
		);
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
	public matchPath(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.pathMatcher(pattern, 'exact')
		);
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
	public containInFilename(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.fileNameMatcher(pattern, 'partial')
		);
	}

	/**
	 * Match pattern partially against full relative path (allows substring matching)
	 *
	 * @param pattern - String pattern or RegExp to match within path
	 * @example
	 * ```typescript
	 * files.should().containInPath('services')
	 * files.should().containInPath(/test|spec/)
	 * ```
	 */
	public containInPath(pattern: Pattern): MatchPatternFileCondition {
		return new MatchPatternFileCondition(
			this,
			RegexFactory.pathMatcher(pattern, 'partial')
		);
	}
}

/**
 * Builder for defining file dependency conditions. This class helps specify
 * which files the selected files should depend on through import statements.
 *
 * Dependency rules are useful for enforcing architectural patterns where certain
 * layers or components should depend on others, or to ensure that specific
 * shared dependencies are used consistently.
 *
 * @example
 * ```typescript
 * // Controllers should depend on services
 * projectFiles()
 *   .inFolder('controllers')
 *   .should() // or shouldNot()
 *   .dependOnFiles()
 *   .inFolder('services')
 *   .check();
 *
 * // All components should depend on the base component
 * projectFiles()
 *   .matching(/.*Component\.ts$/)
 *   .should()
 *   .dependOnFiles()
 *   .withName('BaseComponent.ts')
 *   .check();
 *
 * // UI components should not depend on business logic
 * projectFiles()
 *   .inFolder('components')
 *   .shouldNot()
 *   .dependOnFiles()
 *   .inFolder('business')
 *   .check();
 * ```
 */
export class DependOnFileConditionBuilder {
	constructor(
		readonly matchPatternFileConditionBuilder: NegatedMatchPatternFileConditionBuilder
	) {}

	/**
	 * @param pattern String pattern to match dependency files
	 * @returns DependOnFileCondition for further chaining or checking
	 */
	public matchingPattern(pattern: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this, [
			RegexFactory.fileNameMatcher(pattern, 'exact'),
		]);
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
	 * @example
	 * ```typescript
	 * // All services should depend on BaseService.ts
	 * projectFiles()
	 *   .inFolder('services')
	 *   .should()
	 *   .dependOnFiles()
	 *   .withName('BaseService.ts')
	 *   .check();
	 *
	 * // Controllers should not depend on specific model files
	 * projectFiles()
	 *   .inFolder('controllers')
	 *   .shouldNot()
	 *   .dependOnFiles()
	 *   .withName('UserModel.ts')
	 *   .check();
	 * ```
	 *
	 * @param name Exact filename including extension
	 * @returns DependOnFileCondition for further chaining or checking
	 */
	public withName(name: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this, [
			RegexFactory.fileNameMatcher(name, 'exact'),
		]);
	}

	/**
	 * Specifies dependency on files located in a specific folder.
	 * Supports exact folder matching and glob patterns.
	 *
	 * @example
	 * ```typescript
	 * // Controllers should depend on services
	 * projectFiles()
	 *   .inFolder('controllers')
	 *   .should()
	 *   .dependOnFiles()
	 *   .inFolder('services')
	 *   .check();
	 *
	 * // Components should not depend on utility folders
	 * projectFiles()
	 *   .inFolder('components')
	 *   .shouldNot()
	 *   .dependOnFiles()
	 *   .inFolder('utils')
	 *   .check();
	 * ```
	 *
	 * @param folder Folder name or path (supports glob patterns)
	 * @returns DependOnFileCondition for further chaining or checking
	 */
	public inFolder(folder: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this, [
			RegexFactory.folderMatcher(folder, 'exact'),
		]);
	}
}

/**
 * Represents a complete dependency condition that can be checked.
 * This class allows for additional dependency patterns to be chained
 * and provides the final check() method to validate the rule.
 *
 * Dependencies are checked by analyzing import statements in the selected files
 * to determine if they import from files matching the specified patterns.
 *
 * @example
 * ```typescript
 * // Multiple dependency patterns
 * projectFiles()
 *   .inFolder('controllers')
 *   .should()
 *   .dependOnFiles()
 *   .inFolder('services')
 *   .withName('Logger.ts')  // AND also depend on Logger
 *   .check();
 *
 * // Complex dependency checking
 * projectFiles()
 *   .matching(/.*Controller\.ts$/)
 *   .shouldNot()
 *   .dependOnFiles()
 *   .inFolder('models')
 *   .inFolder('database')  // Should not depend on either models OR database
 *   .check();
 * ```
 */
export class DependOnFileCondition implements Checkable {
	constructor(
		readonly dependOnFileConditionBuilder: DependOnFileConditionBuilder,
		readonly dependencyFilters: Filter[]
	) {}

	public matchingPattern(pattern: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.dependencyFilters,
			RegexFactory.fileNameMatcher(pattern, 'exact'),
		]);
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
	 * @example
	 * ```typescript
	 * // Services must depend on both BaseService.ts AND Logger.ts
	 * projectFiles()
	 *   .inFolder('services')
	 *   .should()
	 *   .dependOnFiles()
	 *   .withName('BaseService.ts')
	 *   .withName('Logger.ts')  // Additional requirement
	 *   .check();
	 * ```
	 *
	 * @param name Exact filename including extension
	 * @returns DependOnFileCondition with the added filename requirement
	 */
	public withName(name: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.dependencyFilters,
			RegexFactory.fileNameMatcher(name, 'exact'),
		]);
	}

	/**
	 * Adds an additional dependency on files in a specific folder.
	 * This extends the dependency requirements - files must depend on ALL specified patterns.
	 *
	 * @example
	 * ```typescript
	 * // Controllers must depend on both services AND utilities
	 * projectFiles()
	 *   .inFolder('controllers')
	 *   .should()
	 *   .dependOnFiles()
	 *   .inFolder('services')
	 *   .inFolder('utils')  // Additional requirement
	 *   .check();
	 * ```
	 *
	 * @param folder Folder name or path (supports glob patterns)
	 * @returns DependOnFileCondition with the added folder requirement
	 */
	public inFolder(folder: Pattern): DependOnFileCondition {
		return new DependOnFileCondition(this.dependOnFileConditionBuilder, [
			...this.dependencyFilters,
			RegexFactory.folderMatcher(folder, 'exact'),
		]);
	}

	/**
	 * Executes the dependency check by analyzing import statements.
	 *
	 * For positive assertions (should): Validates that selected files import from files
	 * matching the specified dependency patterns.
	 *
	 * For negative assertions (shouldNot): Validates that selected files do NOT import
	 * from files matching the specified dependency patterns.
	 *
	 * @param options Optional check options including allowEmptyTests and logging
	 * @returns Promise<Violation[]> Array of violations found during the check
	 */
	public async check(options?: CheckOptions): Promise<Violation[]> {
		const logger = new CheckLogger(options?.logging);
		const ruleName = `Dependency check: ${this.dependencyFilters.length} filters`;

		logger.startCheck(ruleName);
		logger.logProgress('Extracting project graph for dependency analysis...');

		const configFileName =
			this.dependOnFileConditionBuilder.matchPatternFileConditionBuilder
				.filesShouldCondition.fileCondition.tsConfigFilePath;

		const graph = await extractGraph(configFileName, options?.clearCache, logger);

		const projectedEdges = projectEdges(graph, perEdge());
		logger.logProgress(
			`Analyzing dependencies across ${projectedEdges.length} edges`
		);

		projectedEdges.forEach((edge) =>
			logger.info(`Found edge: From ${edge.sourceLabel} to ${edge.targetLabel}`)
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
			logger.logViolation(`Dependency violation: ${JSON.stringify(violation)}`);
		});

		logger.endCheck(ruleName, violations.length);
		return violations;
	}
}

/**
 * Condition for checking that files have no circular dependencies.
 * This condition analyzes import/export relationships to detect cycles
 * where files transitively import each other, creating circular dependencies.
 *
 * Circular dependencies can lead to module loading issues, harder debugging,
 * and tighter coupling between components. This condition helps enforce
 * good architectural practices by preventing such cycles.
 *
 * @example
 * ```typescript
 * // All services should be cycle-free
 * projectFiles()
 *   .inFolder('services')
 *   .should()
 *   .haveNoCycles()
 *   .check();
 *
 * // Check entire src folder for cycles
 * projectFiles()
 *   .inFolder('src')
 *   .should()
 *   .haveNoCycles()
 *   .check();
 * ```
 */
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
		const logger = new CheckLogger(options?.logging);
		const ruleName = 'Cycle detection check';

		logger.startCheck(ruleName);
		logger.logProgress('Extracting project graph for cycle detection...');

		const configFileName =
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath;
		const graph = await extractGraph(configFileName, options?.clearCache);

		const projectedEdges = projectEdges(graph, perInternalEdge());

		logger.logProgress(
			`Analyzing ${projectedEdges.length} internal dependencies for cycles`
		);
		projectedEdges.forEach((edge) =>
			logger.info(`Found edge: From ${edge.sourceLabel} to ${edge.targetLabel}`)
		);

		const violations = gatherCycleViolations(
			projectedEdges,
			this.matchPatternFileConditionBuilder.filesShouldCondition.filters,
			options
		);

		violations.forEach((violation) => {
			logger.logViolation(`Cycle detected: ${JSON.stringify(violation)}`);
		});
		logger.endCheck(ruleName, violations.length);

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
		const logger = new CheckLogger(options?.logging);
		const ruleName = `Pattern matching: ${this.filter.regExp}`;

		logger.startCheck(ruleName);
		logger.logProgress('Extracting project graph...');

		const configFileName =
			this.matchPatternFileConditionBuilder.filesShouldCondition.fileCondition
				.tsConfigFilePath;
		const graph = await extractGraph(configFileName, options?.clearCache);

		const projectedNodes = projectToNodes(graph);

		logger.logProgress(`Processing ${projectedNodes.length} files`);
		projectedNodes.forEach((node) => logger.info(`Found file: ${node.label}`));

		const violations = gatherRegexMatchingViolations(
			projectedNodes,
			this.filter,
			this.matchPatternFileConditionBuilder.filesShouldCondition.filters,
			this.matchPatternFileConditionBuilder.isNegated,
			options
		);

		violations.forEach((violation) => {
			logger.logViolation(`Pattern violation: ${JSON.stringify(violation)}`);
		});
		logger.endCheck(ruleName, violations.length);

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
		readonly filters?: Filter[]
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

		const logger = new CheckLogger(options?.logging);
		const ruleName = `Custom file condition: ${this.message || 'Custom rule'}`;

		logger.startCheck(ruleName);
		logger.logProgress('Extracting project graph for custom file analysis...');

		const graph = await extractGraph(this.tsConfigFilePath, options?.clearCache);
		const projectedNodes = projectToNodes(graph);

		logger.logProgress(`Applying custom condition to ${projectedNodes.length} files`);
		projectedNodes.forEach((node) => logger.info(`Found file: ${node.label}`));

		const violations = gatherCustomFileViolations(
			projectedNodes,
			this.filters || [],
			this.condition,
			this.message || 'Custom file condition failed',
			options
		);

		// Log violations if logging is enabled
		violations.forEach((violation) => {
			logger.logViolation(
				`Custom condition violation: ${JSON.stringify(violation)}`
			);
		});

		logger.endCheck(ruleName, violations.length);
		return violations;
	}
}
