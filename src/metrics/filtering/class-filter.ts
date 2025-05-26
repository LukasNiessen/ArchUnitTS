import { ClassInfo } from '../extraction/extract-class-info';
import * as path from 'path';

/**
 * Interface for filtering classes based on various criteria
 */
export interface ClassFilter {
	/**
	 * Apply the filter to a list of classes
	 * @param classes The classes to filter
	 * @returns Filtered classes that match the criteria
	 */
	apply(classes: ClassInfo[]): ClassInfo[];
}

/**
 * Filter classes by folder path using regex patterns
 */
export class FolderPathFilter implements ClassFilter {
	constructor(private readonly pathPattern: RegExp) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return classes.filter((classInfo) => {
			// Normalize the file path to use forward slashes for consistency
			const normalizedPath = classInfo.filePath.replace(/\\/g, '/');
			return this.pathPattern.test(normalizedPath);
		});
	}
}

/**
 * Filter classes by exact file path
 */
export class SingleFileFilter implements ClassFilter {
	constructor(private readonly filePath: string) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		// Normalize both paths for comparison
		const normalizedTargetPath = path.resolve(this.filePath).replace(/\\/g, '/');

		return classes.filter((classInfo) => {
			const normalizedClassPath = path
				.resolve(classInfo.filePath)
				.replace(/\\/g, '/');
			return normalizedClassPath === normalizedTargetPath;
		});
	}
}

/**
 * Filter classes by class name using regex patterns
 */
export class ClassNameFilter implements ClassFilter {
	constructor(private readonly namePattern: RegExp) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return classes.filter((classInfo) => {
			return this.namePattern.test(classInfo.name);
		});
	}
}

/**
 * Composite filter that combines multiple filters using AND logic
 */
export class CompositeFilter implements ClassFilter {
	constructor(private readonly filters: ClassFilter[]) {}

	apply(classes: ClassInfo[]): ClassInfo[] {
		return this.filters.reduce((filteredClasses, filter) => {
			return filter.apply(filteredClasses);
		}, classes);
	}
}

/**
 * Creates a filter for folder paths
 * @param pathPattern Regex pattern or string pattern for folder paths
 */
export function byFolderPath(pathPattern: string | RegExp): ClassFilter {
	const pattern =
		typeof pathPattern === 'string' ? new RegExp(pathPattern) : pathPattern;
	return new FolderPathFilter(pattern);
}

/**
 * Creates a filter for a single file
 * @param filePath Exact file path to filter by
 */
export function bySingleFile(filePath: string): ClassFilter {
	return new SingleFileFilter(filePath);
}

/**
 * Creates a filter for class names
 * @param namePattern Regex pattern or string pattern for class names
 */
export function byClassName(namePattern: string | RegExp): ClassFilter {
	const pattern =
		typeof namePattern === 'string' ? new RegExp(namePattern) : namePattern;
	return new ClassNameFilter(pattern);
}

/**
 * Combines multiple filters using AND logic
 * @param filters Array of filters to combine
 */
export function combineFilters(...filters: ClassFilter[]): ClassFilter {
	return new CompositeFilter(filters);
}
