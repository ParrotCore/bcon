/**
 * BCON ESM Tests
 * Prosty test sprawdzający czy wersja ESM działa poprawnie
 */

import BCON from './index.mjs';
import { parse, stringify } from './index.mjs';
import { readFileSync } from 'fs';

console.log('🧪 BCON ESM Tests\n');

// Test 1: Basic parsing
console.log('Test 1: Basic parsing');
const result1 = parse('export "Hello ESM!";');
console.assert(result1 === 'Hello ESM!', '✓ Basic string export');
console.log(`Result: ${result1}\n`);

// Test 2: Complex object
console.log('Test 2: Complex object parsing');
const result2 = parse(`
    use "localhost" as host;
    use 8080 as port;
    
    export [
        @host => host;
        @port => port;
        @url => "http://[host]:[port]";
    ];
`);
console.assert(result2.host === 'localhost', '✓ Host parsed');
console.assert(result2.port === 8080, '✓ Port parsed');
console.assert(result2.url === 'http://localhost:8080', '✓ URL interpolation');
console.log('Result:', result2, '\n');

// Test 3: Stringify
console.log('Test 3: Stringify to BCON');
const data = {
    appName: "ESM Test App",
    version: "2.0.0",
    features: ["fast", "modern"]
};
const bconString = stringify(data);
console.assert(bconString.includes('export'), '✓ Contains export keyword');
console.assert(bconString.includes('@appName'), '✓ Contains appName');
console.log('BCON output:', bconString, '\n');

// Test 4: Array destructuring with skip
console.log('Test 4: Array destructuring with skip keyword');
const result4 = parse(`
    use [
        @* => "first";
        @* => "second";
        @* => "third";
        @* => "fourth";
    ] as items;
    
    use [skip; skip; third] from items;
    
    export third;
`);
console.assert(result4 === 'third', '✓ Skip keyword works in ESM');
console.log(`Result: ${result4}\n`);

// Test 5: Import z pliku .bcon
console.log('Test 5: Loading .bcon file manually');
try {
    const warsaw = parse(readFileSync('./test/warsaw.bcon', 'utf-8'));
    console.assert(warsaw.cityType === 'capital', '✓ Warsaw cityType');
    console.assert(warsaw.population === 17200000, '✓ Warsaw population');
    console.log('Warsaw data:', warsaw, '\n');
} catch (error) {
    console.error('✗ File loading failed:', error.message, '\n');
}

// Test 6: BCON object API
console.log('Test 6: BCON default export');
const result6 = BCON.parse('export 42;');
console.assert(result6 === 42, '✓ BCON.parse works');
console.log(`Result: ${result6}\n`);

// Test 7: Init config
console.log('Test 7: Config initialization');
BCON.init({
    config: {
        defaultPath: process.cwd(),
        defaultEncoding: 'utf-8'
    }
});
console.assert(BCON.config.default_encoding === 'utf-8', '✓ Config set correctly');
console.log('Config:', BCON.config, '\n');

console.log('✅ All ESM tests passed!');
