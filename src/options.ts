import { Browser } from "./types/browser";

declare const browser: Browser;

export declare interface Rule {
    expression: string,
    output: string
}

function getRules(): Array<Rule> {
    return Array.from(document.querySelector<HTMLOListElement>("#rules")!.children).map(child => ({
        expression: child.querySelector<HTMLFormElement>(".expression")!.value,
        output: child.querySelector<HTMLFormElement>(".output")!.value
    }));
}

const testRulesInput = document.querySelector<HTMLInputElement>("#test-rules-input")!;
const testRulesOutput = document.querySelector<HTMLInputElement>("#test-rules-output")!;

function testRules() {
    const input = testRulesInput.value;

    const matchingRule = findMatchingRule(getRules(), input);
    if (matchingRule === undefined)
        return testRulesOutput.value = 'No rule matched';

    const { match, rule } = matchingRule;

    return testRulesOutput.value = calculateSlug(match, rule.output);
}

testRulesInput.onkeydown = () => testRules();
testRulesInput.onkeyup = () => testRules();

testRules();

function saveOptions(event: Event) {
    browser.storage.sync.set({
        autoSort: document.querySelector<HTMLFormElement>("#auto-sort")!.checked,
        rules: getRules()
    });

    event.preventDefault();
}

async function restoreOptions() {
    const storage = await browser.storage.sync.get() as {
        autoSort: boolean,
        rules: Array<Rule>
    };

    document.querySelector<HTMLFormElement>("#auto-sort")!.checked = storage['autoSort'] ?? false;

    const rules = (storage.rules ?? []).reverse();

    if (rules.length === 0) addRule("([^\.]+)@.*$", "$1");

    for (const { expression, output } of rules) {
        addRule(expression, output);
    }
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form")!.addEventListener("submit", saveOptions);

// calculateSlug("2.something.test@example.com".match(/([^\.]+)@.*$/), "$1")
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

const ruleTemplate = document.querySelector<HTMLTemplateElement>("#rule")!;
const rulesContainer = document.querySelector<HTMLOListElement>("#rules")!;

function addRule(expression: string, output: string) {
    const rule = ruleTemplate.content.cloneNode(true) as DocumentFragment;

    const expressionElement = rule.querySelector<HTMLFormElement>(".expression")!;

    expressionElement.value = expression;
    expressionElement.onkeydown = () => testRules();
    expressionElement.onkeyup = () => testRules();

    const outputElement = rule.querySelector<HTMLFormElement>(".output")!;

    outputElement.value = output;
    outputElement.onkeydown = () => testRules();
    outputElement.onkeyup = () => testRules();

    const ruleContainer = document.createElement("div");

    rule.querySelector<HTMLButtonElement>(".removeRule")!.onclick = () => {
        ruleContainer.remove();
        testRules();
    }

    ruleContainer.append(rule);
    rulesContainer.prepend(ruleContainer);

    testRules();
}

document.querySelector<HTMLButtonElement>("#addRule")!.onclick = () => {
    addRule("", "");
};
