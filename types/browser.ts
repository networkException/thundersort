import { MailAccount } from './mailAccount';
import { MailFolder } from './mailFolder';
import { MessageList } from './messageList';

export declare interface Browser {
    accounts: {
        get(accountId: string): Promise<MailAccount>
    };
    addressBooks: void;
    browserAction: void;
    cloudFile: void;
    commands: void;
    compose: void;
    composeAction: void;
    composeScript: void;
    contacts: void;
    folders: {
        create(parentFolder: MailFolder, childName: string): any,
        rename(folder: MailFolder, newName: string): void,
        delete(folder: MailFolder): void
    };
    mailingLists: void;
    mailTabs: void;
    menus: void;
    messageDisplay: void;
    messageDisplayAction: void;
    messageDisplayScripts: void;
    messages: {
        move(messageIds: Array<number>, destination: MailFolder): void
        onNewMailReceived: { addListener(handler: (folder: MailFolder, messages: MessageList) => void): void }
    };
    theme: void;
    tabs: void;
    windows: void;
}