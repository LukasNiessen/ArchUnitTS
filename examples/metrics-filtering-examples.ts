import { metrics } from '../src/metrics/fluentapi/metrics';

/**
 * Examples demonstrating the filtering capabilities of the metrics system
 */

async function demonstrateFiltering() {
	console.log('=== Metrics Filtering Examples ===\n');

	try {
		// Example 1: Filter by folder - analyze only service classes
		console.log('1. Analyzing classes in services folder:');
		const serviceViolations = await metrics()
			.inFolder('src/services')
			.lcom()
			.lcom96b()
			.shouldBeAbove(0.7) // Services should be highly cohesive
			.check();

		console.log(`Found ${serviceViolations.length} violations in services\n`);

		// Example 2: Filter by class name pattern - analyze only *Builder classes
		console.log('2. Analyzing Builder classes:');
		const builderViolations = await metrics()
			.forClassesMatching(/.*Builder$/)
			.lcom()
			.lcom96b()
			.shouldBeAbove(0.5) // Builders might be less cohesive but still reasonable
			.check();

		console.log(`Found ${builderViolations.length} violations in Builder classes\n`);

		// Example 3: Filter by specific file
		console.log('3. Analyzing specific file:');
		const specificFileViolations = await metrics()
			.inFile('src/metrics/calculation/lcom.ts')
			.lcom()
			.lcom96b()
			.shouldBeAbove(0.6)
			.check();

		console.log(
			`Found ${specificFileViolations.length} violations in LCOM calculation file\n`
		);

		// Example 4: Combined filtering - services that end with specific pattern
		console.log('4. Analyzing Service classes in domain folders:');
		const domainServiceViolations = await metrics()
			.inFolder(/src\/(services|domain)/)
			.forClassesMatching(/.*Service$/)
			.lcom()
			.lcom96b()
			.shouldBeAbove(0.8) // Domain services should be very cohesive
			.check();

		console.log(
			`Found ${domainServiceViolations.length} violations in domain services\n`
		);

		// Example 5: Multiple folder filters (AND logic)
		console.log('5. Analyzing metrics calculation classes:');
		const metricsViolations = await metrics()
			.inFolder('src')
			.inFolder('metrics')
			.inFolder('calculation')
			.lcom()
			.lcom96a() // Use different LCOM variant
			.shouldBeBelowOrEqual(2.0) // Allow some complexity in calculation classes
			.check();

		console.log(
			`Found ${metricsViolations.length} violations in metrics calculation classes\n`
		);

		// Example 6: Complex filtering with relaxed constraints for test helpers
		console.log('6. Analyzing test helper classes with relaxed rules:');
		const testHelperViolations = await metrics()
			.inFolder(/test|spec/)
			.forClassesMatching(/.*Helper$|.*Util$/)
			.lcom()
			.lcom96b()
			.shouldBeAbove(0.3) // Test helpers can be less cohesive
			.check();

		console.log(`Found ${testHelperViolations.length} violations in test helpers\n`);

		console.log('=== Filtering Examples Complete ===');
	} catch (error) {
		console.error('Error running filtering examples:', error);
	}
}

// Export the function for potential reuse
export { demonstrateFiltering };

// Run if this file is executed directly
if (require.main === module) {
	demonstrateFiltering();
}
