import { MailFolder } from './mailFolder';

export declare interface MessageHeader {
    author: string;
    bccList: Array<string>;
    ccList: Array<string>;
    date: Date;
    flagged: boolean;
    folder: MailFolder;
    id: number;
    junk: boolean;
    junkScore: number;
    read: boolean;
    recipients: Array<string>;
    subject: string;
    tags: Array<string>;
}
