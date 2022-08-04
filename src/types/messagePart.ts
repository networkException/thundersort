export declare interface MessagePart {
    body?: string;
    contentType?: string;
    headers?: {
        'delivered-to': Array<string>;
        'to': Array<string>;
    };
    name?: string;
    partName?: string;
    parts?: Array<MessagePart>;
    size?: number;
}
