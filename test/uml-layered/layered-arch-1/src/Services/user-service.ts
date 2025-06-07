// Business Layer - Services
import { UserRepository } from '../Repositories/user-repository';

export class UserService {
	constructor(private userRepository: UserRepository) {}

	getUserById(id: string) {
		return this.userRepository.findById(id);
	}
}
