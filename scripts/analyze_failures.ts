import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

interface ErrorDetail {
    type: string;
    position: string; // "[row:col]-[row:col]" (1-based)
    text: string;
}

interface FileErrors {
    file: string;
    errors: ErrorDetail[];
}

interface Summary {
    totalFiles: number;
    successfulFiles: number;
    failedFilesCount: number;
    totalErrors: number;
    errorsByType: Record<string, number>;
    filesWithErrors: string[];
    successRate: string;
    parseTimeSeconds: number;
    filesPerSecond: number;
}

interface Report {
    timestamp: string;
    targetDir: string;
    summary: Summary;
    filesWithErrors: FileErrors[];
}

function getAllFiles(dir: string, extensions: string[], fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllFiles(filePath, extensions, fileList);
        } else {
            if (extensions.some(ext => filePath.endsWith(ext))) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

// Extract attributes from XML tag string




// Helper to extract errors from S-Expression tree in corpus file
function extractErrorsFromTree(tree: string): ErrorDetail[] {
    const found: ErrorDetail[] = [];
    // Simple regex to find (ERROR ...) or (MISSING ...)
    // Note: This is an approximation. A robust parser would be better, but regex suffices for simple reporting.
    // We look for "(ERROR" or "(MISSING"

    let pos = 0;
    while (pos < tree.length) {
        const errIdx = tree.indexOf('(ERROR', pos);
        const missIdx = tree.indexOf('(MISSING', pos);

        if (errIdx === -1 && missIdx === -1) break;

        const isError = (errIdx !== -1 && (missIdx === -1 || errIdx < missIdx));
        const startIdx = isError ? errIdx : missIdx;
        const type = isError ? 'ERROR' : 'MISSING';

        // Find matching closing parenthesis (simplistic)
        let balance = 1;
        let p = startIdx + (isError ? 6 : 8);
        while (p < tree.length && balance > 0) {
            if (tree[p] === '(') balance++;
            else if (tree[p] === ')') balance--;
            p++;
        }

        const text = tree.substring(startIdx, p);
        found.push({
            type: type,
            position: 'unknown', // corpus AST dumping doesn't include row/col in simple mode usually
            text: text.replace(/\s+/g, ' ')
        });

        pos = p;
    }

    return found;
}

// Function to process the generated corpus file
function analyzeCorpus(corpusPath: string): FileErrors[] {
    const results: FileErrors[] = [];
    if (!fs.existsSync(corpusPath)) return results;

    const content = fs.readFileSync(corpusPath, 'utf8');
    // Split by file headers:
    // ==================
    // File: path/to/file.gst
    // ==================

    const parts = content.split(/^={10,}\nFile: /m);

    for (const part of parts) {
        if (!part.trim()) continue;

        const firstLineEnd = part.indexOf('\n');
        const relativePath = part.substring(0, firstLineEnd).trim();

        // The rest is content + divider + AST
        // We look for the AST section starting with `(template` or `(source_file` or just the tree
        // The `tree-sitter test` update format usually puts the tree after the input.
        // Input ends with `---` then tree follows?
        // Actually `generate_bulk_corpus.ts` writes:
        // header... content ... \n---\n(template)\n\n
        // `test -u` replaces `(template)` with the actual tree.

        const separator = '\n---\n';
        const sepIdx = part.indexOf(separator);
        if (sepIdx === -1) continue;

        const treeSection = part.substring(sepIdx + separator.length);
        const errors = extractErrorsFromTree(treeSection);

        if (errors.length > 0) {
            results.push({
                file: relativePath,
                errors: errors
            });
        }
    }

    return results;
}

// Replaces analyzeBatch - effectively does nothing but we keep signature if needed, 
// but actually we will change main() to call analyzeCorpus instead of loop.


function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Error: No target directory provided.');
        console.error('Usage: ts-node scripts/analyze_failures.ts <path-to-source-code>');
        console.error('Example: ts-node scripts/analyze_failures.ts ./gsrc');
        process.exit(1);
    }

    const targetDirArg = args[0];
    const GSRC_DIR = path.resolve(process.cwd(), targetDirArg);

    if (!fs.existsSync(GSRC_DIR) || !fs.statSync(GSRC_DIR).isDirectory()) {
        console.error(`Error: Directory not found or invalid: ${GSRC_DIR}`);
        process.exit(1);
    }

    const startTime = Date.now();
    try {
        console.error(`Scanning ${GSRC_DIR} for .gst files...`);
        const files = getAllFiles(GSRC_DIR, ['.gst']);
        console.error(`Found ${files.length} files.`);

        const allFileErrors: FileErrors[] = [];
        const errorTypeCounts: Record<string, number> = {};

        // Generate corpus first
        const corpusFile = 'test/corpus/bulk_generated.txt';
        // Make sure directory exists
        const corpusDir = path.dirname(corpusFile);
        if (!fs.existsSync(corpusDir)) fs.mkdirSync(corpusDir, { recursive: true });

        console.log("Generating bulk corpus...");
        child_process.execSync(`./node_modules/.bin/ts-node scripts/generate_bulk_corpus.ts "${GSRC_DIR}" "${corpusFile}"`, { stdio: 'inherit' });

        console.log("Running tree-sitter test -u to capture parse trees...");
        try {
            child_process.execSync('tree-sitter test -u', { stdio: 'ignore' });
        } catch (e) {
            // ignore exit code 1 if it's just test failures (we analyze them next)
        }

        const fileErrors = analyzeCorpus(corpusFile);

        for (const res of fileErrors) {
            console.log(`FAIL: ${res.file}`);
            allFileErrors.push(res);
            for (const err of res.errors) {
                const key = err.type;
                errorTypeCounts[key] = (errorTypeCounts[key] || 0) + 1;
            }
        }


        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;

        const totalFiles = files.length;
        const failedFilesCount = allFileErrors.length;
        const successfulFiles = totalFiles - failedFilesCount;
        const totalErrors = allFileErrors.reduce((acc, f) => acc + f.errors.length, 0);

        const report: Report = {
            timestamp: new Date().toISOString(),
            targetDir: targetDirArg,
            summary: {
                totalFiles: totalFiles,
                successfulFiles: successfulFiles,
                failedFilesCount: failedFilesCount,
                totalErrors: totalErrors,
                errorsByType: errorTypeCounts,
                filesWithErrors: allFileErrors.map(f => f.file),
                successRate: totalFiles > 0 ? ((successfulFiles / totalFiles) * 100).toFixed(2) + '%' : '0.00%',
                parseTimeSeconds: durationSeconds,
                filesPerSecond: durationSeconds > 0 ? Math.round(totalFiles / durationSeconds) : 0
            },
            filesWithErrors: allFileErrors
        };

        fs.writeFileSync('analysis_report.json', JSON.stringify(report, null, 2));

        console.error('\nAnalysis Complete.');
        console.log(`Success: ${successfulFiles}`);
        console.log(`Failures: ${failedFilesCount}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.error(`Full report written to analysis_report.json`);

        if (failedFilesCount > 0) {
            process.exit(1);
        }

    } catch (e) {
        console.error('Fatal error in main:', e);
        process.exit(1);
    }
}

main();
