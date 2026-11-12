const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('public/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]);
if (!scripts.length) throw new Error('No se encontró el script principal');
for (const source of scripts) new vm.Script(source);
console.log('HTML JavaScript: sintaxis correcta');
