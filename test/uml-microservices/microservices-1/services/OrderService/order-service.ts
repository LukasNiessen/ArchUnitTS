import { PaymentService } from '../PaymentService/payment-service';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class OrderService {
	private paymentService = new PaymentService();

	getOrdersByUser(userId: string) {
		return null; // not implemented
	}

	createOrder(orderData: any): string {
		console.log('Creating order:', orderData);

		// This creates a dependency from OrderService to PaymentService
		const paymentResult = this.paymentService.processPayment(orderData.amount);

		if (paymentResult) {
			return `Order created with ID: ${Math.random().toString(36).substr(2, 9)}`;
		}
		throw new Error('Payment failed');
	}

	validateOrder(orderData: any): boolean {
		return orderData && orderData.amount > 0;
	}
}
