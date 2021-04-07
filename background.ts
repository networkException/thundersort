import { Browser } from './types/browser';
import { MailAccount } from './types/mailAccount';
import { MailFolder } from './types/mailFolder';
import { MessageList } from './types/messageList';
import { MessagePart } from './types/messagePart';

declare const browser: Browser;

browser.messages.onNewMailReceived.addListener(async (inbox: MailFolder, messageList: MessageList) => {
    // Ignore non inbox folders
    if (inbox.type !== 'inbox')
        return;

    const account: MailAccount = await browser.accounts.get(inbox.accountId);

    for (const message of messageList.messages) {
        // Ignore already read messages
        if (message.read)
            continue;

        // The address the message got sent to
        // This expects the name of accounts to be the domain name of the emails
        const part: MessagePart = await browser.messages.getFull(message.id);

        if (!part.headers)
            continue;

        if (!part.headers['delivered-to'])
            continue;

        const recipient: string | undefined = part.headers['delivered-to']
            .map(recipient => recipient.replace(/[<>]/g, ''))
            .filter(recipient => recipient.split('@')[1] === account.name)[0];

        if (!recipient)
            continue;

        const slug: string = recipient.split('@')[0].split('.').slice(-1)[0].toLowerCase();

        // Noop if the message already is in a folder with the slug as the name
        if (message.folder.name === slug)
            continue;

        console.log('Message from ' + message.author + ' to ' + recipient + ' should be moved to ' + slug);

        // Find an existing folder or create a new one
        const search: MailFolder | undefined = (inbox.subFolders ?? []).filter(subFolder => subFolder.name === slug)[0];
        const folder: MailFolder = search ?? await browser.folders.create(message.folder, slug);

        // Move the message
        browser.messages.move([ message.id ], folder);
    }
});

console.log('Loaded thundersort');