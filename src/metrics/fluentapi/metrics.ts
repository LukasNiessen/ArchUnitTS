import {
	byFolderPath,
	bySingleFile,
	byClassName,
	combineFilters,
} from '../projection/project-metrics';
import { ClassFilter } from '../extraction/interface';
import { DistanceMetricsBuilder } from './distance-metrics';
import { LCOMMetricsBuilder } from './lcom-metrics';

/**
 * Entry point for code metrics analysis.
 *
 * @param tsConfigFilePath Optional path to tsconfig.json file
 * @returns A builder for configuring metrics analysis
 *
 */
export const metrics = (tsConfigFilePath?: string): MetricsBuilder => {
	return new MetricsBuilder(tsConfigFilePath);
};

/**
 * Builder for metrics analysis
 */
export class MetricsBuilder {
	private filters: ClassFilter[] = [];

	constructor(readonly tsConfigFilePath?: string) {}

	/**
	 * Filter classes by folder path using regex pattern
	 * @param folderPattern String or regex pattern matching folder paths
	 */
	public inFolder(folderPattern: string | RegExp): MetricsBuilder {
		this.filters.push(byFolderPath(folderPattern));
		return this;
	}

	/**
	 * Filter classes to a specific file
	 * @param filePath Path to the specific file
	 */
	public inFile(filePath: string): MetricsBuilder {
		this.filters.push(bySingleFile(filePath));
		return this;
	}

	/**
	 * Filter classes by name using regex pattern
	 * @param namePattern String or regex pattern matching class names
	 */
	public forClassesMatching(namePattern: string | RegExp): MetricsBuilder {
		this.filters.push(byClassName(namePattern));
		return this;
	}

	/**
	 * Get the combined filter for all applied filters
	 */
	public getFilter(): ClassFilter | null {
		if (this.filters.length === 0) {
			return null;
		}
		return combineFilters(this.filters);
	}
	/**
	 * Configure LCOM (Lack of Cohesion of Methods) metrics
	 */
	public lcom(): LCOMMetricsBuilder {
		return new LCOMMetricsBuilder(this);
	}

	/**
	 * Configure distance metrics (Abstractness, Instability, Distance from Main Sequence)
	 */
	public distance(): DistanceMetricsBuilder {
		return new DistanceMetricsBuilder(this.tsConfigFilePath);
	}
}
