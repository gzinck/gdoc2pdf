// eslint-disable-next-line
const { writers } = require('google-docs-converter');
const { MarkdownWriter } = writers;

const regexWhitespace = /^\s$/g;

export class MarkdownWriterWithTags extends MarkdownWriter {
    private readonly strikes: boolean;

    constructor(strikes = false) {
        super();
        this.strikes = strikes;
    }

    italicize(text: string): string {
        if (text.match(regexWhitespace)) return ' ';
        return `<i>${text}</i>`;
    }

    bold(text: string): string {
        if (text.match(regexWhitespace)) return ' ';
        return `<b>${text}</b>`;
    }

    strikethrough(text: string): string {
        if (!this.strikes || text.match(regexWhitespace)) return ' ';
        return `<s>${text}</s>`;
    }
}
