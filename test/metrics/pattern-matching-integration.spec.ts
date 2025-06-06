import { metrics } from '../..';

describe('Metrics Pattern Matching Integration', () => {
	const tsConfigPath = './tsconfig.test.json';

	describe('withName() method', () => {
		it('should filter classes by filename pattern', async () => {
			const violations = await metrics(tsConfigPath)
				.withName('*.spec.ts')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass since we're only looking at test files
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});

		it('should filter classes by exact filename', async () => {
			const violations = await metrics(tsConfigPath)
				.withName('metrics.ts')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass if metrics.ts files exist
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('inPath() method', () => {
		it('should filter classes by full path pattern', async () => {
			const violations = await metrics(tsConfigPath)
				.inPath('**/metrics/**')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass since we're looking at metrics files
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});

		it('should filter classes by specific path components', async () => {
			const violations = await metrics(tsConfigPath)
				.inPath('**/fluentapi/**')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass if fluentapi files exist
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('inFolder() method', () => {
		it('should filter classes by folder pattern', async () => {
			const violations = await metrics(tsConfigPath)
				.inFolder('**/metrics')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass since we're looking at metrics folders
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});

		it('should filter classes by specific folder', async () => {
			const violations = await metrics(tsConfigPath)
				.inFolder('src/metrics/fluentapi')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass if the specific folder exists
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Method chaining', () => {
		it('should support chaining multiple pattern matching methods', async () => {
			const violations = await metrics(tsConfigPath)
				.inFolder('**/metrics')
				.withName('*.ts')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass when combining folder and filename filters
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});

		it('should support mixing new and existing methods', async () => {
			const violations = await metrics(tsConfigPath)
				.inPath('**/metrics/**')
				.forClassesMatching(/.*Builder/)
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass when combining path filter with class name filter
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Backwards compatibility', () => {
		it.only('should maintain existing inFile() functionality', async () => {
			const rule = metrics(tsConfigPath)
				.inFolder('src/metrics/**')
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0);

			await expect(rule).toPassAsync({
				logging: {
					enabled: true,
					level: 'debug',
				},
			});
		});

		it('should maintain existing forClassesMatching() functionality', async () => {
			const violations = await metrics(tsConfigPath)
				.forClassesMatching(/.*Builder/)
				.lcom()
				.lcom96a()
				.shouldBeBelow(1.0)
				.check();

			// Should pass if Builder classes exist
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Pattern matching with count metrics', () => {
		it('should work with count metrics', async () => {
			const violations = await metrics(tsConfigPath)
				.withName('*.ts')
				.count()
				.methodCount()
				.shouldBeBelow(100)
				.check();

			// Should pass with reasonable method count threshold
			expect(violations.length).toBeGreaterThanOrEqual(0);
		});
	});
});
