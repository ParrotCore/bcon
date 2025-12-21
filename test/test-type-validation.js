const BCON = require('..');
const path = require('path');

// Initialize BCON
BCON.init({
    allowGlobal: true,
    config: {
        defaultPath: path.join(__dirname, 'data')
    }
});

console.log('\n🧪 Testowanie walidacji typów w konstruktorach i walidatorach\n');
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
test('Walidator: poprawne typy', () => {
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
    if (result.host !== "example.com") throw new Error('Niepoprawna wartość host');
    if (result.port !== 3000) throw new Error('Niepoprawna wartość port');
    if (result.debug !== false) throw new Error('Niepoprawna wartość debug');
});

test('Walidator: błędny typ String', () => {
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
        throw new Error('Powinien rzucić błąd walidacji typu');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

test('Walidator: błędny typ Number', () => {
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
        throw new Error('Powinien rzucić błąd walidacji typu');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

test('Walidator: błędny typ Boolean', () => {
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
        throw new Error('Powinien rzucić błąd walidacji typu');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

// Test 2: Walidacja typów w konstruktorze (klasa z parametrami)
test('Konstruktor: poprawne typy', () => {
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
    if (result.name !== "John") throw new Error('Niepoprawna wartość name');
    if (result.age !== 25) throw new Error('Niepoprawna wartość age');
    if (result.active !== true) throw new Error('Niepoprawna wartość active');
});

test('Konstruktor: błędny typ String z operatorem ?', () => {
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
        throw new Error('Powinien rzucić błąd walidacji typu');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

test('Konstruktor: błędny typ Number z operatorem ?', () => {
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
        throw new Error('Powinien rzucić błąd walidacji typu');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

test('Konstruktor: operator ? z Null używa wartości domyślnej', () => {
    const code = `
        class User (name, age) [
            @name: String => name ? "Guest";
            @age: Number => age ? 18;
        ];
        
        use User(Null, Null) as user;
        
        export user;
    `;
    
    const result = BCON.parse(code);
    if (result.name !== "Guest") throw new Error('Oczekiwano "Guest", dostano: ' + result.name);
    if (result.age !== 18) throw new Error('Oczekiwano 18, dostano: ' + result.age);
});

test('Konstruktor: błędny typ w wartości domyślnej', () => {
    const code = `
        class User (name) [
            @name: String => name ? 12345;
        ];
        
        use User(Null) as user;
        
        export user;
    `;
    
    try {
        BCON.parse(code);
        throw new Error('Powinien rzucić błąd walidacji typu dla wartości domyślnej');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

// Test 3: Walidacja typów zagnieżdżonych
test('Walidator: zagnieżdżone obiekty - poprawne typy', () => {
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
    if (result.name !== "Warsaw") throw new Error('Niepoprawna nazwa miasta');
    if (result.coords.lat !== 52.2297) throw new Error('Niepoprawna szerokość geograficzna');
});

test('Walidator: zagnieżdżone obiekty - błędny typ w zagnieżdżeniu', () => {
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
        throw new Error('Powinien rzucić błąd walidacji typu w zagnieżdżonym obiekcie');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

test('Konstruktor: zagnieżdżone obiekty z parametrami', () => {
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
    if (result.name !== "Warsaw") throw new Error('Niepoprawna nazwa');
    if (result.coords.latitude !== 52.2297) throw new Error('Niepoprawna latitude');
    if (result.coords.longitude !== 21.0122) throw new Error('Niepoprawna longitude');
});

test('Konstruktor: błędny typ w zagnieżdżonym konstruktorze', () => {
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
        throw new Error('Powinien rzucić błąd walidacji typu');
    } catch (e) {
        if (!e.message.includes('Type mismatch')) {
            throw new Error('Oczekiwano błędu Type mismatch, dostano: ' + e.message);
        }
    }
});

// Test 4: Walidacja tablic
test('Walidator: tablica - poprawne typy', () => {
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
    if (!Array.isArray(result.members)) throw new Error('members nie jest tablicą');
    if (result.members.length !== 3) throw new Error('Niepoprawna liczba członków');
});

test('Konstruktor: tablica przez spread - poprawne typy', () => {
    const code = `
        class Team (name, ...members) [
            @name: String => name;
            @members: [String] => members ? [];
        ];
        
        use Team("DevTeam", "Alice", "Bob", "Charlie") as team;
        
        export team;
    `;
    
    const result = BCON.parse(code);
    if (!Array.isArray(result.members)) throw new Error('members nie jest tablicą');
    if (result.members.length !== 3) throw new Error('Niepoprawna liczba członków');
});

console.log('\n' + '='.repeat(70));
console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);

if (failed > 0) {
    process.exit(1);
}
