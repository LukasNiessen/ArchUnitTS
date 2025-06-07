/* eslint-disable @typescript-eslint/no-explicit-any */

export class PaymentService {
	processPayment(amount: number): boolean {
		console.log(`Processing payment of $${amount}`);
		return true;
	}

	validatePayment(paymentData: any): boolean {
		// Payment validation logic
		return paymentData && paymentData.amount > 0;
	}
}
