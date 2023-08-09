import { MatchOn, Rule, Rules } from './rules.js';
import { Browser } from './types/browser';

declare const browser: Browser;

class Document {
    static #testRulesRecipientInput = document.querySelector<HTMLInputElement>('#test-rules-recipient-input')!;
    static #testRulesSenderInput = document.querySelector<HTMLInputElement>('#test-rules-sender-input')!;

    static #testRulesAddressOutput = document.querySelector<HTMLInputElement>('#test-rules-address-output')!;
    static #testRulesSlugOutput = document.querySelector<HTMLInputElement>('#test-rules-slug-output')!;
    static #testRulesMatchedOnOutput = document.querySelector<HTMLInputElement>('#test-rules-matchedOn-output')!;

    static #rules = document.querySelector<HTMLOListElement>('#rules')!;

    static #addRuleButton = document.querySelector<HTMLButtonElement>('#addRule')!;
    static #resetRulesButton = document.querySelector<HTMLButtonElement>('#resetRules')!;

    static #saveButton = document.querySelector<HTMLButtonElement>('#save')!;

    public static register(): void {
        document.addEventListener('DOMContentLoaded', Document.restoreOptions);
        this.#saveButton.onclick = () => Document.saveOptions();

        this.registerTestRuleListener(this.#testRulesRecipientInput);
        this.registerTestRuleListener(this.#testRulesSenderInput);

        this.#addRuleButton.onclick = () => Document.addRule({ expression: '', output: '', matchOn: 'recipients' });
        this.#resetRulesButton.onclick = async () => {
            (Array.from(this.#rules.children) as Array<OptionRuleElement>).forEach(rule => rule.remove());

            const defaultRules = await Rules.getDefault();

            for (const rule of defaultRules) {
                Document.addRule(rule);
            }
        };
    }

    public static addRule(rule: Rule) {
        const optionRule = document.createElement('option-rule') as OptionRuleElement;

        optionRule.expression = rule.expression;
        optionRule.output = rule.output;
        optionRule.matchOn = rule.matchOn;

        this.#rules.append(optionRule);
    }

    public static registerTestRuleListener(element: HTMLElement): void {
        element.onkeydown = () => this.testRules();
        element.onkeyup = () => this.testRules();
        element.onchange = () => this.testRules();
    }

    public static getRules(): Array<Rule> {
        return (Array.from(this.#rules.children) as Array<OptionRuleElement>).map(child => ({
            expression: child.expression,
            output: child.output,
            matchOn: child.matchOn,
        }));
    }

    public static testRules() {
        const recipient = this.#testRulesRecipientInput.value;
        const sender = this.#testRulesSenderInput.value;

        const match = Rules.match(this.getRules(), [ recipient ], [ sender ]);
        if (!match) {
            this.#testRulesAddressOutput.value = 'No rule matched';
            this.#testRulesSlugOutput.value = 'No rule matched';
            this.#testRulesMatchedOnOutput.value = 'No rule matched';

            return;
        }

        this.#testRulesAddressOutput.value = match.address;
        this.#testRulesSlugOutput.value = match.slug;
        this.#testRulesMatchedOnOutput.value = match.matchedOn;
    }

    public static saveOptions() {
        browser.storage.sync.set({
            autoSort: document.querySelector<HTMLFormElement>('#auto-sort')!.checked,
            rules: Document.getRules()
        });
    }

    public static async restoreOptions() {
        const autoSort: boolean = (await browser.storage.sync.get('autoSort'))['autoSort'] as boolean;
        const rules = await Rules.get();

        document.querySelector<HTMLFormElement>('#auto-sort')!.checked = autoSort ?? false;

        for (const rule of rules) {
            Document.addRule(rule);
        }
    }
}

Document.register();

class OptionRuleElement extends HTMLElement {
    #expressionInput: HTMLInputElement;
    #outputInput: HTMLInputElement;
    #matchOnSelector: HTMLSelectElement;
    #removeButton: HTMLButtonElement;

    public constructor() {
        super();

        /*
        <template id="option-rule-template">
            <li>
                <div>
                    <input type="text" class="expression" value="([^\.]+)@.*$">
                    <input type="text" class="output" value="$1">
                    <select name="matchOn" class="matchOn">
                        <option value="recipients">Recipients</option>
                        <option value="senders">Senders</option>
                    </select>
                    <button class="removeRule" type="button">Remove rule</button>
                </div>
            </li>
        </template>
        */

        const li = document.createElement('li');
        const div = document.createElement('div');

        this.#expressionInput = document.createElement('input');
        this.#expressionInput.type = 'text';

        this.#outputInput = document.createElement('input');
        this.#outputInput.type = 'text';

        this.#matchOnSelector = document.createElement('select');

        const recipientsOption = document.createElement('option');
        recipientsOption.innerText = 'Recipients';
        recipientsOption.value = 'recipients';

        const sendersOption = document.createElement('option');
        sendersOption.innerText = 'Senders';
        sendersOption.value = 'senders';

        this.#matchOnSelector.appendChild(recipientsOption);
        this.#matchOnSelector.appendChild(sendersOption);

        this.#removeButton = document.createElement('button');
        this.#removeButton.innerText = 'Remove rule';
        this.#removeButton.onclick = () => this.remove();

        Document.registerTestRuleListener(this.#expressionInput);
        Document.registerTestRuleListener(this.#outputInput);
        Document.registerTestRuleListener(this.#matchOnSelector);

        const shadowRoot = this.attachShadow({ mode: 'open' });

        div.appendChild(this.#expressionInput);
        div.appendChild(this.#outputInput);
        div.appendChild(this.#matchOnSelector);
        div.appendChild(this.#removeButton);
        li.appendChild(div);

        shadowRoot.appendChild(li);
    }

    public getRule(): Rule {
        return {
            expression: this.expression,
            output: this.output,
            matchOn: this.matchOn,
        };
    }

    public connectedCallback(): void {
        Document.testRules();
    }

    set expression(value: string) {
        this.#expressionInput.value = value;
    }

    get expression(): string {
        return this.#expressionInput.value;
    }

    set output(value: string) {
        this.#outputInput.value = value;
    }

    get output(): string {
        return this.#outputInput.value;
    }

    set matchOn(matchOn: MatchOn) {
        this.#matchOnSelector.value = matchOn;
    }

    get matchOn(): MatchOn {
        return this.#matchOnSelector.value as MatchOn;
    }
}

customElements.define('option-rule', OptionRuleElement);
