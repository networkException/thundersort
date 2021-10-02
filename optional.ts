export class Optional<T> {

    private constructor(public readonly value?: T) {
    }

    public hasValue(): this is { value: NonNullable<T> } {
        return this.value !== undefined && this.value !== null;
    }

    public isEmpty(): this is { value: undefined } {
        return !this.hasValue();
    }

    public valueOr(other: T): T {
        if (this.hasValue())
            return this.value;

        return other;
    }

    public static of<T>(value: T): Optional<T> {
        return new Optional<T>(value);
    }

    public static empty<T>(): Optional<T> {
        return new Optional<T>();
    }
}

export class OptionalPromise<T> extends Promise<Optional<T>> {

    public constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void, reject?: (reason?: any) => void) {
        super(resolve => executor(async value => {
            if (typeof ((value as PromiseLike<T>)?.then) === 'function')
                resolve(Optional.of(await value));

            resolve(Optional.of(value as T));
        }, reason => {
            if (reject)
                reject(reason);

            resolve(Optional.empty());
        }));
    }

    public static of<T>(promise: Promise<T>, reject?: (reason?: any) => any): OptionalPromise<T> {
        return new OptionalPromise((resolve, reject) => promise.then(resolve).catch(reject), reject);
    }
}
