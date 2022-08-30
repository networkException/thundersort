export declare interface MessagePart {
    body?: string;
    contentType?: string;
    headers?: Record<string, Array<string>>;
    name?: string;
    partName?: string;
    parts?: Array<MessagePart>;
    size?: number;
}
