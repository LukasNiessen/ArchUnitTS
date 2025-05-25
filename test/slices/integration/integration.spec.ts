import fs from 'fs';
import path from 'path';
import { parse } from 'plantuml-parser';
import { extractGraph } from '../../../src/common/extraction/extract-graph';
import { extractNxGraph } from '../../../src/common/extraction/extract-nx-graph';
import { Graph, ImportKind } from '../../../src/common/extraction/graph';
import { projectEdges } from '../../../src/common/projection/project-edges';
import { gatherPositiveViolations } from '../../../src/slices/assertion/admissible-edges';
import { slicesOfNxProject, slicesOfProject } from '../../../src/slices/fluentapi/slices';
import {
	sliceByFileSuffix,
	sliceByPattern,
} from '../../../src/slices/projection/slicing-projections';
import { exportDiagram } from '../../../src/slices/uml/export-diagram';

describe('Integration test', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});
	it('finds simple violations', async () => {
		const violations = await slicesOfProject(
			__dirname + '/samples/foldersample/tsconfig.json'
		)
			.definedBy('src/(**)/')
			.shouldNot()
			.containDependency('services', 'controllers')
			.check();

		expect(violations).toContainEqual({
			projectedEdge: {
				sourceLabel: 'services',
				targetLabel: 'controllers',
				cumulatedEdges: [
					{
						source: 'src/services/util/service.ts',
						target: 'src/controllers/controller.ts',
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
				isNegated: true,
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
		const violations = await slicesOfProject(
			__dirname + '/samples/foldersample/tsconfig.json'
		)
			.definedBy('src/(**)/')
			.should()
			.adhereToDiagram(diagram)
			.check();

		expect(violations).toContainEqual({
			rule: null,
			projectedEdge: {
				sourceLabel: 'services',
				targetLabel: 'controllers',
				cumulatedEdges: [
					{
						source: 'src/services/util/service.ts',
						target: 'src/controllers/controller.ts',
						external: false,
					},
				],
			},
		});
	});

	it('reads uml from file', async () => {
		const exampleLocation = path.resolve(__dirname, 'samples', 'foldersample');
		const exampleConfig = path.resolve(exampleLocation, 'tsconfig.json');
		const exampleUml = path.resolve(exampleLocation, 'architecture.puml');

		const violations = await slicesOfProject(exampleConfig)
			.definedBy('src/(**)/')
			.should()
			.adhereToDiagramInFile(exampleUml)
			.check();

		expect(violations).toContainEqual({
			rule: null,
			projectedEdge: {
				sourceLabel: 'services',
				targetLabel: 'controllers',
				cumulatedEdges: [
					{
						source: 'src/services/util/service.ts',
						target: 'src/controllers/controller.ts',
						external: false,
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

		// Test for equivalence of diagrams by comparing components and connections
		expect(areDiagramsEquivalent(parsedActual, parsedExpected)).toBe(true);
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

		// Test for equivalence of diagrams by comparing components and connections
		expect(areDiagramsEquivalent(parsedActual, parsedExpected)).toBe(true);
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
			rule: null,
			projectedEdge: {
				sourceLabel: 'is-even',
				targetLabel: 'is-odd',
				cumulatedEdges: [
					{
						source: 'is-even',
						target: 'is-odd',
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

/**
 * Compares two PlantUML diagrams for equivalence based on components and their connections
 *
 * @param actual The actual diagram parsed by PlantUML parser
 * @param expected The expected diagram parsed by PlantUML parser
 * @returns True if the diagrams are equivalent, false otherwise
 */
function areDiagramsEquivalent(actual: any, expected: any): boolean {
	// Check if the diagrams are valid
	if (!actual || !expected || !actual.elements || !expected.elements) return false;

	const actualComponents = actual.elements.filter((el: any) => el.kind === 'component');
	const expectedComponents = expected.elements.filter(
		(el: any) => el.kind === 'component'
	);

	if (actualComponents.length !== expectedComponents.length) return false;

	// Check if all components exist in both diagrams
	const actualComponentNames = new Set(actualComponents.map((c: any) => c.name));
	const expectedComponentNames = new Set(expectedComponents.map((c: any) => c.name));

	// Verify component sets are identical
	if (actualComponentNames.size !== expectedComponentNames.size) return false;
	for (const name of actualComponentNames) {
		if (!expectedComponentNames.has(name)) return false;
	}

	// Check if connections match
	const actualRelations = actual.elements.filter((el: any) => el.kind === 'relation');
	const expectedRelations = expected.elements.filter(
		(el: any) => el.kind === 'relation'
	);

	if (actualRelations.length !== expectedRelations.length) return false;

	// Create a map of relationships by source and target to compare
	const relationToString = (rel: any) =>
		`${rel.from}-${rel.to}-${rel.style || 'default'}`;

	const actualRelMap = new Set(actualRelations.map(relationToString));
	const expectedRelMap = new Set(expectedRelations.map(relationToString));

	if (actualRelMap.size !== expectedRelMap.size) return false;
	for (const rel of actualRelMap) {
		if (!expectedRelMap.has(rel)) return false;
	}

	return true;
}
