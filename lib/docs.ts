const gdocs = require("@googleapis/docs");
import { OAuth2Client } from "googleapis-common";
import * as ffs from "./fs";
const homeDir = require("os").homedir();
import { EMPTY, Observable, of, from, concat } from "rxjs";
import { map, mergeMap, catchError, tap } from "rxjs/operators";
import * as inquirer from "./inquirer";
import { docIdRegex } from "./constants";

interface Credentials {
    installed: {
        client_secret: string;
        redirect_uris: string[];
        client_id: string;
    };
}

interface Tokens {
    expiry_date: number;
}

interface TokenResponse {
    tokens: Tokens;
}

const CRED_PATH = `${homeDir}/.config/gdoc2pdf/credentials.json`;
const TOKEN_PATH = `${homeDir}/.config/gdoc2pdf/token.json`;
const SCOPES = ["https://www.googleapis.com/auth/documents.readonly"];

//***********************
//     Credentials
//***********************

// May throw error with .code = 'ENOENT'
const getCredentialsFromDisk = (): Observable<Credentials> => {
    return ffs
        .readFile(CRED_PATH)
        .pipe(map((creds: string) => JSON.parse(creds)));
};

const generateNewToken = (client: OAuth2Client): Observable<Tokens> => {
    const url = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    });

    return inquirer.askGoogleCode(url).pipe(
        map((res: inquirer.GoogleCode) => res.code),
        mergeMap(
            (code: string) => client.getToken(code) as Promise<TokenResponse>
        ),
        map((res: TokenResponse) => res.tokens),
        // Once we have the token, write it for future use
        mergeMap((tokens: Tokens) =>
            concat(ffs.writeFile(TOKEN_PATH, JSON.stringify(tokens)), of(tokens))
        )
    );
};

const getToken = (client: OAuth2Client): Observable<Tokens> => {
    return ffs.readFile(TOKEN_PATH).pipe(
        map((creds: string) => JSON.parse(creds)),
        tap((creds: Tokens) => {
            if (creds.expiry_date - Date.now() < 0) throw "Token expired";
        }),
        catchError(() => generateNewToken(client))
    );
};

const getClient = (creds: Credentials): Observable<OAuth2Client> => {
    const { client_id, client_secret, redirect_uris } = creds.installed;
    const client = new gdocs.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    return getToken(client).pipe(
        map(token => {
            client.setCredentials(token);
            return client;
        })
    );
};

export const authorize = () => {
    return getCredentialsFromDisk().pipe(
        mergeMap((creds: Credentials) => getClient(creds))
    );
};

//***********************
//     Opening docs
//***********************
export const getDoc = (url: string, client: OAuth2Client): Observable<{}> => {
    const matches = url.match(docIdRegex);
    if (matches.length < 2) throw `Error: could not find document id in ${url}`;
    const documentId = matches[1];
    const docs = gdocs.docs({
        version: "v1",
        auth: client
    });
    return from(docs.documents.get({ documentId })).pipe(
        catchError(err => {
            console.log("Error in docs API:", err);
            return EMPTY;
        })
    );
};
