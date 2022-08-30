import { MailFolder } from './mailFolder';
import { MailIdentity } from './mailIdentity';

export declare interface MailAccount {
    folders: Array<MailFolder>;
    id: string;
    identities: Array<MailIdentity>;
    name: string;
    type: 'imap' | 'nntp' | 'pop3';
}
