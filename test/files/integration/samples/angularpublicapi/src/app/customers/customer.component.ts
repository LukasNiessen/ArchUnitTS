import { OrderService } from '../orders/internal/order.service';

export class CustomerComponent {
	constructor(private readonly orderService: OrderService) {}

	showOrder(id: string): string {
		return this.orderService.findOrder(id);
	}
}
