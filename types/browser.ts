import { MailAccount } from './mailAccount';
import { MailFolder } from './mailFolder';
import { MessageList } from './messageList';
import { MessagePart } from './messagePart';

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
        delete(folder: MailFolder): void,
        getSubFolders(folderOrAccount: MailFolder | MailAccount, includeSubFolders: boolean): Promise<Array<MailFolder>>
    };
    mailingLists: void;
    mailTabs: void;
    menus: {
        create(createProperties: {
            checked?: boolean,
            command?: string,
            contexts?: Array<'all' | 'page' | 'frame' | 'selection' | 'link' | 'editable' | 'password' | 'image' | 'video' | 'audio' | 'browser_action' | 'tab' | 'message_list' | 'folder_pane' | 'compose_attachments'>,
            documentUrlPatterns?: Array<string>,
            enabled?: boolean,
            icons?: any,
            id?: string,
            onclick?: (info: any) => void,
            parentId?: string | number,
            targetUrlPatterns?: Array<string>,
            title?: string,
            type?: 'normal' | 'checkbox' | 'radio' | 'seperator',
            viewTypes?: Array<'tab' | 'popup' | 'sidebar'>,
            visible?: boolean
        }, callback?: () => void): Promise<string | number>
    };
    messageDisplay: void;
    messageDisplayAction: void;
    messageDisplayScripts: void;
    messages: {
        getFull(messageId: number): Promise<MessagePart>,
        getRaw(messageId: number): Promise<string>,
        move(messageIds: Array<number>, destination: MailFolder): void,
        list(folder: MailFolder): Promise<MessageList>,
        onNewMailReceived: { addListener(handler: (folder: MailFolder, messages: MessageList) => void): void }
    };
    theme: void;
    tabs: void;
    windows: void;
}