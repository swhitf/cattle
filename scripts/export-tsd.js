'use strict'

console.log('Building d.ts...');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

let files = glob.sync('./build/**/*.d.ts');
let excludes = glob.sync('./build/*.d.ts');
files = files.filter(x => excludes.indexOf(x) < 0);

//Process each file into the code
let merge = '';

for (let f of files) {

    let code = fs.readFileSync(f, 'utf8')
        .replace(/\r$/g, '')
        .split('\n')
        .map(x => x.replace(/^import.*/g, ''))
        .map(x => x.replace(/export declare/g, 'export'))
        .filter(x => !!x)
        .map(x => '    ' + x)
        .join('\n')
    ;
    
    merge += code + '\n\n';
}

merge = 
`
declare namespace cattle {
${merge}
}
`;

let out = './dist/browser/cattle.d.ts';

fs.unlink(out, () => {
    fs.writeFileSync(out, merge);
});

console.log('done.');