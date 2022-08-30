import { Browser } from './types/browser';

declare const browser: Browser;

export declare interface Rule {
    expression: string;
    output: string;
}

export type MatchedRule = { match: RegExpMatchArray, rule: Rule };

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
                output: '$1'
            }));
    }

    /**
     * Get folder slug for a specific match of a rule
     */
    public static calculateSlug(matchedRule: MatchedRule): string {
        const output = matchedRule.rule.output;

        return output.replaceAll(/\$\d/g, substring => {
            const group = Number(substring[1]);
            const groupInMatch = matchedRule.match[group];

            if (groupInMatch !== undefined)
                return groupInMatch;

            return substring;
        });
    }

    /**
     * Find the first match in a list of rules, given an address
     */
    public static findMatchingRule(rules: Array<Rule>, address: string): MatchedRule | undefined {
        for (const rule of rules) {
            const regex = new RegExp(rule.expression);
            const match = address.match(regex);
            if (match !== null)
                return { match, rule };
        }
    }

    /**
     * Find the first match for a list of rules and return the slug
     */
    public static findMatchingSlug(rules: Array<Rule>, address: string): string | undefined {
        const matchingRule = this.findMatchingRule(rules, address);
        if (matchingRule === undefined)
            return undefined;

        return this.calculateSlug(matchingRule);
    }
}
