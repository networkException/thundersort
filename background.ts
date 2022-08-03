import { Rule } from './options';
import { Browser } from './types/browser';
import { MailAccount } from './types/mailAccount';
import { MailFolder } from './types/mailFolder';
import { MessageHeader } from './types/messageHeader';
import { MessageList } from './types/messageList';
import { MessagePart } from './types/messagePart';
import { FolderPaneOnClickData, MessageListOnClickData } from './types/onClickData';

// Shared with options index.ts

function calculateSlug(match: RegExpMatchArray, output: string): string {
    return output.replaceAll(/\$\d/g, substring => {
        const group = Number(substring[1]);
        const groupInMatch = match[group];

        if (groupInMatch !== undefined)
            return groupInMatch;

        return substring;
    });
}

function findMatchingRule(rules: Array<Rule>, address: string): { match: RegExpMatchArray, rule: Rule } | undefined {
    for (const rule of rules) {
        const regex = new RegExp(rule.expression);
        const match = address.match(regex);
        if (match !== null)
            return { match, rule };
    }
}

// end

// https://webextension-api.thunderbird.net/en/91/messages.html

declare const browser: Browser;

(async function() {
    let config = (await browser.storage.sync.get()) as {
        autoSort: boolean,
        rules: Array<Rule>
    };

    config.autoSort ??= false;
    config.rules ??= [ { expression: "([^\.]+)@.*$", output: "$1" } ]

    console.log('Config: Loaded initial', config);

    browser.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync')
            return;

        for (const [ key, { newValue: value } ] of Object.entries(changes)) {
            // @ts-expect-error It's fine if the key is not in the type definition of config
            config[key] = value;

            console.log(`Config: Value '${key}' got updated to ${JSON.stringify(value)}`)
        }
    });

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

    const sortMessage = async (inbox: MailFolder, message: MessageHeader, accountName: string): Promise<void> => {
        // The address the message got sent to
        // This expects the name of accounts to be the domain name of the emails
        const recipient: string | undefined = await getRecipient(message.id, accountName);

        if (!recipient) {
            console.log('Sort: Message does not have recipient :(');
            return;
        }

        const matchingRule = findMatchingRule(config.rules, recipient);
        if (!matchingRule) {
            console.log('Sort: No rule found matching the recipient ' + recipient);
            return;
        }

        const slug = calculateSlug(matchingRule.match, matchingRule.rule.output);

        // Noop if the message already is in a folder with the slug as the name
        if (message.folder.name === slug)
            return;

        console.log('Sort: Message from ' + message.author + ' to ' + recipient + ' should be moved to ' + slug);

        const subFolders = await browser.folders.getSubFolders(inbox, false);

        // Find an existing folder or create a new one
        const search: MailFolder | undefined = subFolders.filter(subFolder => subFolder.name === slug)[0];
        const folder: MailFolder = search ?? await browser.folders.create(message.folder, slug);

        // Move the message
        browser.messages.move([message.id], folder);
    }

    const sortMessageList = async (inbox: MailFolder, messageList: MessageList, ignoreRead: boolean = true) => {
        // Ignore non inbox folders
        if (inbox.type !== 'inbox')
            return;

        const account: MailAccount = await browser.accounts.get(inbox.accountId);

        for (const message of messageList.messages) {
            // Ignore already read messages if enabled
            if (ignoreRead && message.read) {
                console.log('Sort: Ignoring read message');
                continue;
            }

            sortMessage(inbox, message, account.name);
        }
    };

    const getInboxFromFolder = async (folder: MailFolder): Promise<MailFolder | undefined> => {
        if (folder.type === 'inbox') return folder;

        const account = await browser.accounts.get(folder.accountId);

        for (const folder of account.folders) {
            if (folder.type === 'inbox') return folder;
        }
    }

    browser.messages.onNewMailReceived.addListener((inbox: MailFolder, messageList: MessageList) => {
        if (!config.autoSort)
            return;

        sortMessageList(inbox, messageList).catch(console.error);
    });

    browser.menus.create<FolderPaneOnClickData>({
        title: 'Sort Inbox using Thundersort',
        contexts: ['folder_pane'],
        onclick: async ({ selectedFolder }) => {
            const inbox = await getInboxFromFolder(selectedFolder);
            if (inbox === undefined)
                return;

            sortMessageList(inbox, await browser.messages.list(inbox), false);
        }
    });

    browser.menus.create<MessageListOnClickData>({
        title: 'Sort Message(s) using Thundersort',
        contexts: ['message_list'],
        onclick: async ({ selectedMessages, displayedFolder }) => {
            const inbox = await getInboxFromFolder(displayedFolder);
            if (inbox === undefined)
                return;

            sortMessageList(inbox, selectedMessages, false);
        }
    });

    console.log('Thundersort: Initialized');
})();
