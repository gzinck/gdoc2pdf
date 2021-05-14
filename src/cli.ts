#!/usr/bin/env node

import { program } from 'commander';
import { authorize, getDoc } from './docs';
import clear from 'clear';
import figlet from 'figlet';
import chalk from 'chalk';
import { OAuth2Client } from 'google-auth-library';
import { getSettings, Settings } from './inquirer';
import { toMarkdown, toValues, replaceVariables } from './mdParser';
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
            authorize().pipe(
                mergeMap((client: OAuth2Client) =>
                    combineLatest([
                        getDoc(opts.file, client),
                        ...(opts.values ? [getDoc(opts.values, client)] : []),
                    ])
                ),
                mergeMap((docs) => {
                    let result: string;
                    if (docs.length === 2) {
                        const md = toMarkdown(docs[0], opts.strikes);
                        const vals = toValues(toMarkdown(docs[1]));
                        result = replaceVariables(md, vals);
                    } else {
                        result = toMarkdown(docs[0], opts.strikes);
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
