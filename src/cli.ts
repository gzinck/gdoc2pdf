#!/usr/bin/env node

import { program } from 'commander';
import { getDoc } from './docs';
import clear from 'clear';
import figlet from 'figlet';
import chalk from 'chalk';
import { OAuth2Client } from 'google-auth-library';
import { getSettings, Settings } from './inquirer';
import {
    toMarkdown,
    toValues,
    replaceVariables,
    toSentenceSet,
    highlightNew,
} from './mdParser';
import { writeFile } from './fs';
import { convertToPdf } from './pdfConverter';
import { combineLatest, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

program
    .usage('[options]')
    .option('-f, --file <Google Docs URL>', 'the file to convert to PDF')
    .option(
        '-v, --values <Google Docs URL>',
        'values to insert into the document, formatted with {{VARIABLE}} followed by the text'
    )
    .option(
        '-t, --template <Google Docs URL>',
        'template Google Doc with text not to highlight'
    )
    .option('-o, --output <Path to PDF or MD File>')
    .option(
        '-c, --stylesheet <default|path_to_css_file>',
        'the css stylesheet for the PDF'
    )
    .option('-s, --strikes <yes|no>', 'whether to include strikethrough text');

program.parse(process.argv);

clear();

// Display a pretty intro screen
console.log(chalk.yellow(figlet.textSync('gdoc2pdf')));
console.log();

const options = program.opts();

getSettings(options)
    .pipe(
        // Get the documents requested
        mergeMap((opts: Settings) =>
            getDoc(opts.file).pipe(
                // Get the first file to make sure credentials are OK, then go ahead with the others
                mergeMap((file) => {
                    return combineLatest([
                        of(file),
                        opts.values ? getDoc(opts.values) : of(undefined),
                        opts.template ? getDoc(opts.template) : of(undefined),
                    ]);
                }),
                mergeMap(([file, values, template]) => {
                    let result = toMarkdown(file, opts.strikes);
                    if (template) {
                        const sentenceSet = toSentenceSet(toMarkdown(template));
                        result = highlightNew(result, sentenceSet);
                    }

                    if (values) {
                        const vals = toValues(toMarkdown(values));
                        result = replaceVariables(result, vals);
                    }

                    return of(result);
                }),
                mergeMap((result: string) => {
                    if ((opts.output.match(/pdf$/g) || []).length > 0) {
                        // Convert to PDF
                        return convertToPdf(result, opts.stylesheet);
                    }
                    return of(result);
                }),
                mergeMap((result) => writeFile(opts.output, result))
            )
        )
    )
    .subscribe({
        complete: () => console.log(chalk.yellow('File converted and saved!')),
    });
