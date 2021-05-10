# gdoc2pdf

## Installation

Before installing, you'll need credentials to run the application in a specific
folder on your computer:

```
<HOME_DIRECTORY>/.config/gdoc2pdf/credentials.json
```

To obtain this file, use the instructions [from Google](https://developers.google.com/workspace/guides/create-credentials)
and create credentials for a desktop app. Once downloaded, copy them in the appropriate folder:

```
mkdir -p ~/.config/gdoc2pdf/credentials.json
mv ~/Downloads/client_secret_<STUFF>_apps.googleusercontent.com.json ~/.config/gdoc2pdf/credentials.json
```

Make sure that `localhost` is not in the list of redirect_uris, but something like `urn:ietf:wg:oauth:2.0:oob` is in there. **Neglecting to do this may cause the script to crash.**

Now, install and run!

```
npm install
npm run build
npm link
gdoc2pdf
```
