import path from 'path';
import { extractClassInfo } from './extract-class-info';
import { ClassInfo } from './interface';

describe('extractClassInfo', () => {
	const mockProjectTsConfig = path.resolve(
		__dirname,
		'..',
		'..',
		'..',
		'test',
		'metrics',
		'mock-project',
		'tsconfig.json'
	);

	let classes: ClassInfo[];

	beforeAll(() => {
		classes = extractClassInfo(mockProjectTsConfig);
	});

	it('should extract classes from the mock project', () => {
		expect(classes.length).toBeGreaterThan(0);
	});

	it('should find the DataClass with its fields', () => {
		const dataClass = classes.find((c) => c.name === 'DataClass');
		expect(dataClass).toBeDefined();

		// DataClass has 3 fields: id, name, value
		expect(dataClass!.fields).toHaveLength(3);
		const fieldNames = dataClass!.fields.map((f) => f.name).sort();
		expect(fieldNames).toEqual(['id', 'name', 'value']);

		// DataClass has no methods
		expect(dataClass!.methods).toHaveLength(0);
	});

	it('should find ConcreteService with its methods and fields', () => {
		const concreteService = classes.find((c) => c.name === 'ConcreteService');
		expect(concreteService).toBeDefined();

		// ConcreteService has 1 field: data
		expect(concreteService!.fields).toHaveLength(1);
		expect(concreteService!.fields[0].name).toBe('data');

		// ConcreteService has 3 methods: doSomething, getData, processData
		expect(concreteService!.methods).toHaveLength(3);
		const methodNames = concreteService!.methods.map((m) => m.name).sort();
		expect(methodNames).toEqual(['doSomething', 'getData', 'processData']);
	});

	it('should find AbstractBase with its methods', () => {
		const abstractBase = classes.find((c) => c.name === 'AbstractBase');
		expect(abstractBase).toBeDefined();

		// AbstractBase has 2 methods: doSomething (abstract) and execute
		expect(abstractBase!.methods).toHaveLength(2);
		const methodNames = abstractBase!.methods.map((m) => m.name).sort();
		expect(methodNames).toEqual(['doSomething', 'execute']);

		// AbstractBase has no fields
		expect(abstractBase!.fields).toHaveLength(0);
	});

	it('should find Utils with static methods', () => {
		const utils = classes.find((c) => c.name === 'Utils');
		expect(utils).toBeDefined();

		// Utils has 2 static methods: formatData, parseData
		expect(utils!.methods).toHaveLength(2);
		const methodNames = utils!.methods.map((m) => m.name).sort();
		expect(methodNames).toEqual(['formatData', 'parseData']);
	});

	it('should detect field access patterns in methods', () => {
		const concreteService = classes.find((c) => c.name === 'ConcreteService');
		expect(concreteService).toBeDefined();

		// processData accesses 'data' field
		const processData = concreteService!.methods.find(
			(m) => m.name === 'processData'
		);
		expect(processData).toBeDefined();
		expect(processData!.accessedFields).toContain('data');

		// getData accesses 'data' field
		const getData = concreteService!.methods.find((m) => m.name === 'getData');
		expect(getData).toBeDefined();
		expect(getData!.accessedFields).toContain('data');
	});

	it('should include file paths for all classes', () => {
		classes.forEach((classInfo) => {
			expect(classInfo.filePath).toBeTruthy();
			expect(classInfo.filePath).toContain('.ts');
		});
	});

	it('should throw for non-existent tsconfig', () => {
		expect(() =>
			extractClassInfo('/non/existent/tsconfig.json')
		).toThrow();
	});
});
