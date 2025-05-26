export abstract class AbstractBase {
	protected abstract doSomething(): void;

	public execute(): void {
		this.doSomething();
	}
}
