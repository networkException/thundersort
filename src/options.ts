import { Rule, Rules } from './rules.js';
import { Browser } from './types/browser';

declare const browser: Browser;

class Document {
    static #testRulesInput = document.querySelector<HTMLInputElement>('#test-rules-input')!;
    static #testRulesOutput = document.querySelector<HTMLInputElement>('#test-rules-output')!;
    static #rules = document.querySelector<HTMLOListElement>('#rules')!;

    static #addRuleButton = document.querySelector<HTMLButtonElement>('#addRule')!;
    static #resetRulesButton = document.querySelector<HTMLButtonElement>('#resetRules')!;

    static #saveButton = document.querySelector<HTMLButtonElement>('#save')!;

    public static register(): void {
        document.addEventListener('DOMContentLoaded', Document.restoreOptions);
        this.#saveButton.onclick = () => Document.saveOptions();

        this.registerTestRuleListener(this.#testRulesInput);

        this.#addRuleButton.onclick = () => Document.addRule('', '');
        this.#resetRulesButton.onclick = async () => {
            (Array.from(this.#rules.children) as Array<OptionRuleElement>).forEach(rule => rule.remove());

            const defaultRules = await Rules.getDefault();

            for (const { expression, output } of defaultRules) {
                Document.addRule(expression, output);
            }
        };
    }

    public static addRule(expression: string, output: string) {
        const optionRule = document.createElement('option-rule') as OptionRuleElement;

        optionRule.expression = expression;
        optionRule.output = output;

        this.#rules.prepend(optionRule);
    }

    public static registerTestRuleListener(element: HTMLElement): void {
        element.onkeydown = () => this.testRules();
        element.onkeyup = () => this.testRules();
    }

    public static getRules(): Array<Rule> {
        return (Array.from(this.#rules.children) as Array<OptionRuleElement>).map(child => ({
            expression: child.expression,
            output: child.output
        }));
    }

    public static testRules() {
        const input = this.#testRulesInput.value;

        const matchingRule = Rules.findMatchingRule(this.getRules(), input);
        if (matchingRule === undefined)
            return this.#testRulesOutput.value = 'No rule matched';

        return this.#testRulesOutput.value = Rules.calculateSlug(matchingRule);
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

        for (const { expression, output } of rules) {
            Document.addRule(expression, output);
        }
    }
}

Document.register();

class OptionRuleElement extends HTMLElement {
    #expressionInput: HTMLInputElement;
    #outputInput: HTMLInputElement;
    #removeButton: HTMLButtonElement;

    public constructor() {
        super();

        /*
        <template id="option-rule-template">
            <li>
                <div>
                    <input type="text" class="expression" value="([^\.]+)@.*$">
                    <input type="text" class="output" value="$1">
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

        this.#removeButton = document.createElement('button');
        this.#removeButton.innerText = 'Remove rule';
        this.#removeButton.onclick = () => this.remove();

        Document.registerTestRuleListener(this.#expressionInput);
        Document.registerTestRuleListener(this.#outputInput);

        const shadowRoot = this.attachShadow({ mode: 'open' });

        div.appendChild(this.#expressionInput);
        div.appendChild(this.#outputInput);
        div.appendChild(this.#removeButton);
        li.appendChild(div);

        shadowRoot.appendChild(li);
    }

    public getRule(): Rule {
        return {
            expression: this.expression,
            output: this.output
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
}

customElements.define('option-rule', OptionRuleElement);
