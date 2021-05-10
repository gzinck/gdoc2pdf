#!/usr/bin/env node

const { writers, parseDocument } = require("google-docs-converter");
const { program } = require("commander");
const pkg = require("../package.json");
import { authorize, getDoc } from "./docs";
const clear = require("clear");
const figlet = require("figlet");
const chalk = require("chalk");
import { askDocs, DocsRequested } from "./inquirer";
import { combineLatest, from } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";

program.version(pkg.version);
program
    .usage("[options]")
    .option("-f, --file <Google Docs URL>", "the file to convert to PDF")
    .option(
        "-v, --values <Google Docs URL>",
        "values to insert into the document, formatted with {{VARIABLE}} followed by the text"
    )
    .option(
        "-i, --interactive <true|false>",
        "interactively ask for the required information",
        "true"
    );

program.parse(process.argv);

clear();

// Display a pretty intro screen
console.log(chalk.yellow(figlet.textSync("gdoc2pdf")));
console.log();

// If asked to go interactive, make the requests
const options = program.opts();

askDocs(options).subscribe((opts: DocsRequested) => {
    authorize()
        .pipe(
            mergeMap(client =>
                combineLatest([
                    getDoc(opts.file, client),
                    ...(opts.values ? [getDoc(opts.values, client)] : [])
                ])
            )
        )
        .subscribe(next => {
            console.log(next);
        });
});
