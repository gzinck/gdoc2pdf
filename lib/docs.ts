const gdocs = require("@googleapis/docs");
import { OAuth2Client } from "googleapis-common";
import * as ffs from "./fs";
const homeDir = require("os").homedir();
import { Observable, of, concat } from "rxjs";
import { map, mergeMap, catchError, tap } from "rxjs/operators";
import * as inquirer from "./inquirer";

interface Credentials {
    installed: {
        client_secret: string;
        redirect_uris: string[];
        client_id: string;
    };
}

interface Token {}

const CRED_PATH = `${homeDir}/.config/gdoc2pdf/credentials.json`;
const TOKEN_PATH = `${homeDir}/.config/gdoc2pdf/token.json`;
const SCOPES = ["https://www.googleapis.com/auth/documents.readonly"];

// May throw error with .code = 'ENOENT'
const getCredentialsFromDisk = (): Observable<Credentials> => {
    return ffs
        .readFile(CRED_PATH)
        .pipe(map((creds: string) => JSON.parse(creds)));
};

const generateNewToken = (client: OAuth2Client): Observable<Token> => {
    const url = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    });

    return inquirer.askGoogleCode(url).pipe(
        map((res: inquirer.GoogleCode) => res.code),
        mergeMap((code: string) => client.getToken(code)),
        // Once we have the token, write it for future use
        mergeMap((token: Token) =>
            concat(ffs.writeFile(TOKEN_PATH, token), of(token))
        )
    );
};

const getToken = (client: OAuth2Client): Observable<Token> => {
    return ffs.readFile(TOKEN_PATH).pipe(
        map((creds: string) => JSON.parse(creds)),
        catchError(() => generateNewToken(client))
    );
};

const getClient = (creds: Credentials): Observable<OAuth2Client> => {
    const { client_id, client_secret, redirect_uris } = creds.installed;
    const client = new gdocs.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris
    );

    return getToken(client).pipe(
        tap(token => client.setCredentials(token)),
        map(() => client)
    );
};

export const authorize = () => {
    return getCredentialsFromDisk().pipe(
        mergeMap((creds: Credentials) => getClient(creds))
    );
};
