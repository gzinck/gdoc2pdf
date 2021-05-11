# gdoc2pdf

Tool for converting Google Docs to PDF via Markdown. Along the way, it
allows replacing variables in the document (indicated by
`{{VARIABLE_NAME}}`) with values from another Google Doc.

![Demo gif](https://github.com/gzinck/gdoc2pdf/blob/main/demo.gif)

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

Make sure that the first redirect_uri in the file is something like `urn:ietf:wg:oauth:2.0:oob`.

Now, install and run!

```
npm install
npm run build
npm link
gdoc2pdf
```

## Converting to PDF or Markdown

To convert a Google Doc to PDF or Markdown, you can do this out of the box by running `gdoc2pdf`.

1. At the prompt, input the URL of the google doc, like `https://docs.google.com/document/d/{{DOCUMENT_ID}}/edit`.
2. At the next prompt, simply hit enter.
3. Finally, type in the URL of the file to output.

To do this quickly, you can set the flags:

```
gdoc2pdf -f <GOOGLE_DOC_URL> -v none -o output.pdf
```

## Adding in variables

To use variables, in the document, write `{{VARIABLE_NAME}}` wherever you
want a variable piece of text.

Then, make a separate Google document with the corresponding values. The
document should have the following structure:

```
## {{VARIABLE NAME}}

Value for the variable.

It can have multiple lines with line breaks in between, but it will ignore
trailing whitespace.

## {{ANOTHER_VARIABLE_NAME}}

### Comments I don't want in the form as values

This is the value for this other variable
```

In this secondary doc, you should set the headings `Heading 2` and
`Heading 3` for your variable names. That is, do not actually write `##`,
set the heading level in Google Docs instead.

Now, use the URL of the secondary doc when prompted with "What file has values for variables in the doc?"

To do this quickly, you can set the flags:

```
gdoc2pdf -f <GOOGLE_DOC_URL> -v <SECONDARY_GOOGLE_DOC_URL> -o output.pdf
```
