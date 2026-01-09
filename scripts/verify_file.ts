import * as fs from 'fs';
import * as path from 'path';
import Parser = require('tree-sitter');

// In strict TypeScript inside the repo, loading the local binding might need a relative path or require.
// We use require to avoid TS resolution issues with the root package.json not being built/linked yet in some contexts.
const GosuTemplate = require('../');

const fileName = process.argv[2];
if (!fileName) {
    console.error("Usage: npm run verify <path-to-file>");
    process.exit(1);
}

// Resolve relative path from CWD
const resolvedPath = path.resolve(process.cwd(), fileName);

if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
}

try {
    const parser = new Parser();
    parser.setLanguage(GosuTemplate);

    const sourceCode = fs.readFileSync(resolvedPath, 'utf8');
    const tree = parser.parse(sourceCode);

    // Check for errors
    let hasError = false;
    const cursor = tree.walk();

    function checkNode() {
        if (cursor.nodeType === 'ERROR' || cursor.nodeType === 'MISSING') {
            hasError = true;
            const start = cursor.startPosition;
            const end = cursor.endPosition;
            console.error(`FAIL: Found ${cursor.nodeType} at [${start.row + 1}:${start.column + 1}]-[${end.row + 1}:${end.column + 1}]`);
            console.error(`Code: "${cursor.nodeText}"`);
        }

        if (cursor.gotoFirstChild()) {
            do {
                checkNode();
            } while (cursor.gotoNextSibling());
            cursor.gotoParent();
        }
    }

    checkNode();

    if (!hasError) {
        console.log("Status: SUCCESS");
        console.log(`Successfully parsed ${fileName}`);
        console.log("Root node:", tree.rootNode.toString());
    } else {
        console.log("Status: FAILED (Partial Parse)");
        console.log("Root node:", tree.rootNode.toString());
        process.exit(1);
    }

} catch (e) {
    console.error("Exception:", e);
    process.exit(1);
}
