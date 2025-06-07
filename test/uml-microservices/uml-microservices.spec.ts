import { projectSlices } from '../..';

const projectPath = __dirname + '/microservices-1/tsconfig.json';

describe('UML Microservices Architecture', () => {
	it('should detect violations when UserService depends on OrderService', async () => {
		// This diagram doesn't allow UserService to depend on OrderService
		const diagram = `
@startuml
component [UserService] as US
component [OrderService] as OS
component [PaymentService] as PS

OS --> PS : processPayment()
@enduml`;

		const rule = projectSlices(projectPath)
			.definedBy('services/(**)')
			.should()
			.adhereToDiagram(diagram);

		// This should detect a violation because UserService depends on OrderService but it's not allowed in the diagram
		try {
			await expect(rule).toPassAsync();
			fail('Expected rule to fail but it passed');
		} catch (error) {
			// Expected to fail - this shows the UML validation is working
			expect(String(error)).toContain('Architecture rule failed');
			console.log(
				'UML microservices validation correctly detected 1 architectural violation'
			);
		}
	});

	it('should not allow UserService to directly depend on PaymentService', async () => {
		const rule = projectSlices(projectPath)
			.definedBy('services/(**)')
			.shouldNot()
			.containDependency('UserService', 'PaymentService');

		await expect(rule).toPassAsync();
	});
});
