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

    const removeAngleBrackets = (input: string) => input.replace(/[<>]/g, '')

    /// Determines all possible recipients from a message header. For this we use Thunderbird's pre-parsed attributes bccList, ccList and recipients.
    /// However, this does not work with some emails from mail lists, for example from GitHub, because no header mentions the actual recipient, only a mail list.
    /// The only way to extract the recipient in this case is the `Recieved` header, which has a sub-header `for`.
    const getRecipients = async (message: MessageHeader): Promise<Array<string> | undefined> => {
        const recipients: Array<string> = [ ...message.bccList, ...message.ccList, ...message.recipients ];

        if (recipients.length > 0) return recipients;
    };

    const sortMessage = async (inbox: MailFolder, message: MessageHeader, accountName: string): Promise<void> => {
        // The address the message got sent to
        const recipients: Array<string> | undefined = await getRecipients(message);

        if (!recipients) {
            console.log('Sort: Message does not have recipient :(');
            return;
        }

        let slug: string | undefined;
        let recipient: string | undefined;

        for (const possibleRecipient of recipients) {
            const matchingRule = findMatchingRule(config.rules, possibleRecipient);
            
            if (matchingRule) {
                recipient = possibleRecipient;
                slug = calculateSlug(matchingRule.match, matchingRule.rule.output);
                break;
            }
        }

        if (!recipient || !slug) {
            console.log('Sort: No rule found matching any recipient.');
            return;
        }


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
