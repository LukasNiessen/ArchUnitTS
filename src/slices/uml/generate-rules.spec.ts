import { generateRule } from './generate-rules';

describe('generateRules', () => {
	it('generates positves rules', () => {
		const data = `
@startuml
 component [controllers]
 component [services]
 [controllers] --> [services]
@enduml
    `;
		const rules = generateRule(data);

		expect(rules).toEqual({
			rules: [{ source: 'controllers', target: 'services' }],
			containedNodes: ['controllers', 'services'],
		});
	});

	it('generates more complex rules', () => {
		const data = `
@startuml
 component [controllers]
 component [services]
 component [facades]
 [controllers] --> [services]
 [services] --> [facades]
@enduml
    `;
		const rules = generateRule(data);

		expect(rules.rules).toContainEqual({ source: 'controllers', target: 'services' });
		expect(rules.rules).toContainEqual({ source: 'services', target: 'facades' });
	});

	it('supports aliases, relationship labels and component colors', () => {
		const data = `
@startuml
component [User Interface] as UI #LightBlue
component "Business Logic" as BL
UI --> BL : calls
@enduml`;

		expect(generateRule(data)).toEqual({
			rules: [{ source: 'UI', target: 'BL' }],
			containedNodes: ['UI', 'BL'],
		});
	});

	it('supports package shorthand and different PlantUML arrows', () => {
		const data = `
@startuml
package "Application" {
  [controllers]
  [services]
  [repositories]
}
[controllers] ..> [services]
[services] --|> [repositories]
@enduml`;

		expect(generateRule(data)).toEqual({
			rules: [
				{ source: 'controllers', target: 'services' },
				{ source: 'services', target: 'repositories' },
			],
			containedNodes: ['controllers', 'services', 'repositories'],
		});
	});

	it('supports component-like shapes and C4 macros', () => {
		const data = `
@startuml
hexagon "Application Core" as Core {
  Component(domain, "Domain")
}
System_Ext(identity, "Identity Provider")
Rel_D(domain, identity, "authenticates")
ComponentQueue_Ext(events, "External Events")
Rel_Back_Neighbor(events, domain, "delivers")
Core --> domain
@enduml`;

		expect(generateRule(data)).toEqual({
			rules: [
				{ source: 'domain', target: 'identity' },
				{ source: 'events', target: 'domain' },
				{ source: 'Core', target: 'domain' },
			],
			containedNodes: ['Core', 'domain', 'identity', 'events'],
		});
	});

	it('ignores comments and diagrams after the first diagram', () => {
		const data = `
@startuml
component [one]
component [two]
' one --> two
/'
one --> two
'/
@enduml
@startuml
component [ignored]
@enduml`;

		expect(generateRule(data)).toEqual({
			rules: [],
			containedNodes: ['one', 'two'],
		});
	});
});
