// Presentation Layer - Controllers
import { UserService } from '../Services/user-service';

export class UserController {
	constructor(private userService: UserService) {}

	getUser(id: string) {
		return this.userService.getUserById(id);
	}
}
