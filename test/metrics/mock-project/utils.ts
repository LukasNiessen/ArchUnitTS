/* eslint-disable @typescript-eslint/no-explicit-any */
export class Utils {
	public static formatData(data: any): string {
		return JSON.stringify(data);
	}

	public static parseData(input: string): any {
		return JSON.parse(input);
	}
}
