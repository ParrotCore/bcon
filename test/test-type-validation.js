const BCON = require('..');
const path = require('path');

// Initialize BCON
BCON.init({
    allowGlobal: true,
    config: {
        defaultPath: path.join(__dirname, 'data')
    }
});

console.log('\n🧪 Testing type validation in constructors and validators\n');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        failed++;
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Test 1: Walidacja typów w walidatorze (klasa bez parametrów)
test('Validator: correct types', () => {
    const code = `
        class Config [
            @host: String => "localhost";
            @port: Number => 8080;
            @debug: Boolean => True;
        ];
        
        use Config [
            @host => "example.com";
            @port => 3000;
            @debug => False;
        ] as config;
        
        export config;
    `;
    
    const result = BCON.parse(code);
    if (result.host !== "example.com") throw new Error('Incorrect host value');
    if (result.port !== 3000) throw new Error('Incorrect port value');
    if (result.debug !== false) throw new Error('Incorrect debug value');
});

test('Validator: incorrect String type', () => {
    const code = `
        class Config [
            @host: String => "localhost";
            @port: Number => 8080;
        ];
        
        use Config [
            @host => 12345;
            @port => 3000;
        ] as config;
        
        export config;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

test('Validator: incorrect Number type', () => {
    const code = `
        class Config [
            @host: String => "localhost";
            @port: Number => 8080;
        ];
        
        use Config [
            @host => "localhost";
            @port => "not a number";
        ] as config;
        
        export config;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

test('Validator: incorrect Boolean type', () => {
    const code = `
        class Config [
            @debug: Boolean => False;
        ];
        
        use Config [
            @debug => "yes";
        ] as config;
        
        export config;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

// Test 2: Type validation in constructor (class with parameters)
test('Constructor: correct types', () => {
    const code = `
        class User (name, age, active) [
            @name: String => name ? "Unknown";
            @age: Number => age ? 0;
            @active: Boolean => active ? False;
        ];
        
        use User("John", 25, True) as user;
        
        export user;
    `;
    
    const result = BCON.parse(code);
    if (result.name !== "John") throw new Error('Incorrect name value');
    if (result.age !== 25) throw new Error('Incorrect age value');
    if (result.active !== true) throw new Error('Incorrect active value');
});

test('Constructor: incorrect String type with ? operator', () => {
    const code = `
        class User (name, age) [
            @name: String => name ? "Unknown";
            @age: Number => age ? 0;
        ];
        
        use User(12345, 25) as user;
        
        export user;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

test('Constructor: incorrect Number type with ? operator', () => {
    const code = `
        class User (name, age) [
            @name: String => name ? "Unknown";
            @age: Number => age ? 0;
        ];
        
        use User("John", "twenty-five") as user;
        
        export user;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

test('Constructor: ? operator with Null uses default value', () => {
    const code = `
        class User (name, age) [
            @name: String => name ? "Guest";
            @age: Number => age ? 18;
        ];
        
        use User(Null, Null) as user;
        
        export user;
    `;
    
    const result = BCON.parse(code);
    if (result.name !== "Guest") throw new Error('Expected "Guest", got: ' + result.name);
    if (result.age !== 18) throw new Error('Expected 18, got: ' + result.age);
});

test('Constructor: incorrect type in default value', () => {
    const code = `
        class User (name) [
            @name: String => name ? 12345;
        ];
        
        use User(Null) as user;
        
        export user;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error for default value');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

// Test 3: Nested type validation
test('Validator: nested objects - correct types', () => {
    const code = `
        class Coordinates [
            @lat: Number => 0;
            @lon: Number => 0;
        ];
        
        class City [
            @name: String => "Unknown";
            @coords: Coordinates => Coordinates [
                @lat => 52.2297;
                @lon => 21.0122;
            ];
        ];
        
        use City [
            @name => "Warsaw";
            @coords => Coordinates [
                @lat => 52.2297;
                @lon => 21.0122;
            ];
        ] as city;
        
        export city;
    `;
    
    const result = BCON.parse(code);
    if (result.name !== "Warsaw") throw new Error('Incorrect city name');
    if (result.coords.lat !== 52.2297) throw new Error('Incorrect latitude');
});

test('Validator: nested objects - incorrect type in nesting', () => {
    const code = `
        class Coordinates [
            @lat: Number => 0;
            @lon: Number => 0;
        ];
        
        class City [
            @name: String => "Unknown";
            @coords: Coordinates => Coordinates [
                @lat => 0;
                @lon => 0;
            ];
        ];
        
        use City [
            @name => "Warsaw";
            @coords => Coordinates [
                @lat => "not a number";
                @lon => 21.0122;
            ];
        ] as city;
        
        export city;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error in nested object');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

test('Constructor: nested objects with parameters', () => {
    const code = `
        class Coordinates (lat, lon) [
            @latitude: Number => lat ? 0;
            @longitude: Number => lon ? 0;
        ];
        
        use Coordinates(52.2297, 21.0122) as coords;
        
        class City [
            @name: String => "Warsaw";
            @coords: Coordinates => coords;
        ];
        
        use City [
            @name => "Warsaw";
            @coords => coords;
        ] as city;
        
        export city;
    `;
    
    const result = BCON.parse(code);
    if (result.name !== "Warsaw") throw new Error('Incorrect name');
    if (result.coords.latitude !== 52.2297) throw new Error('Incorrect latitude');
    if (result.coords.longitude !== 21.0122) throw new Error('Incorrect longitude');
});

test('Constructor: incorrect type in nested constructor', () => {
    const code = `
        class Coordinates (lat, lon) [
            @latitude: Number => lat;
            @longitude: Number => lon;
        ];
        
        use Coordinates("not a number", 21.0122) as coords;
        
        export coords;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Should throw type validation error');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Expected Type mismatch error, got: ' + e.message);
        }
    }
});

// Test 4: Array validation
test('Validator: array - correct types', () => {
    const code = `
        class Team [
            @name: String => "Team";
            @members: Array => [];
        ];
        
        use [
            @* => "Alice";
            @* => "Bob";
            @* => "Charlie";
        ] as memberList;
        
        use Team [
            @name => "DevTeam";
            @members => memberList;
        ] as team;
        
        export team;
    `;
    
    const result = BCON.parse(code);
    if (!Array.isArray(result.members)) throw new Error('members is not an array');
    if (result.members.length !== 3) throw new Error('Incorrect number of members');
});

test('Constructor: array via spread - correct types', () => {
    const code = `
        class Team (name, ...members) [
            @name: String => name;
            @members: [String] => members ? [];
        ];
        
        use Team("DevTeam", "Alice", "Bob", "Charlie") as team;
        
        export team;
    `;
    
    const result = BCON.parse(code);
    if (!Array.isArray(result.members)) throw new Error('members is not an array');
    if (result.members.length !== 3) throw new Error('Incorrect number of members');
});

console.log('\n' + '='.repeat(70));
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);

if (failed > 0) {
    process.exit(1);
}
