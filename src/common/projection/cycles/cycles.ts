import { NumberEdge } from './model';
import { TrajanSCC } from './trajan-scc';
import { JohnsonsAPSP } from './johnsons-apsp';

export function calculateCycles(idEdges: NumberEdge[]) {
	const cycles: Array<NumberEdge[]> = [];
	const tarjan = new TrajanSCC();
	const stronglyConnectedComponents = tarjan.findStronglyConnectedComponents(idEdges);
	stronglyConnectedComponents.forEach((scc) => {
		const johnson = new JohnsonsAPSP();
		if (scc.length > 1) {
			cycles.push(...johnson.findSimpleCycles(scc));
		}
	});
	return cycles;
}
