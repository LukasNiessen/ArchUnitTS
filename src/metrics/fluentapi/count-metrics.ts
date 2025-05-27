import * as ts from 'typescript';
import * as path from 'path';
import { Violation } from '../../common/assertion/violation';
import { Checkable } from '../../common/fluentapi/checkable';
import { gatherMetricViolations } from '../assertion/metric-thresholds';
import {
	MethodCountMetric,
	FieldCountMetric,
	LinesOfCodeMetric,
	StatementCountMetric,
	ImportCountMetric,
	ClassCountMetric,
	InterfaceCountMetric,
	FunctionCountMetric,
	CountMetric,
	FileCountMetric,
} from '../calculation/count';
import { extractClassInfo } from '../extraction/extract-class-info';
import { ClassInfo } from '../extraction/interface';
import { projectToMetricResults } from '../projection/project-metrics';
import { MetricsBuilder } from './metrics';
import { MetricComparison } from './types';

/**
 * File-level metric violation
 */
export class FileCountViolation implements Violation {
	constructor(
		readonly filePath: string,
		readonly metricName: string,
		readonly metricValue: number,
		readonly threshold: number,
		readonly comparison: MetricComparison
	) {}

	toString(): string {
		const comparisonText = this.getComparisonDescription();
		return `File '${this.filePath}' has ${this.metricName} value of ${this.metricValue}, which ${comparisonText} ${this.threshold}`;
	}

	private getComparisonDescription(): string {
		switch (this.comparison) {
			case 'below':
				return 'should be below';
			case 'below-equal':
				return 'should be below or equal to';
			case 'above':
				return 'should be above';
			case 'above-equal':
				return 'should be above or equal to';
			case 'equal':
				return 'should be equal to';
			default:
				return 'should be';
		}
	}
}

/**
 * Result structure for count metrics analysis
 */
export interface CountMetricsResult {
	filePath: string;
	className?: string;
	metric: string;
	value: number;
	threshold?: number;
	passes: boolean;
}

/**
 * Project summary for count metrics
 */
export interface CountMetricsSummary {
	totalFiles: number;
	totalClasses: number;
	averageMethodsPerClass: number;
	averageFieldsPerClass: number;
	averageLinesOfCodePerFile: number;
	averageStatementsPerFile: number;
	averageImportsPerFile: number;
	largestFile: { path: string; lines: number };
	largestClass: { name: string; methods: number };
}

/**
 * File analysis result for count metrics
 */
export interface FileCountResult {
	filePath: string;
	linesOfCode: number;
	statements: number;
	imports: number;
	classes: number;
	interfaces: number;
	functions: number;
	sourceFile: ts.SourceFile;
}

/**
 * Builder for count metrics
 */
export class CountMetricsBuilder {
	constructor(readonly metricsBuilder: MetricsBuilder) {}

	/**
	 * Count methods per class
	 */
	public methodCount(): CountThresholdBuilder {
		return new CountThresholdBuilder(this.metricsBuilder, new MethodCountMetric());
	}

	/**
	 * Count fields per class
	 */
	public fieldCount(): CountThresholdBuilder {
		return new CountThresholdBuilder(this.metricsBuilder, new FieldCountMetric());
	}

	/**
	 * Count lines of code per file
	 */
	public linesOfCode(): FileCountThresholdBuilder {
		return new FileCountThresholdBuilder(
			this.metricsBuilder,
			new LinesOfCodeMetric()
		);
	}

	/**
	 * Count statements per file
	 */
	public statements(): FileCountThresholdBuilder {
		return new FileCountThresholdBuilder(
			this.metricsBuilder,
			new StatementCountMetric()
		);
	}

	/**
	 * Count imports per file
	 */
	public imports(): FileCountThresholdBuilder {
		return new FileCountThresholdBuilder(
			this.metricsBuilder,
			new ImportCountMetric()
		);
	}

	/**
	 * Count classes per file
	 */
	public classes(): FileCountThresholdBuilder {
		return new FileCountThresholdBuilder(this.metricsBuilder, new ClassCountMetric());
	}

	/**
	 * Count interfaces per file
	 */
	public interfaces(): FileCountThresholdBuilder {
		return new FileCountThresholdBuilder(
			this.metricsBuilder,
			new InterfaceCountMetric()
		);
	}

	/**
	 * Count functions per file
	 */
	public functions(): FileCountThresholdBuilder {
		return new FileCountThresholdBuilder(
			this.metricsBuilder,
			new FunctionCountMetric()
		);
	}

	/**
	 * Calculate comprehensive count metrics summary
	 */
	public async summary(): Promise<CountMetricsSummary> {
		const fileResults = await this.analyzeFiles();
		const classResults = await this.analyzeClasses();

		const totalFiles = fileResults.length;
		const totalClasses = classResults.length;

		const avgMethods =
			totalClasses > 0
				? classResults.reduce((sum, c) => sum + c.methods.length, 0) /
					totalClasses
				: 0;

		const avgFields =
			totalClasses > 0
				? classResults.reduce((sum, c) => sum + c.fields.length, 0) / totalClasses
				: 0;

		const avgLines =
			totalFiles > 0
				? fileResults.reduce((sum, f) => sum + f.linesOfCode, 0) / totalFiles
				: 0;

		const avgStatements =
			totalFiles > 0
				? fileResults.reduce((sum, f) => sum + f.statements, 0) / totalFiles
				: 0;

		const avgImports =
			totalFiles > 0
				? fileResults.reduce((sum, f) => sum + f.imports, 0) / totalFiles
				: 0;

		const largestFile = fileResults.reduce(
			(max, current) =>
				current.linesOfCode > max.lines
					? { path: current.filePath, lines: current.linesOfCode }
					: max,
			{ path: '', lines: 0 }
		);

		const largestClass = classResults.reduce(
			(max, current) =>
				current.methods.length > max.methods
					? { name: current.name, methods: current.methods.length }
					: max,
			{ name: '', methods: 0 }
		);

		return {
			totalFiles,
			totalClasses,
			averageMethodsPerClass: avgMethods,
			averageFieldsPerClass: avgFields,
			averageLinesOfCodePerFile: avgLines,
			averageStatementsPerFile: avgStatements,
			averageImportsPerFile: avgImports,
			largestFile,
			largestClass,
		};
	}

	private async analyzeFiles(): Promise<FileCountResult[]> {
		const results: FileCountResult[] = [];
		const program = this.createTypeScriptProgram();

		for (const sourceFile of program.getSourceFiles()) {
			if (
				!sourceFile.isDeclarationFile &&
				!sourceFile.fileName.includes('node_modules')
			) {
				const linesMetric = new LinesOfCodeMetric();
				const statementsMetric = new StatementCountMetric();
				const importsMetric = new ImportCountMetric();
				const classesMetric = new ClassCountMetric();
				const interfacesMetric = new InterfaceCountMetric();
				const functionsMetric = new FunctionCountMetric();

				results.push({
					filePath: sourceFile.fileName,
					linesOfCode: linesMetric.calculateFromFile(sourceFile),
					statements: statementsMetric.calculateFromFile(sourceFile),
					imports: importsMetric.calculateFromFile(sourceFile),
					classes: classesMetric.calculateFromFile(sourceFile),
					interfaces: interfacesMetric.calculateFromFile(sourceFile),
					functions: functionsMetric.calculateFromFile(sourceFile),
					sourceFile,
				});
			}
		}

		return results;
	}

	private async analyzeClasses(): Promise<ClassInfo[]> {
		return extractClassInfo(this.metricsBuilder.tsConfigFilePath);
	}

	private createTypeScriptProgram(): ts.Program {
		const projectPath = process.cwd();
		const configPath = this.metricsBuilder.tsConfigFilePath
			? path.resolve(projectPath, this.metricsBuilder.tsConfigFilePath)
			: path.resolve(projectPath, 'tsconfig.json');

		const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
		if (configFile.error) {
			throw new Error(
				`Error reading tsconfig file: ${configFile.error.messageText}`
			);
		}

		const parsedConfig = ts.parseJsonConfigFileContent(
			configFile.config,
			ts.sys,
			path.dirname(configPath),
			{},
			configPath
		);

		if (parsedConfig.errors.length > 0) {
			throw new Error(
				`Error parsing tsconfig file: ${parsedConfig.errors[0].messageText}`
			);
		}

		return ts.createProgram({
			rootNames: parsedConfig.fileNames,
			options: parsedConfig.options,
		});
	}
}

/**
 * Builder for class-level count metric thresholds
 */
export class CountThresholdBuilder implements Checkable {
	private threshold?: number;
	private comparison?: MetricComparison;
	constructor(
		readonly metricsBuilder: MetricsBuilder,
		readonly metric: CountMetric
	) {}
	public shouldBeBelow(threshold: number): CountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'below';
		return this;
	}
	public shouldBeBelowOrEqual(threshold: number): CountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'below-equal';
		return this;
	}
	public shouldBeAbove(threshold: number): CountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'above';
		return this;
	}
	public shouldBeAboveOrEqual(threshold: number): CountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'above-equal';
		return this;
	}
	public shouldBe(threshold: number): CountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'equal';
		return this;
	}
	async check(): Promise<Violation[]> {
		if (this.threshold === undefined || !this.comparison) {
			throw new Error('Threshold and comparison must be set before checking');
		}

		const classes = extractClassInfo(this.metricsBuilder.tsConfigFilePath);
		const filteredClasses =
			this.metricsBuilder.getFilter()?.apply(classes) ?? classes;
		const results = projectToMetricResults(
			filteredClasses,
			this.metric,
			this.threshold,
			this.comparison
		);

		return gatherMetricViolations(results);
	}
}

/**
 * Builder for file-level count metric thresholds
 */
export class FileCountThresholdBuilder implements Checkable {
	private threshold?: number;
	private comparison?: MetricComparison;

	constructor(
		readonly metricsBuilder: MetricsBuilder,
		readonly metric: FileCountMetric
	) {}

	public shouldBeBelow(threshold: number): FileCountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'below';
		return this;
	}

	public shouldBeBelowOrEqual(threshold: number): FileCountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'below-equal';
		return this;
	}

	public shouldBeAbove(threshold: number): FileCountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'above';
		return this;
	}

	public shouldBeAboveOrEqual(threshold: number): FileCountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'above-equal';
		return this;
	}

	public shouldBe(threshold: number): FileCountThresholdBuilder {
		this.threshold = threshold;
		this.comparison = 'equal';
		return this;
	}

	async check(): Promise<Violation[]> {
		if (!this.threshold || !this.comparison) {
			throw new Error('Threshold and comparison must be set before checking');
		}

		const violations: Violation[] = [];
		const program = this.createTypeScriptProgram();

		for (const sourceFile of program.getSourceFiles()) {
			if (
				!sourceFile.isDeclarationFile &&
				!sourceFile.fileName.includes('node_modules')
			) {
				// Apply file filtering if specified
				if (this.metricsBuilder.getFilter()) {
					// For file-level metrics, we need to check if this file should be included
					// This is a simplified check - in a more complete implementation,
					// we'd need to enhance the filter system to work with files
					// For now, we'll include all files and let class-level filters be ignored
				}

				const value = this.metric.calculateFromFile(sourceFile);
				const passes = this.evaluateThreshold(value);
				if (!passes) {
					violations.push(
						new FileCountViolation(
							sourceFile.fileName,
							this.metric.name,
							value,
							this.threshold,
							this.comparison
						)
					);
				}
			}
		}

		return violations;
	}
	private evaluateThreshold(value: number): boolean {
		if (!this.threshold || !this.comparison) return true;

		switch (this.comparison) {
			case 'below':
				return value < this.threshold;
			case 'below-equal':
				return value <= this.threshold;
			case 'above':
				return value > this.threshold;
			case 'above-equal':
				return value >= this.threshold;
			case 'equal':
				return value === this.threshold;
			default:
				return true;
		}
	}
	private getComparisonDescription(): string {
		switch (this.comparison) {
			case 'below':
				return 'should be below';
			case 'below-equal':
				return 'should be below or equal to';
			case 'above':
				return 'should be above';
			case 'above-equal':
				return 'should be above or equal to';
			case 'equal':
				return 'should be equal to';
			default:
				return 'should be';
		}
	}

	private createTypeScriptProgram(): ts.Program {
		const projectPath = process.cwd();
		const configPath = this.metricsBuilder.tsConfigFilePath
			? path.resolve(projectPath, this.metricsBuilder.tsConfigFilePath)
			: path.resolve(projectPath, 'tsconfig.json');

		const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
		if (configFile.error) {
			throw new Error(
				`Error reading tsconfig file: ${configFile.error.messageText}`
			);
		}

		const parsedConfig = ts.parseJsonConfigFileContent(
			configFile.config,
			ts.sys,
			path.dirname(configPath),
			{},
			configPath
		);

		if (parsedConfig.errors.length > 0) {
			throw new Error(
				`Error parsing tsconfig file: ${parsedConfig.errors[0].messageText}`
			);
		}

		return ts.createProgram({
			rootNames: parsedConfig.fileNames,
			options: parsedConfig.options,
		});
	}
}
