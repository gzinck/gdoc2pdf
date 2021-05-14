import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { mdToPdf } from 'md-to-pdf';

export const convertToPdf = (content: string): Observable<Buffer> =>
    from(mdToPdf({ content })).pipe(map(({ content }) => content));
