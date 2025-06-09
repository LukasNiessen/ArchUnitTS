import ts from 'typescript';

export interface MethodInfo {
	name: string;
	accessedFields: string[];
}

export interface FieldInfo {
	name: string;
	accessedBy: string[]; // method names that access this field
}

export interface ClassInfo {
	name: string;
	filePath: string;
	methods: MethodInfo[];
	fields: FieldInfo[];
	sourceFile?: ts.SourceFile;
}

/**
 * Generic metric interface that all metrics should implement
 */
export interface Metric {
	name: string;
	calculate(classInfo: ClassInfo): number;
	description: string;
}

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
