export declare interface MailFolder {
    accountId: string;
    path: string;
    name?: string;
    subFolders?: Array<MailFolder>;
    type?: 'inbox' | 'drafts' | 'sent' | 'trash' | 'templates' | 'archives' | 'junk' | 'outbox';
}
