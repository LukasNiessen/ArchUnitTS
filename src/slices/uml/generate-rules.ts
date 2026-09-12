import { Rule } from '../assertion/admissible-edges';

const RELATIONSHIP =
	/^\s*(\[[^\]]+\]|"[^"]+"|[\w.$:-]+)\s+(\S*(?:--|\.\.|->|<-)\S*)\s+(\[[^\]]+\]|"[^"]+"|[\w.$:-]+)(?:\s*:\s*.*)?\s*$/;
const BRACKET_COMPONENT =
	/^\s*(?:component\s+)?\[([^\]]+)](?:\s+as\s+([\w.$:-]+))?(?:\s+#[\w-]+)?\s*\{?\s*$/i;
const NAMED_COMPONENT =
	/^\s*(?:component|rectangle|node|database|cloud|folder|frame|hexagon)\s+(?:"([^"]+)"|([\w.$:-]+))(?:\s+as\s+([\w.$:-]+))?(?:\s+#[\w-]+)?\s*\{?\s*$/i;
const C4_COMPONENT =
	/^\s*(?:Person|System|Container|Component|Boundary|Enterprise_Boundary|Deployment_Node)[A-Za-z_]*\s*\(\s*([^,]+)\s*,/i;
const C4_RELATIONSHIP = /^\s*Rel(?:_[A-Za-z]+)*\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*(?:,|\))/i;

export function generateRule(data: string): { rules: Rule[]; containedNodes: string[] } {
	const rules: Rule[] = [];
	const containedNodes: string[] = [];
	const seenNodes = new Set<string>();
	const diagram = firstDiagram(removeBlockComments(data));

	for (const originalLine of diagram.split(/\r?\n/)) {
		const line = originalLine.trim();
		if (!line || line.startsWith("'") || line.startsWith('@')) {
			continue;
		}

		const c4Relationship = line.match(C4_RELATIONSHIP);
		if (c4Relationship) {
			rules.push({
				source: normalizeIdentifier(c4Relationship[1]),
				target: normalizeIdentifier(c4Relationship[2]),
			});
			continue;
		}

		const relationship = line.match(RELATIONSHIP);
		if (relationship) {
			rules.push({
				source: normalizeIdentifier(relationship[1]),
				target: normalizeIdentifier(relationship[3]),
			});
			continue;
		}

		const component = componentName(line);
		if (component && !seenNodes.has(component)) {
			seenNodes.add(component);
			containedNodes.push(component);
		}
	}

	return { rules, containedNodes };
}

const componentName = (line: string): string | undefined => {
	const bracketComponent = line.match(BRACKET_COMPONENT);
	if (bracketComponent) {
		return normalizeIdentifier(bracketComponent[2] ?? bracketComponent[1]);
	}

	const namedComponent = line.match(NAMED_COMPONENT);
	if (namedComponent) {
		return normalizeIdentifier(
			namedComponent[3] ?? namedComponent[1] ?? namedComponent[2]
		);
	}

	const c4Component = line.match(C4_COMPONENT);
	return c4Component ? normalizeIdentifier(c4Component[1]) : undefined;
};

const normalizeIdentifier = (value: string): string => {
	const normalized = value.trim();
	if (
		(normalized.startsWith('[') && normalized.endsWith(']')) ||
		(normalized.startsWith('"') && normalized.endsWith('"'))
	) {
		return normalized.slice(1, -1).trim();
	}
	return normalized;
};

const removeBlockComments = (data: string): string => data.replace(/\/'[\s\S]*?'\//g, '');

const firstDiagram = (data: string): string => {
	const diagram = data.match(/@startuml\b[\s\S]*?@enduml\b/i);
	return diagram?.[0] ?? data;
};
