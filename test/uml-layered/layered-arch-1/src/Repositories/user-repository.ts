// Data Layer - Repositories
export class UserRepository {
	findById(id: string) {
		return { id, name: 'User ' + id };
	}
}
