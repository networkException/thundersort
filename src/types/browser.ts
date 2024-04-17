import { Event } from './event';
import { MailAccount } from './mailAccount';
import { MailFolder } from './mailFolder';
import { MessageChangeProperties } from './messageChangeProperties';
import { MessageHeader } from './messageHeader';
import { MessageList } from './messageList';
import { MessagePart } from './messagePart';
import { OnClickData } from './onClickData';
import { StorageArea, StorageChanges } from './storage';
import { Tab } from './tab';

export declare interface Browser {
    accounts: {
        get(accountId: string): Promise<MailAccount>,
        list(): Promise<Array<MailAccount>>
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
        create<T = OnClickData>(createProperties: {
            checked?: boolean,
            command?: string,
            contexts?: Array<'all' | 'page' | 'frame' | 'selection' | 'link' | 'editable' | 'password' | 'image' | 'video' | 'audio' | 'browser_action' | 'tab' | 'message_list' | 'folder_pane' | 'compose_attachments' | 'message_display_action'>,
            documentUrlPatterns?: Array<string>,
            enabled?: boolean,
            icons?: any,
            id?: string,
            onclick?: (info: T) => void,
            parentId?: string | number,
            targetUrlPatterns?: Array<string>,
            title?: string,
            type?: 'normal' | 'checkbox' | 'radio' | 'seperator',
            viewTypes?: Array<'tab' | 'popup' | 'sidebar'>,
            visible?: boolean
        }, callback?: () => void): Promise<string | number>
    };
    messageDisplay: {
        getDisplayedMessage(tabId: number): Promise<MessageHeader>,
        onMessageDisplayed: Event<[ tab: Tab, message: MessageHeader ]>
    };
    messageDisplayAction: void;
    messageDisplayScripts: void;
    messages: {
        getFull(messageId: number): Promise<MessagePart>,
        getRaw(messageId: number): Promise<string>,
        move(messageIds: Array<number>, destination: MailFolder): void,
        list(folder: MailFolder): Promise<MessageList>,
        continueList(messageListId: string): Promise<MessageList>,
        onNewMailReceived: Event<[ folder: MailFolder, messages: MessageList ]>,
        onUpdated: Event<[ message: MessageHeader, changedProperties: MessageChangeProperties ]>
    };
    theme: void;
    tabs: void;
    windows: void;
    storage: {
        onChanged: Event<[ changes: StorageChanges, areaName: 'sync' | 'local' | 'managed' ]>,
        sync: StorageArea,
        local: StorageArea,
        managed: StorageArea
    };
}
