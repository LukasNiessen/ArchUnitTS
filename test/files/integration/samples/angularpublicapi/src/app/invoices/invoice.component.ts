import { OrderCardComponent } from '../orders/components/order-card.component';

export class InvoiceComponent {
	constructor(private readonly orderCard: OrderCardComponent) {}

	renderOrder(id: string): string {
		return this.orderCard.render(id);
	}
}
