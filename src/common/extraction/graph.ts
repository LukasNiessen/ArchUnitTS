import { ImportKind } from '../util/import-kinds';

export type Edge = {
	source: string;
	target: string;
	external: boolean;
	importKinds: ImportKind[];
};

export type Graph = Edge[];
