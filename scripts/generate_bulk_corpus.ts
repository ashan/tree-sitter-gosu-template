
import * as fs from 'fs';
import * as path from 'path';

function main() {
    const targetDir = process.argv[2];
    const output = process.argv[3];

    if (!targetDir || !output) {
        console.error('Usage: ts-node scripts/generate_bulk_corpus.ts <gsrc_dir> <output_file>');
        process.exit(1);
    }

    const fd = fs.openSync(output, 'w');

    function scanDir(dir: string) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (file.endsWith('.gst')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const relativePath = path.relative(process.cwd(), fullPath);

                fs.writeSync(fd, `==================\nFile: ${relativePath}\n==================\n`);
                fs.writeSync(fd, content);
                // Ensure newline if missing
                if (!content.endsWith('\n')) {
                    fs.writeSync(fd, '\n');
                }

                fs.writeSync(fd, `\n---\n(template)\n\n`);
            }
        }
    }

    scanDir(targetDir);
    fs.closeSync(fd);
    console.log(`Generated bulk corpus at ${output}`);
}

main();
