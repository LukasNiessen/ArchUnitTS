// BusinessLogic layer - should only depend on DataAccess
import { DataAccess } from '../DataAccess/data-repository';

export class BusinessLogic {
	constructor(private dataRepository: DataAccess) {}

	processData() {
		return this.dataRepository.getData();
	}
}
