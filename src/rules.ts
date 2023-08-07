import { Browser } from './types/browser';

declare const browser: Browser;

export type MatchOn = 'senders' | 'recipients';

export declare interface Rule {
    expression: string;
    output: string;
    matchOn: MatchOn;
}

export type Match = {
    address: string;
    slug: string;
    matchedOn: MatchOn;
};

export class Rules {
    /**
     * Either retrieves rules from the storage or generate a default set.
     *
     * @returns The current active set of rules
     */
    public static async get(): Promise<Array<Rule>> {
        return ((await browser.storage.sync.get('rules'))?.rules as Array<Rule> | undefined) ?? await this.getDefault();
    }

    /**
     * Escape special regex characters so that the input can be used as a literal match
     */
    private static escapeRegex(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Calculates a set of default rules based on the accounts of a user
     */
    public static async getDefault(): Promise<Array<Rule>> {
        const identityMailDomains = (await browser.accounts.list())
            .filter(account => account.type === 'imap' || account.type === 'pop3')
            .flatMap(account => account.identities
                .map(identity => identity.email))
            .map(email => email.split('@')[1]);

        const uniqueMailDomains = [ ...new Set(identityMailDomains) ];

        return uniqueMailDomains
            .map(domain => ({
                expression: `([^\\.]+)@${this.escapeRegex(domain)}$`,
                output: '$1',
                matchOn: 'recipients',
            }));
    }

    /**
     * Get folder slug for a specific match of a rule
     */
    private static calculateSlug(rule: Rule, match: RegExpMatchArray): string {
        const output = rule.output;

        return output.replaceAll(/\$\d/g, substring => {
            const group = Number(substring[1]);
            const groupInMatch = match[group];

            if (groupInMatch !== undefined)
                return groupInMatch;

            return substring;
        });
    }

    /**
     * Find the first match in a list of rules, given recipients and senders
     */
    public static match(rules: Array<Rule>, recipients: Array<string>, senders: Array<string>): Match | undefined {
        for (const rule of rules) {
            for (const addressCandidate of rule.matchOn === 'recipients' ? recipients : senders) {
                const regex = new RegExp(rule.expression);
                const match = addressCandidate.match(regex);

                if (match !== null) {
                    return {
                        address: addressCandidate,
                        slug: this.calculateSlug(rule, match),
                        matchedOn: rule.matchOn
                    };
                }
            }
        }
    }
}
