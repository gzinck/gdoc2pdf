#!/usr/bin/env node

const { program } = require("commander");
const pkg = require("../package.json");
import { authorize, getDoc } from "./docs";
const clear = require("clear");
const figlet = require("figlet");
const chalk = require("chalk");
import { OAuth2Client } from "googleapis-common";
import { askDocs, Request } from "./inquirer";
import { toMarkdown, toValues, replaceVariables } from "./mdParser";
import { writeFile } from "./fs";
import { convertToPdf } from "./pdfConverter";
import { combineLatest, from, of } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";

program.version(pkg.version);
program
    .usage("[options]")
    .option("-f, --file <Google Docs URL>", "the file to convert to PDF")
    .option(
        "-v, --values <Google Docs URL>",
        "values to insert into the document, formatted with {{VARIABLE}} followed by the text"
    )
    .option("-o, --output <Path to PDF or MD File>")
    .option("-s, --strikes <yes|no>", "whether to include strikethrough text");

program.parse(process.argv);

clear();

// Display a pretty intro screen
console.log(chalk.yellow(figlet.textSync("gdoc2pdf")));
console.log();

const options = program.opts();

askDocs(options)
    .pipe(
        // Get the documents requested
        mergeMap((opts: Request) =>
            authorize().pipe(
                mergeMap((client: OAuth2Client) =>
                    combineLatest([
                        getDoc(opts.file, client),
                        ...(opts.values ? [getDoc(opts.values, client)] : [])
                    ])
                ),
                mergeMap((docs: {}[]) => {
                    let result = "";
                    if (docs.length === 2) {
                        const md = toMarkdown(docs[0], opts.strikes === "yes");
                        const vals = toValues(toMarkdown(docs[1]));
                        result = replaceVariables(md, vals);
                    } else {
                        result = toMarkdown(docs[0], opts.strikes === "yes");
                    }
                    return of(result);
                }),
                mergeMap((result: string) => {
                    if ((opts.output.match(/pdf$/g) || []).length > 0) {
                        // Convert to PDF
                        return convertToPdf(result);
                    }
                    return of(result);
                }),
                mergeMap(result => writeFile(opts.output, result))
            )
        )
    )
    .subscribe({
        complete: () => console.log(chalk.yellow("File converted and saved!"))
    });
