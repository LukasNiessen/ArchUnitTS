export interface TestResult {
	pass: boolean;
	message: () => string;
}

export interface TestViolation {
	message: string;
	details: Object;
}

export class ResultFactory {
	public static result(
		shouldNotPass: boolean,
		violations: TestViolation[]
	): TestResult {
		let info = shouldNotPass ? 'expected to not pass\n' : 'expected to pass\n';
		if (violations.length > 0) {
			violations.forEach((e) => {
				info += `${e.message}\n${JSON.stringify(e.details)}\n\n`;
			});
			return { pass: false, message: () => info };
		}
		return { pass: true, message: () => info };
	}

	public static error(message: string): TestResult {
		return { pass: false, message: () => message };
	}
}
