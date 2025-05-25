export enum ImportKind {
	DEFAULT = 'default',
	NAMED = 'named',
	NAMESPACE = 'namespace',
	TYPE = 'type',
	VALUE = 'value',
}

export type Edge = {
	source: string;
	target: string;
	external: boolean;
	importKinds: ImportKind[];
};

export type Graph = Edge[];
