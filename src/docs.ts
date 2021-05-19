import { google, docs_v1 } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { deleteFile, readFile, writeFile } from './fs';
import { homedir } from 'os';
import { EMPTY, Observable, of, from, concat } from 'rxjs';
import { GaxiosError } from 'gaxios';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { askGoogleCode, GoogleCode } from './inquirer';
import { docIdRegex } from './constants';

const homeDir = homedir();

interface AppCreds {
    installed: {
        client_secret: string;
        redirect_uris: string[];
        client_id: string;
    };
}

const CRED_PATH = `${homeDir}/.config/gdoc2pdf/credentials.json`;
const TOKEN_PATH = `${homeDir}/.config/gdoc2pdf/token.json`;
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

//***********************
//     Credentials
//***********************

// May throw error with .code = 'ENOENT'
const getCredentialsFromDisk = (): Observable<AppCreds> => {
    return readFile(CRED_PATH).pipe(map((creds: string) => JSON.parse(creds)));
};

const generateNewToken = (client: OAuth2Client): Observable<Credentials> => {
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    return askGoogleCode(url).pipe(
        map((res: GoogleCode) => res.code),
        mergeMap((code: string) => client.getToken(code)),
        map((res) => res.tokens),
        // Once we have the token, write it for future use
        mergeMap((tokens) =>
            concat(writeFile(TOKEN_PATH, JSON.stringify(tokens)), of(tokens))
        )
    );
};

const getTokenFromDisk = (): Observable<Credentials> => {
    return readFile(TOKEN_PATH).pipe(
        map((creds) => JSON.parse(creds)),
        map(({ refresh_token }) => ({ refresh_token }))
    );
};

const getClient = (creds: AppCreds): Observable<OAuth2Client> => {
    const { client_id, client_secret, redirect_uris } = creds.installed;
    const client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    return getTokenFromDisk().pipe(
        map((token) => {
            client.setCredentials(token);
            return client;
        }),
        catchError(() =>
            generateNewToken(client).pipe(
                map((token) => {
                    client.setCredentials(token);
                    return client;
                })
            )
        )
    );
};

const authorize = (): Observable<OAuth2Client> => {
    return getCredentialsFromDisk().pipe(
        mergeMap((creds: AppCreds) => getClient(creds))
    );
};

// rxjs operator to get a doc from a client
const getDocWithClient = (documentId: string) =>
    mergeMap((client: OAuth2Client) => {
        const gdocs = google.docs({
            version: 'v1',
            auth: client,
        });
        return gdocs.documents.get({ documentId });
    });

//***********************
//     Opening docs
//***********************
export const getDoc = (url: string): Observable<docs_v1.Schema$Document> => {
    const matches = url.match(docIdRegex);
    if (!matches || matches.length < 2)
        throw `Error: could not find document id in ${url}`;
    const documentId = matches[1];
    return authorize().pipe(
        getDocWithClient(documentId),
        catchError((err: GaxiosError) => {
            if (err.response && err.response.data.error === 'invalid_grant') {
                // Clear out the client credentials
                console.log('Requesting a new token since old one expired...');
                return deleteFile(TOKEN_PATH).pipe(
                    mergeMap(() => authorize()),
                    getDocWithClient(documentId)
                );
            } else throw err;
        }),
        map(({ data }) => data)
    );
};
