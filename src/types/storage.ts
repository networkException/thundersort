type Primitive = number | boolean | string | Array<Primitive> | object;

export declare type StorageChanges = {
    [key: string]: { oldValue: Primitive, newValue: Primitive }
};

export declare interface StorageArea {
    get(keys?: string | Array<string>): Promise<{ [key: string]: Primitive }>;
    set(keys: { [key: string]: Primitive | undefined }): void;
}
