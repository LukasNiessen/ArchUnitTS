export class TechnicalError extends Error {
	constructor(message: string | undefined) {
		super(message);
		this.name = 'TechnicalError';

		// For stack traces
		Object.setPrototypeOf(this, TechnicalError.prototype);
	}
}

export class UserError extends Error {
	constructor(message: string | undefined) {
		super(message);
		this.name = 'UserError';

		// For stack traces
		Object.setPrototypeOf(this, UserError.prototype);
	}
}
