const inquirer = require("inquirer");
import { Observable, from } from "rxjs";
import { mergeMap } from "rxjs/operators";
const open = require("open");

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
    // console.log(
    //     "Opening the following URL. If it does not appear, copy and paste it into your browser:",
    //     url
    // );
    return from(open(url)).pipe(
        mergeMap(() => inquirer.prompt(questions) as Promise<GoogleCode>)
    );
};
