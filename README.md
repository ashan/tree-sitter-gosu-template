# tree-sitter-gosu-template

A [Tree-sitter](https://tree-sitter.github.io/) grammar for **Gosu Template (*.gst)** files.

This grammar parses the structure of Gosu templates, identifying:
-   **Directives**: `<%@ params(...) %>`, `<%@ extends ... %>`
-   **Scriptlets**: `<% ... %>`
-   **Expressions**: `<%= ... %>`
-   **Template Content**: Arbitrary text content between tags.

It relies on injection to delegate the parsing of Gosu code within tags to [tree-sitter-gosu](https://github.com/lazamar/tree-sitter-gosu).

## Installation

```bash
npm install
```

## Build

To build the parser (C code and WASM):

```bash
npm run build
npm run prestart # Build WASM
```

## Testing

Run the standard Tree-sitter tests (corpus tests):

```bash
npm test
```

## Bulk Analysis

This project includes a robust bulk analysis tool to verify the parser against a large set of sample files (e.g., in `gsrc`).

To analyze a directory:

```bash
npm run analyze ./path/to/gsrc
```

## Single File Verification

To verify a single `.gst` file using the correct grammar binding:

```bash
npm run verify path/to/file.gst
```

> [!NOTE]
> **Why strict verification?**
> You may find that running `tree-sitter parse file.gst` CLI command fails or reports many errors. This is often because the CLI environment may incorrectly select the standard `gosu` grammar instead of `gosu-template`. 
> The `npm run verify` and `npm run analyze` scripts use the local Node.js binding to ensure the correct grammar is loaded.

## Node.js Usage

To use the parser in your Node.js application:

```javascript
const Parser = require('tree-sitter');
const GosuTemplate = require('tree-sitter-gosu-template');

const parser = new Parser();
parser.setLanguage(GosuTemplate);

const sourceCode = '<% print("Hello World") %>';
const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
```

## Project Structure

-   `grammar.js`: The Tree-sitter grammar definition.
-   `src/scanner.c`: External scanner for handling template content.
-   `queries/injections.scm`: Injection rules to map tags to the Gosu grammar.
-   `scripts/analyze_failures.ts`: The bulk analysis script.
-   `scripts/verify_file.ts`: Single file verification script.
-   `test/corpus/`: Test cases.
