import { ColorUtils } from './color-utils';

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
		if (violations.length > 0) {
			const violationSummary =
				violations.length === 1
					? ColorUtils.formatErrorSummary(
							'Architecture rule failed with 1 violation:'
						)
					: ColorUtils.formatErrorSummary(
							`Architecture rule failed with ${violations.length} violations:`
						);

			const violationDetails = violations
				.map(
					(violation, index) =>
						`${ColorUtils.formatViolationNumber(`${index + 1}.`)} ${violation.message}`
				)
				.join('\n\n');

			const info = `${violationSummary}\n\n${violationDetails}`;
			return { pass: false, message: () => info };
		}

		const successMessage = shouldNotPass
			? ColorUtils.formatSuccess(
					'Architecture rule validation passed (expected to not pass)'
				)
			: ColorUtils.formatSuccess('Architecture rule validation passed');
		return { pass: true, message: () => successMessage };
	}
	public static error(message: string): TestResult {
		return { pass: false, message: () => ColorUtils.redBold(`Error: ${message}`) };
	}
}
