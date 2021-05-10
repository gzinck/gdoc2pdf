import { Observable } from "rxjs";
const ffs = require("fs");

const readFile = (name: string): Observable<string> => {
    return new Observable<string>(sub => {
        ffs.readFile(name, (err, content) => {
            if (err) sub.error(err);
            else sub.next(content);
            sub.complete();
        });
    });
};

const writeFile = (name: string, contents: {}): Observable<never> => {
    return new Observable<never>(sub => {
        ffs.writeFile(name, JSON.stringify(contents), err => {
            if (err) sub.error(err);
            sub.complete();
        });
    });
};

export {
    readFile,
    writeFile
};
