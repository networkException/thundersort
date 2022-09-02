import { Rules } from './rules.js';
import { Browser } from './types/browser';
import { MailFolder } from './types/mailFolder';
import { MessageHeader } from './types/messageHeader';
import { MessageList } from './types/messageList';
import { FolderPaneOnClickData, MessageListOnClickData } from './types/onClickData';

// https://webextension-api.thunderbird.net/en/102/messages.html

declare const browser: Browser;

let autoSort: boolean = (await browser.storage.sync.get('autoSort'))['autoSort'] as boolean;

console.log('Config: Loaded initial', { autoSort });

browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync')
        return;

    if ('autoSort' in changes) {
        console.log(`Config: Changed autoSort to ${changes.autoSort.newValue}`);

        autoSort = changes.autoSort.newValue as boolean;
    }
});


/**
 * Remove angle brackets surrounding the input string
 */
function stripOuterAngleBrackets(input: string): string {
    if (input.startsWith('<') && input.endsWith('>'))
        return input.substring(1, input.length - 1);

    return input;
}

/**
 * Return email address if input is in "Name <address>" format
 */
function stripNameWithAngleBrackets(input: string): string {
    const regex = /^(?:.*)<(.*)>$/;
    const match = input.match(regex);

    if (match === null)
        return input;

    return match[1];
}

/**
 * Extract recipient candidates from as many headers as possible
 */
const getRecipients = async (message: MessageHeader): Promise<Array<string> | undefined> => {
    const headers = (await browser.messages.getFull(message.id)).headers;

    const recipients: Array<string> = [
        ...message.bccList,
        ...message.ccList,
        ...message.recipients,
        ...(headers?.['x-github-recipient-address'] ?? []),
        ...(headers?.['delivered-to'] ?? [])
    ];

    if (recipients.length > 0) return recipients
        .map(stripOuterAngleBrackets)
        .map(stripNameWithAngleBrackets);
};

const sortMessage = async (inbox: MailFolder, message: MessageHeader): Promise<void> => {
    // The address the message got sent to
    const recipients: Array<string> | undefined = await getRecipients(message);

    if (!recipients) {
        console.log('Sort: Message does not have recipient :(');
        return;
    }

    let slug: string | undefined;
    let recipient: string | undefined;

    const rules = await Rules.get();

    for (const possibleRecipient of recipients) {
        const matchingRule = Rules.findMatchingRule(rules, possibleRecipient);
        if (matchingRule) {
            recipient = possibleRecipient;
            slug = Rules.calculateSlug(matchingRule);
            break;
        }
    }

    if (!recipient || !slug) {
        console.log(`Sort: No rule found matching any recipient. (${recipients.map(recipient => `"${recipient}"`).join(', ')})`);

        return;
    }

    // Noop if the message already is in a folder with the slug as the name
    if (message.folder.name === slug)
        return;

    console.log(`Sort: Message from ${message.author} to ${recipient} should be moved to ${slug} (possible recipients: ${recipients.map(recipient => `"${recipient}"`).join(', ')})`);

    const subFolders = await browser.folders.getSubFolders(inbox, false);

    // Find an existing folder or create a new one
    const search: MailFolder | undefined = subFolders.filter(subFolder => subFolder.name === slug)[0];
    const folder: MailFolder = search ?? await browser.folders.create(message.folder, slug);

    // Move the message
    browser.messages.move([ message.id ], folder);
};

const sortMessageList = async (inbox: MailFolder, messageList: MessageList, ignoreRead: boolean = true) => {
    // Ignore non inbox folders
    if (inbox.type !== 'inbox')
        return;

    for (const message of messageList.messages) {
        // Ignore already read messages if enabled
        if (ignoreRead && message.read) {
            console.log('Sort: Ignoring read message');
            continue;
        }

        sortMessage(inbox, message);
    }
};

const getInboxFromFolder = async (folder: MailFolder): Promise<MailFolder | undefined> => {
    if (folder.type === 'inbox') return folder;

    const account = await browser.accounts.get(folder.accountId);

    for (const folder of account.folders) {
        if (folder.type === 'inbox') return folder;
    }
};

browser.messages.onNewMailReceived.addListener((inbox: MailFolder, messageList: MessageList) => {
    if (!autoSort)
        return;

    sortMessageList(inbox, messageList).catch(console.error);
});

browser.menus.create<FolderPaneOnClickData>({
    title: 'Sort Inbox using Thundersort',
    contexts: [ 'folder_pane' ],
    onclick: async ({ selectedFolder }) => {
        const inbox = await getInboxFromFolder(selectedFolder);
        if (inbox === undefined)
            return;

        sortMessageList(inbox, await browser.messages.list(inbox), false);
    }
});

browser.menus.create<MessageListOnClickData>({
    title: 'Sort Message(s) using Thundersort',
    contexts: [ 'message_list' ],
    onclick: async ({ selectedMessages, displayedFolder }) => {
        const inbox = await getInboxFromFolder(displayedFolder);
        if (inbox === undefined)
            return;

        sortMessageList(inbox, selectedMessages, false);
    }
});

console.log('Thundersort: Initialized');
