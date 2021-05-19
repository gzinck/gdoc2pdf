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

export const deleteFile = (name: string): Observable<boolean> => {
    return new Observable<boolean>((sub) => {
        ffs.unlink(name, (err) => {
            if (err) {
                sub.error(err);
                sub.next(false);
            } else sub.next(true);
            sub.complete();
        });
    });
};
