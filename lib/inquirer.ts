const inquirer = require("inquirer");
import { Observable, from } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
const open = require("open");
import { docIdRegex } from "./constants";

export interface DocsRequested {
    file: string;
    values: string | null;
}

export const askDocs = (
    docs: Partial<DocsRequested>
): Observable<DocsRequested> => {
    const questions = [
        {
            name: "file",
            type: "input",
            message: "What file do want to convert to PDF?",
            default: docs.file,
            validate: (val: string) => {
                return (
                    (val.match(docIdRegex) || []).length >= 2 ||
                    "Please enter a valid Google Docs URL"
                );
            }
        },
        {
            name: "values",
            type: "input",
            message: "What file has values for variables in the PDF?",
            default: docs.values || "none",
            validate: (val: string) => {
                return (
                    val === "none" ||
                    (val.match(docIdRegex) || []).length >= 2 ||
                    "Please enter 'none' or a valid Google Docs URL"
                );
            }
        }
    ];
    return from(inquirer.prompt(questions) as Promise<DocsRequested>).pipe(
        map((docs: DocsRequested) => ({
            ...docs,
            values: docs.values === "none" ? null : docs.values
        }))
    );
};

export interface GoogleCode {
    code: string;
}

export const askGoogleCode = (url: string): Observable<GoogleCode> => {
    const questions = [
        {
            name: "code",
            type: "input",
            message: `Authorize this app in the newly opened browser tab (or open the URL above). Copy the code provided and paste it here.`,
            validate: (val: string) => !!val.length
        }
    ];
    return from(open(url)).pipe(
        mergeMap(() => inquirer.prompt(questions) as Promise<GoogleCode>)
    );
};
