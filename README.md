# gdoc2pdf

Tool for converting Google Docs to PDF via Markdown. Along the way, it allows
replacing variables in the document (indicated by `{{VARIABLE_NAME}}`) with
values from another Google Doc.

![Demo gif](https://github.com/gzinck/gdoc2pdf/blob/main/demo.gif)

## Installation

First, make sure you have a **recent version of `node` installed**. It works on
node `v15.0.1` but may not work on older versions.

Before installing, you'll need credentials to run the application. These
credentials need to be stored in the file `~/.config/gdoc2pdf/credentials.json`.

To obtain this file, use the instructions
[from Google](https://developers.google.com/workspace/guides/create-credentials)
and create credentials for a desktop app. Once downloaded, copy them in the
appropriate folder:

```
mkdir -p ~/.config/gdoc2pdf
mv ~/Downloads/client_secret_<STUFF>_apps.googleusercontent.com.json ~/.config/gdoc2pdf/credentials.json
```

Make sure that the first redirect_uri in the file is something like
`urn:ietf:wg:oauth:2.0:oob`.

Now, install and run!

```
npm install
npm run build
npm link
gdoc2pdf
```

Note that on the first run, it will ask for authorization on Google Drive's API.
This will happen once every 7 days.

## Converting to PDF or Markdown

To convert a Google Doc to PDF or Markdown, you can do this out of the box by
running `gdoc2pdf`. Then, when the interface prompts you for the google doc
file, input the Google Doc URL. Input the output file you want to create at the
prompt. For everything else, use the default settings.

To do this quickly, you can set the flags:

```
gdoc2pdf -f <GOOGLE_DOC_URL> -o output.pdf
```

## Adding in variables

To use variables, in the document, write `{{VARIABLE_NAME}}` wherever you want a
variable piece of text.

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

In this secondary doc, you should set the headings `Heading 2` and `Heading 3`
for your variable names. That is, do not actually write `##`, set the heading
level in Google Docs instead.

Now, use the URL of the secondary doc when prompted with "What file has values
for variables in the doc?"

To do this quickly, you can set the flags:

```
gdoc2pdf -f <GOOGLE_DOC_URL> -v <SECONDARY_GOOGLE_DOC_URL> -o output.pdf
```

## Showing changes compared to a template doc

To highlight every sentence not present in a separate document (for instance, a
template document), you simply need to set the flag `-t`.

```
gdoc2pdf -f <GOOGLE_DOC_URL> -t <SECONDARY_GOOGLE_DOC_URL> -o output.pdf
```

## All flags

Note that if required flags are not included, the GUI will display for choosing
options.

| Flag | Description                                                         | Default     | Required |
| ---- | ------------------------------------------------------------------- | ----------- | -------- |
| `-f` | The URL of the Google Doc to convert                                | N/A         | Yes      |
| `-o` | The path to the output `.pdf` or `.md` file                         | N/A         | Yes      |
| `-v` | The URL of a Google Doc with variables to insert in the document    | `'none'`    | No       |
| `-t` | The URL of a Google Doc which has template phrases not to highlight | `'none'`    | No       |
| `-c` | A custom `.css` stylesheet for the output PDF.                      | `'default'` | No       |
| `-s` | Whether to include strikethrough text                               | `'no'`      | No       |

## Support notes

-   Does not support tables
-   Does not support images
-   The conversion strips out all formatting except bold, italic, heading,
    strikethroughs, and lists.
-   Only one line will ever be placed between two lines of text. To add more
    lines, enter a new line with only a single space.
