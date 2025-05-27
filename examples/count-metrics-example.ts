import { metrics } from '../src/metrics/fluentapi/metrics';

/**
 * Example usage of Count Metrics in ArchUnitTS
 *
 * This file demonstrates how to use the newly implemented count-based metrics
 * to enforce architectural constraints related to code size and complexity.
 */

// Example 1: Limit method count per class
export async function checkMethodCount() {
	console.log('Checking method count constraints...');

	const violations = await metrics()
		.inFolder('src') // Only check files in src folder
		.count()
		.methodCount()
		.shouldBeBelowOrEqual(10) // No class should have more than 10 methods
		.check();

	if (violations.length > 0) {
		console.log('Method count violations found:');
		violations.forEach((v) => console.log(' -', v.toString()));
	} else {
		console.log('✓ All classes have acceptable method counts');
	}
}

// Example 2: Limit field count per class
export async function checkFieldCount() {
	console.log('Checking field count constraints...');

	const violations = await metrics()
		.forClassesMatching(/.*Service$/) // Only check service classes
		.count()
		.fieldCount()
		.shouldBeBelowOrEqual(5) // Service classes shouldn't have more than 5 fields
		.check();

	if (violations.length > 0) {
		console.log('Field count violations found:');
		violations.forEach((v) => console.log(' -', v.toString()));
	} else {
		console.log('✓ All service classes have acceptable field counts');
	}
}

// Example 3: Limit lines of code per file
export async function checkLinesOfCode() {
	console.log('Checking lines of code constraints...');

	const violations = await metrics()
		.count()
		.linesOfCode()
		.shouldBeBelowOrEqual(300) // No file should have more than 300 lines
		.check();

	if (violations.length > 0) {
		console.log('Lines of code violations found:');
		violations.forEach((v) => console.log(' -', v.toString()));
	} else {
		console.log('✓ All files have acceptable line counts');
	}
}

// Example 4: Limit imports per file
export async function checkImportCount() {
	console.log('Checking import count constraints...');

	const violations = await metrics()
		.count()
		.imports()
		.shouldBeBelowOrEqual(20) // No file should import more than 20 modules
		.check();

	if (violations.length > 0) {
		console.log('Import count violations found:');
		violations.forEach((v) => console.log(' -', v.toString()));
	} else {
		console.log('✓ All files have acceptable import counts');
	}
}

// Example 5: Ensure minimum test coverage (classes per file)
export async function checkClassCount() {
	console.log('Checking class count constraints...');

	const violations = await metrics()
		.inFolder('src')
		.count()
		.classes()
		.shouldBeBelowOrEqual(1) // Each file should have at most 1 class
		.check();

	if (violations.length > 0) {
		console.log('Class count violations found:');
		violations.forEach((v) => console.log(' -', v.toString()));
	} else {
		console.log('✓ All files follow single-class-per-file pattern');
	}
}

// Example 6: Get comprehensive metrics summary
export async function getMetricsSummary() {
	console.log('Generating count metrics summary...');

	const summary = await metrics().count().summary();

	console.log('📊 Count Metrics Summary:');
	console.log(`Total Files: ${summary.totalFiles}`);
	console.log(`Total Classes: ${summary.totalClasses}`);
	console.log(
		`Average Methods per Class: ${summary.averageMethodsPerClass.toFixed(2)}`
	);
	console.log(`Average Fields per Class: ${summary.averageFieldsPerClass.toFixed(2)}`);
	console.log(
		`Average Lines of Code per File: ${summary.averageLinesOfCodePerFile.toFixed(2)}`
	);
	console.log(
		`Average Statements per File: ${summary.averageStatementsPerFile.toFixed(2)}`
	);
	console.log(`Average Imports per File: ${summary.averageImportsPerFile.toFixed(2)}`);
	console.log(
		`Largest File: ${summary.largestFile.path} (${summary.largestFile.lines} lines)`
	);
	console.log(
		`Largest Class: ${summary.largestClass.name} (${summary.largestClass.methods} methods)`
	);
}

// Example 7: Combined architectural checks
export async function runArchitecturalChecks() {
	console.log('Running comprehensive architectural checks...');

	try {
		await checkMethodCount();
		await checkFieldCount();
		await checkLinesOfCode();
		await checkImportCount();
		await checkClassCount();
		await getMetricsSummary();

		console.log('✅ All architectural checks completed!');
	} catch (error) {
		console.error('❌ Error during architectural checks:', error);
	}
}

// Run example if this file is executed directly
if (require.main === module) {
	runArchitecturalChecks().catch(console.error);
}
