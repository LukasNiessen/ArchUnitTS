import fs from 'fs';
import path from 'path';
import { parse } from 'plantuml-parser';
import { extractGraph, extractNxGraph, Graph, projectEdges } from '../../../src/common';
import {
	gatherPositiveViolations,
	slicesOfNxProject,
	projectSlices,
	sliceByFileSuffix,
	sliceByPattern,
	exportDiagram,
} from '../../../src/slices';

describe('Integration test', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});
	it('finds simple violations', async () => {
		const violations = await projectSlices(
			__dirname + '/samples/foldersample/tsconfig.json'
		)
			.definedBy('src/(**)/')
			.shouldNot()
			.containDependency('services', 'controllers')
			.check();

		expect(violations).toHaveLength(1);
		expect(violations[0]).toMatchObject({
			projectedEdge: {
				sourceLabel: 'services',
				targetLabel: 'controllers',
				cumulatedEdges: [
					{
						source: 'src/services/util/Service.ts',
						target: 'src/controllers/Controller.ts',
						external: false,
						importKinds: expect.any(Array),
					},
				],
			},
			rule: { source: 'services', target: 'controllers' },
			isNegated: false,
		});
	});

	it('reports inner dependencies', async () => {
		const graph = await extractGraph(
			__dirname + '/samples/innerdependencies/tsconfig.json'
		);

		const mapFunction = sliceByPattern('src/facades/(**)/');

		const sliced = projectEdges(graph, mapFunction);

		expect(gatherPositiveViolations(sliced, [], ['another', 'one'], false)).toEqual([
			{
				projectedEdge: {
					cumulatedEdges: [
						{
							external: false,
							importKinds: expect.any(Array),
							source: 'src/facades/another/another-facade.ts',
							target: 'src/facades/one/one-facade.ts',
						},
					],
					sourceLabel: 'another',
					targetLabel: 'one',
				},
				rule: null,
				isNegated: false,
			},
		]);
	});

	it('finds not adherent parts', async () => {
		const diagram = `
@startuml
  component [controllers]
  component [services]
  [controllers] --> [services]
@enduml
        `;
		const violations = await projectSlices(
			__dirname + '/samples/foldersample/tsconfig.json'
		)
			.definedBy('src/(**)/')
			.should()
			.adhereToDiagram(diagram)
			.check();

		expect(violations).toHaveLength(1);
		expect(violations[0]).toMatchObject({
			rule: null,
			isNegated: false,
			projectedEdge: {
				sourceLabel: 'services',
				targetLabel: 'controllers',
				cumulatedEdges: [
					{
						source: 'src/services/util/Service.ts',
						target: 'src/controllers/Controller.ts',
						external: false,
						importKinds: [],
					},
				],
			},
		});
	});

	it('reads uml from file', async () => {
		const exampleLocation = path.resolve(__dirname, 'samples', 'foldersample');
		const exampleConfig = path.resolve(exampleLocation, 'tsconfig.json');
		const exampleUml = path.resolve(exampleLocation, 'architecture.puml');

		const violations = await projectSlices(exampleConfig)
			.definedBy('src/(**)/')
			.should()
			.adhereToDiagramInFile(exampleUml)
			.check();

		expect(violations).toHaveLength(1);
		expect(violations[0]).toMatchObject({
			rule: null,
			isNegated: false,
			projectedEdge: {
				sourceLabel: 'services',
				targetLabel: 'controllers',
				cumulatedEdges: [
					{
						source: 'src/services/util/Service.ts',
						target: 'src/controllers/Controller.ts',
						external: false,
						importKinds: [],
					},
				],
			},
		});
	});

	it('exports the architecture by suffixes', async () => {
		const graph = await extractGraph(
			__dirname + '/samples/suffixsample/tsconfig.json'
		);

		const mapFunction = sliceByFileSuffix(
			new Map([
				['controller', 'controllers'],
				['service', 'services'],
			])
		);

		const reducedGraph = projectEdges(graph, mapFunction);

		const stringDiagram = exportDiagram(reducedGraph);
		const parsedActual = parse(stringDiagram);

		const expectedDiagram = `
@startuml
  component [controllers]
  component [services]
  [controllers] --> [services]
@enduml
            `;

		const parsedExpected = parse(expectedDiagram);
		expect(parsedActual).toEqual(parsedExpected);
	});

	it('exports the architecture by folders', async () => {
		const graph = await extractGraph(
			__dirname + '/samples/foldersample/tsconfig.json'
		);
		const mapFunction = sliceByPattern('src/(**)/');

		const reducedGraph = projectEdges(graph, mapFunction);

		const stringDiagram = exportDiagram(reducedGraph);
		const parsedActual = parse(stringDiagram);

		const expectedDiagram = `
@startuml
  component [services]
  component [controllers]
  [services] --> [controllers]
  [controllers] --> [services]
@enduml
            `;

		const parsedExpected = parse(expectedDiagram);
		expect(parsedActual).toEqual(parsedExpected);
	});

	it('finds not adherent parts in nx projects', async () => {
		jest.spyOn(fs, 'readFileSync').mockReturnValue(
			getExampleNxProjectGraphJsonFileContent()
		);

		const diagram = `
@startuml
  component [is-even]
  component [is-odd]
@enduml
        `;
		const violations = await slicesOfNxProject(__dirname)
			.should()
			.ignoringExternalDependencies()
			.adhereToDiagram(diagram)
			.check();

		expect(violations).toContainEqual({
			isNegated: false,
			rule: null,
			projectedEdge: {
				sourceLabel: 'is-even',
				targetLabel: 'is-odd',
				cumulatedEdges: [
					{
						source: 'is-even',
						target: 'is-odd',
						importKinds: [],
						external: false,
					},
				],
			},
		});
	});

	it('ignores parts not listed in architecture diagram', async () => {
		jest.spyOn(fs, 'readFileSync').mockReturnValue(
			getExampleNxProjectGraphJsonFileContent()
		);

		const diagram = `
@startuml
  component [is-even]
@enduml
        `;
		const violations = await slicesOfNxProject(__dirname)
			.should()
			.ignoringUnknownNodes()
			.ignoringExternalDependencies()
			.adhereToDiagram(diagram)
			.check();

		expect(violations).toEqual([]);
	});

	it('when project graph cache is located in .nx/workspace-data directory then extracts nx graph', () => {
		const projectGraphFilePath = path.join(
			__dirname,
			'.nx',
			'workspace-data',
			'project-graph.json'
		);

		jest.spyOn(fs, 'existsSync').mockImplementation(
			(filePath) => filePath === projectGraphFilePath
		);
		jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
			if (filePath === projectGraphFilePath) {
				return getExampleNxProjectGraphJsonFileContent();
			}
			throw new Error(`Project graph not located in ${projectGraphFilePath}`);
		});

		expect(extractNxGraph(__dirname)).toEqual(getExampleProjectGraph());
	});

	it('when project graph cache is located in .nx/cache directory then extracts nx graph', () => {
		const projectGraphFilePath = path.join(
			__dirname,
			'.nx',
			'cache',
			'project-graph.json'
		);

		jest.spyOn(fs, 'existsSync').mockImplementation(
			(filePath) => filePath === projectGraphFilePath
		);
		jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
			if (filePath === projectGraphFilePath) {
				return getExampleNxProjectGraphJsonFileContent();
			}
			throw new Error(`Project graph not located in ${projectGraphFilePath}`);
		});

		expect(extractNxGraph(__dirname)).toEqual(getExampleProjectGraph());
	});

	it('when project graph cache is located in neither .nx/workspace-data nor .nx/cache directory then throw file not found error', () => {
		jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
			throw new Error('Project graph not found');
		});

		expect(() => extractNxGraph(__dirname)).toThrow();
	});
});

const getExampleNxProjectGraphJsonFileContent = (): Buffer => {
	const exampleProjectGraph = JSON.stringify({
		nodes: {},
		externalNodes: {},
		dependencies: {
			'is-super-odd': [
				{
					source: 'is-super-odd',
					target: 'npm:tslib',
					type: 'static',
				},
			],
			'is-even': [
				{
					source: 'is-even',
					target: 'npm:tslib',
					type: 'static',
				},
				{
					source: 'is-even',
					target: 'is-odd',
					type: 'static',
				},
			],
			'is-odd': [
				{
					source: 'is-odd',
					target: 'npm:tslib',
					type: 'static',
				},
			],
		},
	});
	return Buffer.from(exampleProjectGraph);
};

const getExampleProjectGraph = (): Graph => [
	{
		source: 'is-super-odd',
		target: 'npm:tslib',
		external: true,
		importKinds: [],
	},
	{
		source: 'is-even',
		target: 'npm:tslib',
		external: true,
		importKinds: [],
	},
	{
		source: 'is-even',
		target: 'is-odd',
		external: false,
		importKinds: [],
	},
	{
		source: 'is-odd',
		target: 'npm:tslib',
		external: true,
		importKinds: [],
	},
];
