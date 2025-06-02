/**
 * Comprehensive example demonstrating the logging capabilities of ArchUnitTS
 *
 * This example shows how to:
 * 1. Configure different logging levels and outputs
 * 2. Use logging with various architecture checks
 * 3. Monitor progress and violations during rule evaluation
 */

import { files } from '../src/files/fluentapi/files';
import { metrics } from '../src/metrics/fluentapi/metrics';
import { DefaultLogger } from '../src/common/util/logger';
import { Logger } from '../src/common/fluentapi/checkable';

// Custom logger that logs to both console and captures logs for analysis
class ExampleLogger implements Logger {
	private logs: Array<{ level: string; message: string; timestamp: Date }> = [];

	debug(message: string, ...args: unknown[]): void {
		this.logWithLevel('DEBUG', message, args);
	}

	info(message: string, ...args: unknown[]): void {
		this.logWithLevel('INFO', message, args);
	}

	warn(message: string, ...args: unknown[]): void {
		this.logWithLevel('WARN', message, args);
	}

	error(message: string, ...args: unknown[]): void {
		this.logWithLevel('ERROR', message, args);
	}

	private logWithLevel(level: string, message: string, args: unknown[]): void {
		const timestamp = new Date();
		const formattedMessage =
			args.length > 0 ? `${message} ${args.join(' ')}` : message;

		this.logs.push({ level, message: formattedMessage, timestamp });
		console.log(`[${timestamp.toISOString()}] [${level}] ${formattedMessage}`);
	}

	getLogs() {
		return this.logs;
	}

	getLogsSummary() {
		const summary = this.logs.reduce(
			(acc, log) => {
				acc[log.level] = (acc[log.level] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		return {
			total: this.logs.length,
			byLevel: summary,
			duration:
				this.logs.length > 0
					? this.logs[this.logs.length - 1].timestamp.getTime() -
						this.logs[0].timestamp.getTime()
					: 0,
		};
	}
}

async function demonstrateLoggingCapabilities() {
	console.log('=== ArchUnitTS Logging Demonstration ===\n');

	// Example 1: Basic console logging with info level
	console.log('1. Basic Console Logging (Info Level)');
	console.log('-------------------------------------');

	const basicLoggingOptions = {
		enabled: true,
		level: 'info' as const,
		logger: new DefaultLogger('info'),
		logTiming: true,
		logViolations: true,
		logProgress: true,
	};
	const fileCheckResult = await files()
		.inFolder('src')
		.should()
		.matchFilename(/.*\.ts$/)
		.check({ logging: basicLoggingOptions });

	console.log(`Basic check found ${fileCheckResult.length} violations\n`);

	// Example 2: Debug level logging with custom logger
	console.log('2. Debug Level Logging with Custom Logger');
	console.log('----------------------------------------');

	const customLogger = new ExampleLogger();
	const debugLoggingOptions = {
		enabled: true,
		level: 'debug' as const,
		logger: customLogger,
		logTiming: true,
		logViolations: true,
		logProgress: true,
	};
	const metricsResult = await metrics('./tsconfig.json')
		.inFolder('src/files')
		.lcom()
		.lcom4()
		.shouldBeBelowOrEqual(10)
		.check({ logging: debugLoggingOptions });

	console.log(`LCOM4 check found ${metricsResult.length} violations`);

	const logsSummary = customLogger.getLogsSummary();
	console.log(`Custom logger captured ${logsSummary.total} log entries:`);
	console.log(`  - Debug: ${logsSummary.byLevel.DEBUG || 0}`);
	console.log(`  - Info: ${logsSummary.byLevel.INFO || 0}`);
	console.log(`  - Warn: ${logsSummary.byLevel.WARN || 0}`);
	console.log(`  - Error: ${logsSummary.byLevel.ERROR || 0}`);
	console.log(`Total execution time: ${logsSummary.duration}ms\n`);

	// Example 3: Metrics logging with progress tracking
	console.log('3. Comprehensive Metrics Logging');
	console.log('--------------------------------');

	const comprehensiveLoggingOptions = {
		enabled: true,
		level: 'debug' as const,
		logger: new DefaultLogger('debug'),
		logTiming: true,
		logViolations: true,
		logProgress: true,
	};
	// Count metrics with logging
	console.log('Running count metrics checks...');
	const countResult = await metrics('./tsconfig.json')
		.inFolder('src')
		.count()
		.methodCount()
		.shouldBeBelowOrEqual(20)
		.check({ logging: comprehensiveLoggingOptions });

	// Distance metrics with logging
	console.log('\nRunning distance metrics checks...');
	const distanceResult = await metrics('./tsconfig.json')
		.distance()
		.forFile('src/files/fluentapi/files.ts')
		.abstractness()
		.shouldBeBelowOrEqual(0.8)
		.check({ logging: comprehensiveLoggingOptions });
	// Custom metrics with logging
	console.log('\nRunning custom metrics checks...');
	const customResult = await metrics('./tsconfig.json')
		.inFolder('src')
		.customMetric(
			'ComplexityScore',
			'Custom complexity calculation',
			(classInfo) => classInfo.methods.length + classInfo.fields.length
		)
		.shouldBeBelow(50)
		.check({ logging: comprehensiveLoggingOptions });

	console.log(`\nResults Summary:`);
	console.log(`- Count metrics violations: ${countResult.length}`);
	console.log(`- Distance metrics violations: ${distanceResult.length}`);
	console.log(`- Custom metrics violations: ${customResult.length}`);

	// Example 4: File-level checks with detailed logging
	console.log('\n4. File-Level Checks with Detailed Logging');
	console.log('------------------------------------------');

	const detailedLoggingOptions = {
		enabled: true,
		level: 'debug' as const,
		logger: new DefaultLogger('debug'),
		logTiming: true,
		logViolations: true,
		logProgress: true,
	};
	const dependencyResult = await files()
		.inFolder('src/files')
		.should()
		.dependOnFiles()
		.inFolder('src/common')
		.check({ logging: detailedLoggingOptions });

	const cycleFreeResult = await files()
		.inFolder('src')
		.should()
		.haveNoCycles()
		.check({ logging: detailedLoggingOptions });

	console.log(`\nFile Architecture Check Results:`);
	console.log(`- Dependency violations: ${dependencyResult.length}`);
	console.log(`- Cycle violations: ${cycleFreeResult.length}`);

	// Example 5: Disabled logging for performance comparison
	console.log('\n5. Performance Comparison (Logging Disabled)');
	console.log('--------------------------------------------');

	const disabledLoggingOptions = {
		enabled: false,
	};

	const startTime = Date.now();
	const perfResult = await metrics('./tsconfig.json')
		.inFolder('src')
		.lcom()
		.lcom1()
		.shouldBeBelowOrEqual(100)
		.check({ logging: disabledLoggingOptions });

	const endTime = Date.now();

	console.log(`LCOM1 check completed in ${endTime - startTime}ms without logging`);
	console.log(`Found ${perfResult.length} violations`);

	console.log('\n=== Logging Demonstration Complete ===');
}

// Configuration examples for different scenarios
export const loggingConfigurations = {
	// Production: Minimal logging, only errors and warnings
	production: {
		enabled: true,
		level: 'warn' as const,
		logger: new DefaultLogger('warn'),
		logTiming: false,
		logViolations: true,
		logProgress: false,
	},

	// Development: Full logging for debugging
	development: {
		enabled: true,
		level: 'debug' as const,
		logger: new DefaultLogger('debug'),
		logTiming: true,
		logViolations: true,
		logProgress: true,
	},

	// CI/CD: Structured logging for automated analysis
	cicd: {
		enabled: true,
		level: 'info' as const,
		logger: new DefaultLogger('info'),
		logTiming: true,
		logViolations: true,
		logProgress: false,
	},

	// Performance testing: Logging disabled
	performance: {
		enabled: false,
	},

	// Silent: No logging at all
	silent: {
		enabled: false,
	},
};

// Usage examples for different domains
export const usageExamples = {
	async filesWithLogging() {
		const options = loggingConfigurations.development;

		// Simple example: files in src folder should match .ts pattern
		const tsFileResult = await files()
			.inFolder('src')
			.should()
			.matchFilename(/.*\.ts$/)
			.check({ logging: options });

		// Files should not depend on test files
		const dependencyResult = await files()
			.inFolder('src')
			.shouldNot()
			.dependOnFiles()
			.inFolder('test')
			.check({ logging: options });

		return [...tsFileResult, ...dependencyResult];
	},

	async metricsWithLogging() {
		const options = loggingConfigurations.development;

		const lcomResults = await metrics('./tsconfig.json')
			.lcom()
			.lcom4()
			.shouldBeBelowOrEqual(5)
			.check({ logging: options });

		const countResults = await metrics('./tsconfig.json')
			.count()
			.linesOfCode()
			.shouldBeBelowOrEqual(200)
			.check({ logging: options });

		return [...lcomResults, ...countResults];
	},

	async customMetricsWithLogging() {
		const options = loggingConfigurations.development;

		return await metrics('./tsconfig.json')
			.customMetric(
				'TestCoverage',
				'Estimated test coverage based on method count',
				(classInfo) => {
					// Simple heuristic: classes with more methods need more tests
					const methodCount = classInfo.methods.length;
					return methodCount > 0 ? Math.min(1.0, 1.0 / methodCount) : 1.0;
				}
			)
			.shouldBeAbove(0.8)
			.check({ logging: options });
	},
};

// Run the demonstration if this file is executed directly
if (require.main === module) {
	demonstrateLoggingCapabilities().catch(console.error);
}
