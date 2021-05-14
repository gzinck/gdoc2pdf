import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { mdToPdf } from 'md-to-pdf';
import { resolve } from 'path';

const appDir = resolve(__dirname);
const marginSize = '2.5cm';

export const convertToPdf = (
    content: string,
    stylesheet?: string
): Observable<Buffer> =>
    from(
        mdToPdf(
            { content },
            {
                stylesheet: [
                    stylesheet || `${appDir}/../src/styles/with-highlights.css`,
                ],
                pdf_options: {
                    margin: {
                        top: marginSize,
                        bottom: marginSize,
                        left: marginSize,
                        right: marginSize,
                    },
                },
            }
        )
    ).pipe(map(({ content }) => content));
