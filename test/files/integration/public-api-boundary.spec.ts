import path from 'path';
import { projectFiles } from '../../../src/files';
import { ViolatingFileDependency } from '../../../src/files/assertion';

describe('public API boundary integration', () => {
	const tsConfig = path.resolve(
		__dirname,
		'samples',
		'angularpublicapi',
		'tsconfig.json'
	);

	it('allows Angular feature modules to be consumed through public barrels only', async () => {
		const violations = await projectFiles(tsConfig)
			.inPath('src/app/**/*.ts', {
				except: { inPath: 'src/app/orders/**' },
			})
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/app/orders/**', {
				except: ['index.ts', 'public-api.ts'],
			})
			.check();

		expect(dependencyPairs(violations)).toEqual([
			[
				'src/app/customers/customer.component.ts',
				'src/app/orders/internal/order.service.ts',
			],
			[
				'src/app/invoices/invoice.component.ts',
				'src/app/orders/components/order-card.component.ts',
			],
		]);
	});

	it('supports explicit file-name exceptions for public API barrels', async () => {
		const violations = await projectFiles(tsConfig)
			.inPath('src/app/**/*.ts', {
				except: { inPath: 'src/app/orders/**' },
			})
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/app/orders/**', {
				except: { withName: ['index.ts', 'public-api.ts'] },
			})
			.check();

		expect(dependencyPairs(violations)).toEqual([
			[
				'src/app/customers/customer.component.ts',
				'src/app/orders/internal/order.service.ts',
			],
			[
				'src/app/invoices/invoice.component.ts',
				'src/app/orders/components/order-card.component.ts',
			],
		]);
	});

	it('would flag barrel imports when no exception is configured', async () => {
		const violations = await projectFiles(tsConfig)
			.inPath('src/app/dashboard/**')
			.shouldNot()
			.dependOnFiles()
			.inFolder('src/app/orders/**')
			.check();

		expect(dependencyPairs(violations)).toEqual([
			['src/app/dashboard/dashboard.component.ts', 'src/app/orders/index.ts'],
			['src/app/dashboard/dashboard.component.ts', 'src/app/orders/public-api.ts'],
		]);
	});

	function dependencyPairs(violations: unknown[]): string[][] {
		return (violations as ViolatingFileDependency[])
			.map((violation) => [
				violation.dependency.sourceLabel,
				violation.dependency.targetLabel,
			])
			.sort(([sourceA, targetA], [sourceB, targetB]) =>
				`${sourceA}->${targetA}`.localeCompare(`${sourceB}->${targetB}`)
			);
	}
});
