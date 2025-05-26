import { AbstractBase } from './abstract-base';
import { IService } from './service.interface';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class ConcreteService extends AbstractBase implements IService {
	private data: any;

	protected doSomething(): void {
		console.log('Doing something...');
	}

	public async getData(): Promise<any> {
		return this.data;
	}

	public processData(data: any): void {
		this.data = data;
	}
}
