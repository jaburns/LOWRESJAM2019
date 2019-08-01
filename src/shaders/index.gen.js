const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const filePath = path.join(__dirname, 'index.ts');

const shaders = fs.readdirSync(__dirname)
    .filter(x => x.indexOf('.glsl') === x.length - 5)
    .map(x => x.substr(0, x.indexOf('.glsl')));

const processLine = line =>
    line.indexOf('//_generated') >= 0 ? [] :
    line.indexOf('//foreach_shader') < 0 ? line :
    [line].concat(shaders.map(s => line.replace('//foreach_shader ', '').replace(/\$/g, s) + '//_generated'));

module.exports = () => {
    const oldFile = fs.readFileSync(filePath, 'utf8');
    const newFile = _.flatten(oldFile.split('\n').map(processLine)).join('\n').replace(/\r/g, '');

    if (newFile !== oldFile) {
        fs.writeFileSync(filePath, newFile);
        console.log('Updated shaders/index.ts with glsl files from filesystem.');
    }
};
