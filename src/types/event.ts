export declare interface Event<ListenerParameters extends Array<any>> {
    addListener(callback: (...parameters: ListenerParameters) => void): void;
}
