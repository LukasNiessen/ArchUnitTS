// UserService - can depend on OrderService to get user orders
import { OrderService } from '../OrderService/order-service';

export class UserService {
	constructor(private orderService: OrderService) {}

	getUserOrders(userId: string) {
		return this.orderService.getOrdersByUser(userId);
	}

	getUser(id: string) {
		return { id, name: 'User ' + id };
	}
}
