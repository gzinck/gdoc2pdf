import { Observable } from "rxjs";
const ffs = require("fs");

export const readFile = (name: string): Observable<string> => {
    return new Observable<string>(sub => {
        ffs.readFile(name, (err, content) => {
            if (err) sub.error(err);
            else sub.next(content);
            sub.complete();
        });
    });
};

export const writeFile = (name: string, contents: any): Observable<never> => {
    return new Observable<never>(sub => {
        ffs.writeFile(name, contents, err => {
            if (err) sub.error(err);
            sub.complete();
        });
    });
};
