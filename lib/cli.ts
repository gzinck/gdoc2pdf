#!/usr/bin/env node

const { writers, parser } = require("google-docs-converter");
const { program } = require("commander");
const pkg = require("../package.json");
import { authorize } from './docs';
const clear = require("clear");
const figlet = require('figlet');
const chalk = require('chalk');

program.version(pkg.version);
program
    .usage('[options] <Google Docs URL>')
    .option('-v, --values <Google Docs URL>',
        'Values to insert into the document, formatted with {{VARIABLE}} followed by the text');

program.parse(process.argv);

clear();

// Display a pretty intro screen
console.log(chalk.yellow(
    figlet.textSync('gdoc2pdf')
));
console.log();

authorize().subscribe({
    next: (creds) => console.log(creds),
    error: (err) => console.log('ERROR:', err)
});
