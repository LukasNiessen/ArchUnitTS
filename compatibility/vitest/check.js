const { execFileSync } = require('child_process');
const {
	copyFileSync,
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');

const version = process.argv[2] || '5.0.5';
const root = resolve(__dirname, '../..');
const consumer = mkdtempSync(join(tmpdir(), 'archunit-vitest-'));

function npm(args, cwd, capture = false) {
	return execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
		cwd,
		encoding: 'utf8',
		stdio: capture ? 'pipe' : 'inherit',
	});
}

function checkTypes(files, resolution = 'nodenext', types = 'node') {
	execFileSync(
		process.execPath,
		[
			join(consumer, 'node_modules/typescript/bin/tsc'),
			'--noEmit',
			'--strict',
			'--skipLibCheck',
			'false',
			'--target',
			'es2020',
			'--esModuleInterop',
			'--module',
			resolution === 'bundler' ? 'esnext' : 'nodenext',
			'--moduleResolution',
			resolution,
			'--types',
			types,
			...files,
		],
		{ cwd: consumer, stdio: 'inherit' }
	);
}

function setModuleType(type) {
	const path = join(consumer, 'package.json');
	const manifest = existsSync(path)
		? JSON.parse(readFileSync(path, 'utf8'))
		: { private: true };
	manifest.type = type;
	writeFileSync(path, JSON.stringify(manifest, null, 2));
}

try {
	setModuleType('commonjs');
	const [packed] = JSON.parse(
		npm(
			['pack', '--ignore-scripts', '--json', '--pack-destination', consumer],
			root,
			true
		)
	);
	const dependencies = [
		join(consumer, packed.filename),
		'typescript@5.9.3',
		'@types/node@25.5.0',
		'@types/jest@29.5.14',
	];
	if (version !== 'none') dependencies.push(`vitest@${version}`);
	npm(
		[
			'install',
			'--save-dev',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			'--registry=https://registry.npmjs.org',
			...dependencies,
		],
		consumer
	);

	copyFileSync(
		join(__dirname, 'plain-consumer.ts'),
		join(consumer, 'plain-consumer.ts')
	);
	for (const type of ['commonjs', 'module']) {
		setModuleType(type);
		checkTypes(['plain-consumer.ts'], 'nodenext', 'node,jest');
	}

	if (version === 'none') {
		if (existsSync(join(consumer, 'node_modules/vitest'))) {
			throw new Error('Installing archunit must not install Vitest.');
		}
	} else {
		copyFileSync(
			join(__dirname, 'matcher.test.ts'),
			join(consumer, 'matcher.test.ts')
		);
		for (const type of ['commonjs', 'module']) {
			setModuleType(type);
			// Separate programs prevent CommonJS from masking an ESM augmentation failure.
			checkTypes(['matcher.test.ts']);
		}
		checkTypes(['matcher.test.ts'], 'bundler');
		execFileSync(
			process.execPath,
			[
				join(consumer, 'node_modules/vitest/vitest.mjs'),
				'run',
				'matcher.test.ts',
				'--globals',
			],
			{ cwd: consumer, stdio: 'inherit' }
		);
	}
	console.log(`Published package compatibility passed: Vitest ${version}.`);
} finally {
	rmSync(consumer, { recursive: true, force: true });
}
