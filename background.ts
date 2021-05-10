import { Browser } from './types/browser';
import { MailAccount } from './types/mailAccount';
import { MailFolder } from './types/mailFolder';
import { MessageList } from './types/messageList';
import { MessagePart } from './types/messagePart';

// https://webextension-api.thunderbird.net/en/78/messages.html

declare const browser: Browser;

const getRecipient = async (messageId: number, accountName: string): Promise<string | undefined> => {
    return new Promise(resolve => {
        browser.messages.getFull(messageId).then((part: MessagePart) => {
            if (!part.headers)
                throw new Error();

            const recipient: string | undefined = part.headers['delivered-to']
                .map(recipient => recipient.replace(/[<>]/g, ''))
                .filter(recipient => recipient.split('@')[1] === accountName)[0];

            if (!recipient)
                throw new Error();

            resolve(recipient);
        }).catch(() => browser.messages.getRaw(messageId).then((raw: string) => {
            const lines: Array<string> = raw.split('\n').map(line => line.trim());

            for (const line of lines) {
                if (line.startsWith('Delivered-To: ')) {
                    resolve(line.substring(line.indexOf(' ')).replace(/[<>]/g, '').trim());
                    return;
                }
            }

            resolve(undefined);
        }).catch(() => resolve(undefined)));
    });
};

const thundersort = async (inbox: MailFolder, messageList: MessageList, ignoreRead: boolean = true) => {
    // Ignore non inbox folders
    if (inbox.type !== 'inbox')
        return;

    const account: MailAccount = await browser.accounts.get(inbox.accountId);

    for (const message of messageList.messages) {
        // Ignore already read messages if enabled
        if (ignoreRead && message.read) {
            console.log('Ignoring read message');
            continue;
        }

        // The address the message got sent to
        // This expects the name of accounts to be the domain name of the emails
        const recipient: string | undefined = await getRecipient(message.id, account.name);

        if (!recipient) {
            console.log('Message does not have recipient :(');
            continue;
        }

        let slug: string = recipient.split('@')[0].split('.').slice(-1)[0].toLowerCase();

        // Move messages from deprecated account naming to new
        if (slug === 'accounts' && recipient.endsWith('jakobniklas.de'))
            slug = 'admin';

        // Noop if the message already is in a folder with the slug as the name
        if (message.folder.name === slug)
            continue;

        console.log('Message from ' + message.author + ' to ' + recipient + ' should be moved to ' + slug);

        // Find an existing folder or create a new one
        const search: MailFolder | undefined = (inbox.subFolders ?? []).filter(subFolder => subFolder.name === slug)[0];
        const folder: MailFolder = search ?? await browser.folders.create(message.folder, slug);

        // Move the message
        browser.messages.move([message.id], folder);
    }
};

browser.messages.onNewMailReceived.addListener((inbox: MailFolder, messageList: MessageList) =>
    thundersort(inbox, messageList).catch(console.error));

browser.menus.create({
    title: 'Apply thundersort',
    contexts: ['folder_pane'],
    onclick: async (info: { selectedFolder: MailFolder }) => {
        thundersort(info.selectedFolder, await browser.messages.list(info.selectedFolder), false);
    }
});

console.log('Loaded thundersort');