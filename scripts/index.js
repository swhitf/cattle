'use strict'

console.log('Creating index.ts...');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const outFile = './src/index.ts';
const excludePattern = /\/\/\s*@no-export/;
const files = glob.sync('./src/**/*.ts');

let output = ['//@no-export', ''];

for (let f of files) {
    if (fs.readFileSync(f, 'utf8').match(excludePattern)) {
        continue;
    }
    //Remove /src
    f = f.replace(/\.\/src/, '.');
    //Remove .ts
    f = f.replace(/\.ts$/, '');
    //Emit line
    output.push(`export * from "${f}";`);
}

if (fs.existsSync(outFile))
    fs.unlinkSync(outFile);
fs.writeFileSync(outFile, output.join('\n'));

console.log('done.');