/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IService {
	getData(): Promise<any>;
	processData(data: any): void;
}
