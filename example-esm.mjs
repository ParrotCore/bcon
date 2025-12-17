// Przykład użycia BCON w ES Modules

import BCON from './index.mjs';
// Lub named imports:
// import { parse, stringify, init } from './index.mjs';

// Inicjalizacja (opcjonalna)
BCON.init({
    allowGlobal: false,
    config: {
        defaultPath: process.cwd(),
        defaultEncoding: 'utf-8'
    }
});

// Przykład 1: Parsowanie BCON
const config = BCON.parse(`
    use "localhost" as host;
    use 8080 as port;
    
    export [
        @host => host;
        @port => port;
        @url => "http://[host]:[port]";
    ];
`);

console.log('Parsed config:', config);
// Output: { host: 'localhost', port: 8080, url: 'http://localhost:8080' }

// Przykład 2: Stringify JavaScript do BCON
const data = {
    appName: "My ESM App",
    version: "2.0.0",
    features: ["fast", "modern", "esm-ready"]
};

const bconString = BCON.stringify(data);
console.log('\nBCON output:');
console.log(bconString);

// Przykład 3: Import plików .bcon (wymaga custom loader)
// Zamiast require() użyj:
// import { readFileSync } from 'fs';
// const configFile = BCON.parse(readFileSync('./config.bcon', 'utf-8'));
