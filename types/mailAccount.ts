import { MailFolder } from './mailFolder';

export declare interface MailAccount {
    folders: Array<MailFolder>;
    id: string;
    identities: Array<void>;
    name: string;
    type: 'imap' | 'nntp' | 'pop3';
}