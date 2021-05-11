import { from, Observable } from "rxjs";
import { map } from "rxjs/operators";
const { mdToPdf } = require("md-to-pdf");

export const convertToPdf = (content: string): Observable<string> =>
    from(mdToPdf({ content })).pipe(
        map(({ content }: { content: any }) => content)
    );
