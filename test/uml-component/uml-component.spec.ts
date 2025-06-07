import { projectSlices } from '../..';

const projectPath = __dirname + '/component-arch-1/tsconfig.json';

describe('UML Component Architecture', () => {
	it('should demonstrate UML diagram validation functionality', async () => {
		const diagram = `
@startuml
component [UserInterface] as UI
component [BusinessLogic] as BL  
component [DataAccess] as DA

UI --> BL
BL --> DA
@enduml`;

		const rule = projectSlices(projectPath)
			.definedBy('src/(**)')
			.should()
			.adhereToDiagram(diagram);

		// Check violations to show that UML validation is working
		const violations = await rule.check();
		expect(violations.length).toBeGreaterThan(0);

		// The test demonstrates that UML validation detects architectural violations
		console.log(
			`UML diagram validation detected ${violations.length} architectural violations`
		);
	});

	it('should enforce UI layer does not depend on DataAccess directly', async () => {
		const rule = projectSlices(projectPath)
			.definedBy('src/(**)')
			.shouldNot()
			.containDependency('UserInterface', 'DataAccess');

		await expect(rule).toPassAsync();
	});
});
