import { Observable } from 'rxjs';
import ffs from 'fs';

export const readFile = (name: string): Observable<string> => {
    return new Observable<string>((sub) => {
        ffs.readFile(name, 'utf8', (err, content) => {
            if (err) sub.error(err);
            else sub.next(content);
            sub.complete();
        });
    });
};

export const writeFile = (
    name: string,
    contents: string | Buffer
): Observable<never> => {
    return new Observable<never>((sub) => {
        ffs.writeFile(name, contents, 'utf8', (err) => {
            if (err) sub.error(err);
            sub.complete();
        });
    });
};
