import { projectSlices } from '../..';

const projectPath = __dirname + '/layered-arch-1/tsconfig.json';

describe('UML Layered Architecture', () => {
	it('should follow layered architecture diagram', async () => {
		const diagram = `
@startuml
package "Presentation Layer" {
  [Controllers]
}

package "Business Layer" {
  [Services]
}

package "Data Layer" {
  [Repositories]
}

[Controllers] --> [Services]
[Services] --> [Repositories]
@enduml`;

		const rule = projectSlices(projectPath)
			.definedBy('src/**/(**)')
			.should()
			.adhereToDiagram(diagram);

		await expect(rule).toPassAsync();
	});

	it('should not allow controllers to directly access repositories', async () => {
		const rule = projectSlices(projectPath)
			.definedBy('src/**/(**)')
			.shouldNot()
			.containDependency('Controllers', 'Repositories');

		await expect(rule).toPassAsync();
	});
});
