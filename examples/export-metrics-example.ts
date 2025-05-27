import { metrics } from '../src/metrics/fluentapi/metrics';
import { DistanceMetricsBuilder } from '../src/metrics/fluentapi/metrics/distance-metrics';
import path from 'path';

/**
 * Example usage of Export Functionality in ArchUnitTS
 *
 * This file demonstrates how to use the newly implemented export functionality
 * to generate HTML reports for various metrics types including:
 * - Count Metrics (lines of code, methods, fields, etc.)
 * - LCOM Metrics (class cohesion)
 * - Distance Metrics (abstractness, instability, etc.)
 *
 * NEW: All export methods now support default parameters!
 */

// Example 0: NEW - Simple Export with Default Parameters
export async function exportWithDefaults() {
	console.log('🚀 Generating Reports with Default Parameters...');

	// These will all save to the dist/ folder automatically
	await metrics().count().exportAsHTML();
	await metrics().lcom().exportAsHTML();
	await new DistanceMetricsBuilder('./tsconfig.json').exportAsHTML();

	console.log('✅ Reports saved to dist/ folder:');
	console.log('  - dist/count-metrics-report.html');
	console.log('  - dist/lcom-metrics-report.html');
	console.log('  - dist/distance-metrics-report.html');
}

// Example 0b: NEW - Comprehensive Export with All Metrics
export async function exportComprehensiveReport() {
	console.log('📊 Generating Comprehensive Metrics Report...');

	const { MetricsExporter } = await import('../src/metrics/fluentapi/export-utils');

	// This will include ALL metrics types in one report
	await MetricsExporter.exportComprehensiveAsHTML('./tsconfig.json');

	console.log('✅ Comprehensive report saved to: dist/metrics-report.html');
	console.log('   Includes: Count, LCOM, and Distance metrics all in one file!');
}

// Example 1: Export Count Metrics Report
export async function exportCountMetricsReport() {
	console.log('📊 Generating Count Metrics Reports...');

	const countMetrics = metrics().count();

	// Export as HTML
	await countMetrics.exportAsHTML('./reports/count-metrics-report.html', {
		title: 'ArchUnitTS - Count Metrics Analysis',
		includeTimestamp: true,
		customCss: `
			.highlight { background-color: #fff3cd; }
			.summary-card { border-left: 4px solid #007bff; }
		`,
	});
	console.log(
		'✅ Count metrics HTML report saved to: ./reports/count-metrics-report.html'
	);
}

// Example 2: Export LCOM Metrics Report
export async function exportLCOMMetricsReport() {
	console.log('🔗 Generating LCOM Metrics Reports...');

	const lcomMetrics = metrics().lcom();

	// Export as HTML
	await lcomMetrics.exportAsHTML('./reports/lcom-metrics-report.html', {
		title: 'ArchUnitTS - Class Cohesion Analysis',
		includeTimestamp: true,
		customCss: `
			.cohesion-high { color: #28a745; font-weight: bold; }
			.cohesion-low { color: #dc3545; font-weight: bold; }
		`,
	});
	console.log(
		'✅ LCOM metrics HTML report saved to: ./reports/lcom-metrics-report.html'
	);
}

// Example 3: Export Distance Metrics Report
export async function exportDistanceMetricsReport() {
	console.log('📏 Generating Distance Metrics Reports...');

	const distanceMetrics = new DistanceMetricsBuilder('./tsconfig.json');

	// Export as HTML
	await distanceMetrics.exportAsHTML('./reports/distance-metrics-report.html', {
		title: 'ArchUnitTS - Package Dependency Analysis',
		includeTimestamp: true,
		customCss: `
			.main-sequence { color: #17a2b8; }
			.zone-of-pain { background-color: #f8d7da; }
			.zone-of-uselessness { background-color: #d1ecf1; }
		`,
	});
	console.log(
		'✅ Distance metrics HTML report saved to: ./reports/distance-metrics-report.html'
	);
}

// Example 4: Export Combined Metrics Report
export async function exportCombinedMetricsReport() {
	console.log('📈 Generating Combined Metrics Report...');

	// Get summaries from all metrics types
	const countSummary = await metrics().count().summary();
	const lcomSummary = await metrics().lcom().summary();
	const distanceSummary = await new DistanceMetricsBuilder('./tsconfig.json').summary();

	// Create a combined summary
	const combinedSummary = {
		count: countSummary,
		lcom: lcomSummary,
		distance: distanceSummary,
	};

	// Use the MetricsExporter directly for a combined report
	const { MetricsExporter } = await import('../src/metrics/fluentapi/export-utils');

	// Export combined HTML report
	await MetricsExporter.exportAsHTML(combinedSummary, {
		outputPath: './reports/combined-metrics-report.html',
		title: 'ArchUnitTS - Complete Metrics Analysis',
		includeTimestamp: true,
		customCss: `
			.metric-section { margin-bottom: 2rem; border: 1px solid #dee2e6; padding: 1rem; }
			.metric-type-header { background-color: #f8f9fa; padding: 0.5rem; margin-bottom: 1rem; }
			.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
		`,
	});
	console.log(
		'✅ Combined metrics HTML report saved to: ./reports/combined-metrics-report.html'
	);
}

// Example 5: Custom Report with Specific Options
export async function exportCustomReport() {
	console.log('🎨 Generating Custom Styled Report...');

	const countMetrics = metrics().count();

	// Export with extensive customization
	await countMetrics.exportAsHTML('./reports/custom-metrics-report.html', {
		title: 'ArchUnitTS - Custom Metrics Dashboard',
		includeTimestamp: true,
		customCss: `
			body { 
				font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				margin: 0;
				padding: 20px;
			}
			.container { 
				background: white; 
				border-radius: 10px; 
				box-shadow: 0 10px 30px rgba(0,0,0,0.1);
				padding: 2rem;
				max-width: 1200px;
				margin: 0 auto;
			}
			.header { 
				text-align: center; 
				color: #333; 
				margin-bottom: 2rem;
				border-bottom: 3px solid #667eea;
				padding-bottom: 1rem;
			}
			.metric-card { 
				background: #f8f9fa; 
				border-left: 4px solid #28a745; 
				padding: 1rem; 
				margin: 1rem 0; 
				border-radius: 5px;
				transition: transform 0.2s;
			}
			.metric-card:hover { 
				transform: translateY(-2px); 
				box-shadow: 0 5px 15px rgba(0,0,0,0.1);
			}
			.metric-value { 
				font-size: 2rem; 
				font-weight: bold; 
				color: #007bff; 
			}
			.metric-label { 
				color: #6c757d; 
				text-transform: uppercase; 
				font-size: 0.8rem; 
				letter-spacing: 1px;
			}
		`,
	});
	console.log('✅ Custom styled report saved to: ./reports/custom-metrics-report.html');
}

// Example 6: Export with Error Handling and Logging
export async function exportWithErrorHandling() {
	console.log('🛡️  Generating Reports with Error Handling...');

	const reportsDir = path.join(process.cwd(), 'reports');

	try {
		// Ensure reports directory exists
		const fs = await import('fs');
		if (!fs.existsSync(reportsDir)) {
			fs.mkdirSync(reportsDir, { recursive: true });
			console.log('📁 Created reports directory');
		}

		// Export each type with error handling
		try {
			await exportCountMetricsReport();
		} catch (error) {
			console.error(
				'❌ Failed to export count metrics:',
				error instanceof Error ? error.message : String(error)
			);
		}

		try {
			await exportLCOMMetricsReport();
		} catch (error) {
			console.error(
				'❌ Failed to export LCOM metrics:',
				error instanceof Error ? error.message : String(error)
			);
		}

		try {
			await exportDistanceMetricsReport();
		} catch (error) {
			console.error(
				'❌ Failed to export distance metrics:',
				error instanceof Error ? error.message : String(error)
			);
		}

		try {
			await exportCombinedMetricsReport();
		} catch (error) {
			console.error(
				'❌ Failed to export combined metrics:',
				error instanceof Error ? error.message : String(error)
			);
		}
	} catch (error) {
		console.error(
			'❌ Setup error:',
			error instanceof Error ? error.message : String(error)
		);
	}
}

// Example 7: Batch Export All Reports
export async function generateAllReports() {
	console.log('🚀 Starting Comprehensive Metrics Export...');
	console.log('================================================');

	const startTime = Date.now();

	try {
		await exportCountMetricsReport();
		console.log('');

		await exportLCOMMetricsReport();
		console.log('');

		await exportDistanceMetricsReport();
		console.log('');

		await exportCombinedMetricsReport();
		console.log('');

		await exportCustomReport();
		console.log('');

		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		console.log('================================================');
		console.log(`✅ All reports generated successfully in ${duration}s!`);
		console.log('📋 Generated reports:');
		console.log('   - ./reports/count-metrics-report.html');
		console.log('   - ./reports/lcom-metrics-report.html');
		console.log('   - ./reports/distance-metrics-report.html');
		console.log('   - ./reports/combined-metrics-report.html');
		console.log('   - ./reports/custom-metrics-report.html');
	} catch (error) {
		console.error(
			'❌ Error during report generation:',
			error instanceof Error ? error.message : String(error)
		);
	}
}

// Usage Examples and Documentation
export function printUsageExamples() {
	console.log(`
📖 ArchUnitTS Export Functionality Usage Examples:

NEW: DEFAULT PARAMETER SUPPORT!
✨ All export methods now work without specifying an output path:

0. Simple exports with defaults (saves to dist/ folder):
   await metrics().count().exportAsHTML();
   await metrics().lcom().exportAsHTML();
   await new DistanceMetricsBuilder('./tsconfig.json').exportAsHTML();

0b. Comprehensive export (all metrics in one file):
   const { MetricsExporter } = await import('../src/metrics/common/export-utils');
   await MetricsExporter.exportComprehensiveAsHTML('./tsconfig.json');

1. Basic Count Metrics Export:
   const countMetrics = metrics().count();
   await countMetrics.exportAsHTML('./count-report.html');

2. LCOM Metrics Export:
   const lcomMetrics = metrics().lcom();
   await lcomMetrics.exportAsHTML('./lcom-report.html');

3. Distance Metrics Export:
   const distanceMetrics = new DistanceMetricsBuilder('./tsconfig.json');
   await distanceMetrics.exportAsHTML('./distance-report.html');

4. Custom Styling:
   await countMetrics.exportAsHTML('./report.html', {
     title: 'My Custom Report',
     customCss: 'body { background: #f0f0f0; }'
   });

5. Combined Reports:
   const { MetricsExporter } = await import('../src/metrics/common/export-utils');
   const combinedData = { count: summary1, lcom: summary2 };
   await MetricsExporter.exportAsHTML(combinedData, options);
`);
}

// NEW: Main function that demonstrates all capabilities including defaults
export async function main() {
	console.log('🚀 ArchUnitTS Export Examples - Enhanced with Default Parameters!');
	console.log('================================================');

	const startTime = Date.now();

	try {
		// NEW: Show default parameter usage first
		await exportWithDefaults();
		console.log('');

		await exportComprehensiveReport();
		console.log('');

		await exportCountMetricsReport();
		console.log('');

		await exportLCOMMetricsReport();
		console.log('');

		await exportDistanceMetricsReport();
		console.log('');

		await exportCombinedMetricsReport();
		console.log('');

		await exportCustomReport();
		console.log('');

		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);
		console.log('================================================');
		console.log(`✅ All reports generated successfully in ${duration}s!`);
		console.log('📋 Generated reports:');
		console.log('   DEFAULT EXPORTS (dist/ folder):');
		console.log('   - dist/count-metrics-report.html');
		console.log('   - dist/lcom-metrics-report.html');
		console.log('   - dist/distance-metrics-report.html');
		console.log('   - dist/metrics-report.html (comprehensive)');
		console.log('   CUSTOM EXPORTS (reports/ folder):');
		console.log('   - ./reports/count-metrics-report.html');
		console.log('   - ./reports/lcom-metrics-report.html');
		console.log('   - ./reports/distance-metrics-report.html');
		console.log('   - ./reports/combined-metrics-report.html');
		console.log('   - ./reports/custom-metrics-report.html');
	} catch (error) {
		console.error(
			'❌ Error during report generation:',
			error instanceof Error ? error.message : String(error)
		);
	}
}

// Run example if this file is executed directly
if (require.main === module) {
	// Show usage examples first
	printUsageExamples();

	// Then generate all reports
	main().catch(console.error);
}
