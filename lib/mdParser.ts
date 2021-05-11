const { writers, parseDocument } = require("google-docs-converter");

export const toMarkdown = (doc: any): string => {
    return parseDocument(doc.data, new writers.MarkdownWriter());
};

export const toValues = (md: string): Record<string, string> => {
    const regexH = /^## .*$/gm;
    const regexH3 = /^###.*$/gm;
    const regexMargins = /(^\s*)|(\s*$)/g;

    const headersWithPrefix = md.match(regexH);
    if (!headersWithPrefix || headersWithPrefix.length === 0) return {};
    const headers = headersWithPrefix.map(str =>
        str.substring(5, str.length - 2)
    );
    const brokenText = md.split(regexH);
    if (brokenText.length === 0) return {};

    const values = brokenText
        .slice(1)
        .map(str => str.replace(regexH3, "").replace(regexMargins, ""));

    return values.reduce(
        (acc, val, i) => ({
            ...acc,
            [headers[i]]: val
        }),
        {}
    );
};

export const replaceVariables = (
    md: string,
    vals: Record<string, string>
): string => {
    const regexVar = /{{.*}}/g;
    const vars = md.match(regexVar);
    let revisedMd = md;
    vars.forEach(v => {
        const vName = v.substring(2, v.length - 2);
        if (vals[vName]) {
            revisedMd = revisedMd.replace(new RegExp(v), vals[vName]);
        }
    });
    return revisedMd;
};
