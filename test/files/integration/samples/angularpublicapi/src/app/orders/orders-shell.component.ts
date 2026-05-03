import { OrderService } from './internal/order.service';

export class OrdersShellComponent {
	constructor(private readonly orderService: OrderService) {}

	render(id: string): string {
		return this.orderService.findOrder(id);
	}
}
