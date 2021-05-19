// eslint-disable-next-line
const { parseDocument } = require('google-docs-converter');
import { MarkdownWriterWithTags } from './writers';
import { docs_v1 } from 'googleapis';

export const toMarkdown = (
    doc: docs_v1.Schema$Document,
    strikes?: boolean
): string => {
    const regexClosingTooLate = /(\n+)(<\/[suib]>)/g;
    const regexHeaderAbove = /^\s*\n#/gm;
    const regexHeaderBelow = /^#([^\n]*)\n\n/gm;
    const regexEmptyHeader = /\n(#+)([ \t]*)\n/g;
    const regexEmptyLink = /\[\s*\]\(.*\)/g;
    const regexIndent = /^ +(\S)/gm;
    const regexEmptyLine = /^ $/gm;
    const regexSpaces = /\w ( +)\w/g;
    const regexLineEnd = /$/gm;
    const regexCheckbox = /^- \[ ?\]([^\n]*)/gm;
    const md = (
        parseDocument(doc, new MarkdownWriterWithTags(strikes)) as string
    )
        // Fix problems where <s> and <u> close after a line break
        .replaceAll(regexClosingTooLate, '$2$1')
        // Remove the inserted lines around headers
        .replaceAll(regexHeaderAbove, '#')
        .replaceAll(regexHeaderBelow, '#$1\n')
        // Remove empty headers
        .replaceAll(regexEmptyHeader, '\n')
        // Remove empty links
        .replaceAll(regexEmptyLink, '')
        // Remove indents
        .replaceAll(regexIndent, '$1')
        // Add empty lines (i.e., lines with a single space)
        .replaceAll(regexEmptyLine, '<br />')
        // Add empty spaces
        .replaceAll(
            regexSpaces,
            (spaces: string) =>
                spaces[0] +
                ' ' +
                '&nbsp;'.repeat(spaces.length - 3) +
                spaces[spaces.length - 1]
        )
        // Turn end of line into a new line
        .replaceAll(regexLineEnd, '\n')
        // Add checkbox support
        .replaceAll(
            regexCheckbox,
            '<div class="check-item"><input type="checkbox">$1</div>'
        );
    return md;
};

export const toValues = (md: string): Record<string, string> => {
    const regexH = /^## .*$/gm;
    const regexH3 = /^###.*$/gm;
    const regexMargins = /(^\s*)|(\s*$)/g;

    const headersWithPrefix = md.match(regexH);
    if (!headersWithPrefix || headersWithPrefix.length === 0) return {};
    const headers = headersWithPrefix.map((str) =>
        str.substring(5, str.length - 2)
    );
    const brokenText = md.split(regexH);
    if (brokenText.length === 0) return {};

    const values = brokenText
        .slice(1)
        .map((str) => str.replace(regexH3, '').replace(regexMargins, ''));

    return values.reduce(
        (acc, val, i) => ({
            ...acc,
            [headers[i]]: val,
        }),
        {}
    );
};

export const replaceVariables = (
    md: string,
    vals: Record<string, string>
): string => {
    const regexVar = /{{\S+}}/g;
    const vars = md.match(regexVar);
    if (!vars || vars.length === 0) return md;

    let revisedMd = md;
    vars.forEach((v) => {
        const vName = v.substring(2, v.length - 2);
        if (vals[vName]) {
            revisedMd = revisedMd.replace(
                new RegExp(v),
                `<span class="inserted-text">${vals[vName]}</span>`
            );
        }
    });
    return revisedMd;
};

const regexSentenceEnd = /([.?!-]) ([A-Z])/g;

const removeSpacing = (md: string): string => {
    const regexSpacing = /(^\s+)|(\s+$)/g;
    return md.replaceAll(regexSpacing, '');
};

export const toSentenceSet = (md: string): Set<string> => {
    const revisedMd = md.replaceAll(regexSentenceEnd, '$1\n$2');
    const sentences = revisedMd.split('\n').map((s) => removeSpacing(s));

    return new Set(sentences);
};

export const highlightNew = (md: string, old: Set<string>): string => {
    const regexClosingSpan = /(\s+)<\/span>/g;
    const delimiter = '\\sentenceend\\';
    const delimitedMd = md
        .replaceAll(regexSentenceEnd, `$1 ${delimiter}$2`)
        .replaceAll('\n', `${delimiter}\n${delimiter}`);

    const segments = delimitedMd.split(delimiter);

    return segments
        .map((sentence) =>
            old.has(removeSpacing(sentence)) ||
            sentence === '\n' ||
            sentence === '- ' ||
            sentence[0] === '#'
                ? sentence
                : `<span class="new-text">${sentence}</span>`
        )
        .join('')
        .replaceAll(regexClosingSpan, '</span>$1');
};
