import inquirer from 'inquirer';
import { Observable, from, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import open from 'open';
import { docIdRegex, outfileRegex } from './constants';

interface FlagValues {
    file: string;
    values: string;
    template: string;
    output: string;
    strikes: string;
    stylesheet: string;
}

export interface Settings {
    file: string;
    values?: string;
    template?: string;
    output: string;
    stylesheet?: string;
    strikes?: boolean;
}

export const getSettings = (
    vals: Partial<FlagValues>
): Observable<Settings> => {
    const questions = [
        {
            name: 'file',
            type: 'input',
            message: 'What file do want to convert?',
            when: () => !vals.file,
            default: vals.file,
            validate: (val: string) => {
                return (
                    (val.match(docIdRegex) || []).length >= 2 ||
                    'Please enter a valid Google vals URL'
                );
            },
        },
        {
            name: 'values',
            type: 'input',
            message: 'What file has values for variables in the doc?',
            when: () => !vals.values,
            default: 'none',
            validate: (val: string) => {
                return (
                    val === 'none' ||
                    (val.match(docIdRegex) || []).length >= 2 ||
                    "Please enter 'none' or a valid Google vals URL"
                );
            },
        },
        {
            name: 'template',
            type: 'input',
            message: 'What file has the template doc?',
            when: () => !vals.template,
            default: 'none',
            validate: (val: string) => {
                return (
                    val === 'none' ||
                    (val.match(docIdRegex) || []).length >= 2 ||
                    "Please enter 'none' or a valid Google vals URL"
                );
            },
        },
        {
            name: 'output',
            type: 'input',
            message:
                'What is the local path for the output file (.pdf or .md)?',
            when: () => !vals.output,
            default: 'output.pdf',
            validate: (val: string) => {
                return (
                    (val.match(outfileRegex) || []).length > 0 ||
                    'Please enter a valid path ending with .pdf or .md'
                );
            },
        },
        {
            name: 'stylesheet',
            type: 'input',
            message: 'What stylesheet do you want to use (.css)?',
            when: () => vals.stylesheet === undefined,
            default: 'default',
            validate: (val: string) => {
                return (
                    (val.match(/\.css$/g) || []).length > 0 ||
                    val === 'default' ||
                    'Please enter a valid path ending with .pdf or .md'
                );
            },
        },
        {
            name: 'strikes',
            type: 'list',
            message: 'Do you want strikethrough text to be visible?',
            when: () => vals.strikes === undefined,
            default: 'no',
            choices: ['yes', 'no'],
        },
    ];

    // Only show prompts if we're missing the file and output
    const answers$ =
        vals.file && vals.output
            ? of(vals as FlagValues)
            : from(inquirer.prompt(questions) as Promise<FlagValues>);

    return answers$.pipe(
        map((valsSelected: FlagValues) => {
            const values = vals.values || valsSelected.values;
            const template = vals.template || valsSelected.template;
            const stylesheet = vals.stylesheet || valsSelected.stylesheet;
            return {
                file: vals.file || valsSelected.file,
                values: values === 'none' ? undefined : values,
                template: template === 'none' ? undefined : template,
                output: vals.output || valsSelected.output,
                stylesheet: stylesheet === 'default' ? undefined : stylesheet,
                strikes: (vals.strikes || valsSelected.strikes) === 'yes',
            };
        })
    );
};

export interface GoogleCode {
    code: string;
}

export const askGoogleCode = (url: string): Observable<GoogleCode> => {
    const questions = [
        {
            name: 'code',
            type: 'input',
            message: `Authorize this app in the newly opened browser tab (or open the URL above). Copy the code provided and paste it here.`,
            validate: (val: string) => !!val.length,
        },
    ];
    return from(open(url)).pipe(
        mergeMap(() => inquirer.prompt(questions) as Promise<GoogleCode>)
    );
};
