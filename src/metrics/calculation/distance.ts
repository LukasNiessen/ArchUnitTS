import { FileAnalysisResult, extractEnhancedClassInfo } from '../extraction';
import { countDeclarations } from '../../common/util';

/**
 * Distance to Main Sequence metrics interface
 */
export interface DistanceMetric {
	name: string;
	calculateForFile(analysisResult: FileAnalysisResult): number;
	description: string;
}

/**
 * Abstractness metric (A)
 *
 * Measures the ratio of abstract declarations to total declarations in a file.
 * Formula: A = Na / N
 * Where:
 * - Na = number of abstract elements (interfaces, abstract classes, abstract methods)
 * - N = total number of declarations
 */
export class Abstractness implements DistanceMetric {
	name = 'Abstractness';
	description =
		'Measures the ratio of abstract elements to total declarations (0 = concrete, 1 = abstract)';

	calculateForFile(analysisResult: FileAnalysisResult): number {
		// Use sourceFile property if available for more accurate file-wise analysis
		if (analysisResult.sourceFile) {
			// Using countDeclarations for more accurate analysis
			const declarationCounts = countDeclarations(analysisResult.sourceFile);

			if (declarationCounts.total === 0) {
				return 0; // No declarations to analyze
			}

			// Na = Abstract elements (interfaces + abstract classes + abstract methods)
			const abstractElements =
				declarationCounts.interfaces +
				declarationCounts.abstractClasses +
				declarationCounts.abstractMethods;

			// N = Total declarations
			const totalDeclarations = declarationCounts.total;

			// A = Na / N
			return abstractElements / totalDeclarations;
		} else {
			// Fall back to the previous implementation if sourceFile isn't available
			// This maintains backward compatibility
			if (analysisResult.totalTypes === 0) {
				return 0; // No declarations to analyze
			}

			// Na = Abstract elements (interfaces + abstract classes)
			// Note: Without sourceFile, we can't count abstract methods accurately
			const abstractElements =
				analysisResult.interfaces + analysisResult.abstractClasses;

			// N = Total types
			const totalDeclarations = analysisResult.totalTypes;

			// A = Na / N
			return abstractElements / totalDeclarations;
		}
	}
}

/**
 * Instability metric (I)
 *
 * Measures the ratio of efferent coupling (outgoing dependencies) to total coupling.
 * Formula: I = Ce / (Ca + Ce)
 * Where:
 * - Ce = efferent coupling (outgoing dependencies)
 * - Ca = afferent coupling (incoming dependencies)
 */
export class Instability implements DistanceMetric {
	name = 'Instability';
	description =
		'Measures the instability of a file based on its dependencies (0 = stable, 1 = unstable)';

	calculateForFile(analysisResult: FileAnalysisResult): number {
		// Get dependency info from file analysis
		const dependencies = analysisResult.dependencies;

		// Calculate efferent coupling (Ce) - outgoing dependencies
		const efferentCoupling = dependencies.efferentCoupling;

		// Calculate afferent coupling (Ca) - incoming dependencies
		const afferentCoupling = dependencies.afferentCoupling;

		// Calculate total coupling
		const totalCoupling = efferentCoupling + afferentCoupling;

		if (totalCoupling === 0) {
			return 0; // No coupling means stable by default
		}

		// I = Ce / (Ca + Ce)
		return efferentCoupling / totalCoupling;
	}
}

/**
 * Distance from Main Sequence metric (D)
 *
 * Robert Martin's metric that measures how far a component is from the ideal
 * balance between abstractness and instability.
 *
 * Formula: D = |A + I - 1|
 * Where:
 * - A = Abstractness (0 to 1)
 * - I = Instability (0 to 1)
 * - The main sequence is the line A + I = 1
 *
 * Interpretation:
 * - D = 0: On the main sequence (ideal)
 * - D closer to 0: Better design
 * - D closer to 1: Further from ideal balance
 *
 * When applied to files (file-wise analysis):
 * - Files that are abstract and stable (A high, I low) are on the main sequence
 * - Files that are concrete and unstable (A low, I high) are on the main sequence
 * - Files that are abstract and unstable are in the Zone of Uselessness
 * - Files that are concrete and stable are in the Zone of Pain
 */
export class DistanceFromMainSequence implements DistanceMetric {
	name = 'DistanceFromMainSequence';
	description =
		'Distance from the Main Sequence (Robert Martin) - measures balance between abstractness and instability';

	private abstractness = new Abstractness();
	private instability = new Instability();

	calculateForFile(analysisResult: FileAnalysisResult): number {
		// Calculate file-wise abstractness metric (A)
		const A = this.abstractness.calculateForFile(analysisResult);

		// Calculate file-wise instability metric (I)
		const I = this.instability.calculateForFile(analysisResult);

		// D = |A + I - 1|
		return Math.abs(A + I - 1);
	}
}

/**
 * Coupling Factor metric (CF)
 *
 * Measures how tightly coupled a file is based on both incoming and outgoing dependencies.
 * Higher values indicate more coupling, which generally should be minimized.
 * Formula: CF = (Ca + Ce) / Cmax
 * Where:
 * - Ca = afferent coupling (incoming dependencies)
 * - Ce = efferent coupling (outgoing dependencies)
 * - Cmax = maximum possible coupling (a normalization factor, typically file count - 1)
 */
export class CouplingFactor implements DistanceMetric {
	name = 'CouplingFactor';
	description =
		'Measures how tightly coupled a file is based on dependencies (0 = no coupling, 1 = maximum coupling)';

	calculateForFile(analysisResult: FileAnalysisResult, totalFiles?: number): number {
		// Get dependency info from file analysis
		const dependencies = analysisResult.dependencies;

		// Calculate efferent coupling (Ce) - outgoing dependencies
		const efferentCoupling = dependencies.efferentCoupling;

		// Calculate afferent coupling (Ca) - incoming dependencies
		const afferentCoupling = dependencies.afferentCoupling;

		// Total coupling is the sum of incoming and outgoing dependencies
		const totalCoupling = efferentCoupling + afferentCoupling;

		// If we know total files in project, normalize by that, otherwise use a default normalization
		const maxPossibleCoupling = totalFiles ? totalFiles - 1 : 10;

		if (maxPossibleCoupling <= 0) {
			return 0; // Avoid division by zero
		}

		// Normalize to [0,1]
		return Math.min(1, totalCoupling / maxPossibleCoupling);
	}
}

/**
 * Normalized Distance metric (ND)
 *
 * A modified version of Distance from Main Sequence that accounts for file size.
 * Files with more code are expected to be more complex and potentially have
 * more responsibilities, so they should be closer to the main sequence.
 * Formula: ND = D * (1 - S/Smax)
 * Where:
 * - D = Distance from Main Sequence
 * - S = Size of file (measured in LOC or declarations)
 * - Smax = Maximum size for normalization
 */
export class NormalizedDistance implements DistanceMetric {
	name = 'NormalizedDistance';
	description =
		'A size-adjusted distance metric that accounts for file complexity (0 = ideal balance, 1 = furthest from ideal)';

	// Use the standard distance metric as a base
	private distance = new DistanceFromMainSequence();

	calculateForFile(analysisResult: FileAnalysisResult): number {
		// Calculate the standard distance from main sequence
		const baseDistance = this.distance.calculateForFile(analysisResult);

		// Use declaration count as a measure of file size
		let fileSize = 0;
		if (analysisResult.sourceFile) {
			const declarationCounts = countDeclarations(analysisResult.sourceFile);
			fileSize = declarationCounts.total;
		} else {
			fileSize = analysisResult.totalTypes;
		}

		// Maximum file size for normalization - this can be adjusted based on project standards
		const maxFileSize = 100;

		// Normalize file size to a factor between 0 and 1
		const sizeFactor = Math.min(1, fileSize / maxFileSize);

		// Reduce the distance penalty for larger files (more complex files are expected to have
		// more responsibilities, so they get more leeway in terms of distance from main sequence)
		return baseDistance * (1 - sizeFactor * 0.5); // Only reduce by up to 50%
	}
}

/**
 * Calculate distance metrics for a single file
 * @param analysisResult The file analysis result
 * @param totalFiles Optional total number of files for coupling factor calculation
 * @returns Distance metrics for the file
 */
export function calculateFileDistanceMetrics(
	analysisResult: FileAnalysisResult,
	totalFiles?: number
): {
	filePath: string;
	abstractness: number;
	instability: number;
	distanceFromMainSequence: number;
	couplingFactor: number;
	normalizedDistance: number;
	analysisResult: FileAnalysisResult;
} {
	const abstractness = new Abstractness();
	const instability = new Instability();
	const distance = new DistanceFromMainSequence();
	const coupling = new CouplingFactor();
	const normalizedDistance = new NormalizedDistance();

	return {
		filePath: analysisResult.filePath,
		abstractness: abstractness.calculateForFile(analysisResult),
		instability: instability.calculateForFile(analysisResult),
		distanceFromMainSequence: distance.calculateForFile(analysisResult),
		couplingFactor: coupling.calculateForFile(analysisResult, totalFiles),
		normalizedDistance: normalizedDistance.calculateForFile(analysisResult),
		analysisResult,
	};
}

/**
 * Utility function to calculate distance metrics for an entire project
 * using file-wise analysis based on TypeScript AST and dependency graphs
 */
export async function calculateDistanceMetricsForProject(
	tsConfigPath?: string,
	projectPath?: string
): Promise<{
	fileResults: Array<{
		filePath: string;
		abstractness: number;
		instability: number;
		distanceFromMainSequence: number;
		couplingFactor: number;
		normalizedDistance: number;
		analysisResult: FileAnalysisResult;
	}>;
	projectSummary: {
		totalFiles: number;
		averageAbstractness: number;
		averageInstability: number;
		averageDistance: number;
		averageCouplingFactor: number;
		averageNormalizedDistance: number;
		filesOnMainSequence: number; // files with distance < 0.1
	};
}> {
	const analysisResults = await extractEnhancedClassInfo(tsConfigPath, projectPath);
	const fileCount = analysisResults.length;

	// Use the helper function to calculate metrics for each file
	const fileResults = analysisResults.map((result) =>
		calculateFileDistanceMetrics(result, fileCount)
	);

	// Calculate project-level summary statistics
	const totalFiles = fileResults.length;
	const averageAbstractness =
		totalFiles > 0
			? fileResults.reduce((sum, f) => sum + f.abstractness, 0) / totalFiles
			: 0;
	const averageInstability =
		totalFiles > 0
			? fileResults.reduce((sum, f) => sum + f.instability, 0) / totalFiles
			: 0;
	const averageDistance =
		totalFiles > 0
			? fileResults.reduce((sum, f) => sum + f.distanceFromMainSequence, 0) /
				totalFiles
			: 0;
	const averageCouplingFactor =
		totalFiles > 0
			? fileResults.reduce((sum, f) => sum + f.couplingFactor, 0) / totalFiles
			: 0;
	const averageNormalizedDistance =
		totalFiles > 0
			? fileResults.reduce((sum, f) => sum + f.normalizedDistance, 0) / totalFiles
			: 0;
	const filesOnMainSequence = fileResults.filter(
		(f) => f.distanceFromMainSequence < 0.1
	).length;

	return {
		fileResults,
		projectSummary: {
			totalFiles,
			averageAbstractness,
			averageInstability,
			averageDistance,
			averageCouplingFactor,
			averageNormalizedDistance,
			filesOnMainSequence,
		},
	};
}
