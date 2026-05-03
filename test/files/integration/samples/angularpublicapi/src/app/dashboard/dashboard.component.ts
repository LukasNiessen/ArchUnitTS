import { PUBLIC_ORDERS_TOKEN } from '../orders';
import type { OrderSummary } from '../orders/public-api';

export class DashboardComponent {
	render(order: OrderSummary): string {
		return `${PUBLIC_ORDERS_TOKEN}:${order.id}`;
	}
}
