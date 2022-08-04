import { MailFolder } from './mailFolder';
import { MessageList } from './messageList';

export declare interface OnClickData {
    editable: boolean;
    menuItemId: number | string;
    modifiers: Array<'Shift' | 'Alt' | 'Command' | 'Ctrl' | 'MacCtrl'>;
}

export declare interface MessageListOnClickData extends OnClickData {
    displayedFolder: MailFolder;
    selectedMessages: MessageList;
}

export declare interface FolderPaneOnClickData extends OnClickData {
    selectedFolder: MailFolder;
}
