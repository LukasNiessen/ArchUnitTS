// UserInterface layer - should only depend on BusinessLogic
import { BusinessLogic } from '../BusinessLogic/business-service';

export class UserController {
	constructor(private businessService: BusinessLogic) {}

	handleRequest() {
		return this.businessService.processData();
	}
}
