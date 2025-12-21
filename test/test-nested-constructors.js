const BCON = require('..');
const assert = require('assert');

console.log('\n🧪 Testowanie zagnieżdżonych konstruktorów i walidatorów\n');
console.log('='.repeat(70));

// Test 1: Konstruktor jako wartość domyślna
console.log('\n📋 Test 1: Konstruktor jako wartość domyślna w klasie');
const code1 = `
    class Address (city, country) [
        @city: String => city ? "Unknown";
        @country: String => country ? "Poland";
    ];
    
    class Person (name, address) [
        @name: String => name ? "Unknown";
        @address: Address => address ? Address("Warsaw", "Poland");
    ];
    
    use Person("John", Null) as person1;
    use Person("Jane", Address("Krakow", "Poland")) as person2;
    
    export [@p1 => person1; @p2 => person2;];
`;

try {
    const result1 = BCON.parse(code1);
    console.log('Person 1 (address=Null):', JSON.stringify(result1.p1, null, 2));
    console.log('Person 2 (address=Address(...)):', JSON.stringify(result1.p2, null, 2));
    
    assert.strictEqual(result1.p1.name, "John");
    assert.strictEqual(result1.p1.address.city, "Warsaw");
    assert.strictEqual(result1.p1.address.country, "Poland");
    
    assert.strictEqual(result1.p2.name, "Jane");
    assert.strictEqual(result1.p2.address.city, "Krakow");
    assert.strictEqual(result1.p2.address.country, "Poland");
    
    console.log('✅ Test 1 przeszedł');
} catch (err) {
    console.log('❌ Test 1 nie przeszedł:', err.message);
}

// Test 2: Konstruktor jako argument wywołania
console.log('\n📋 Test 2: Konstruktor jako argument wywołania');
const code2 = `
    class Address (city, country) [
        @city: String => city;
        @country: String => country;
    ];
    
    class Company (name, headquarters) [
        @name: String => name;
        @headquarters: Address => headquarters;
    ];
    
    # Bezpośrednie wywołanie konstruktora jako argument
    use Company("TechCorp", Address("San Francisco", "USA")) as company;
    
    export company;
`;

try {
    const result2 = BCON.parse(code2);
    console.log('Company:', JSON.stringify(result2, null, 2));
    
    assert.strictEqual(result2.name, "TechCorp");
    assert.strictEqual(result2.headquarters.city, "San Francisco");
    assert.strictEqual(result2.headquarters.country, "USA");
    
    console.log('✅ Test 2 przeszedł');
} catch (err) {
    console.log('❌ Test 2 nie przeszedł:', err.message);
}

// Test 3: Walidator jako wartość domyślna
console.log('\n📋 Test 3: Walidator jako wartość domyślna');
const code3 = `
    class Config [
        @host: String => "localhost";
        @port: Number => 8080;
    ];
    
    class Server (name, config) [
        @name: String => name;
        @config: Config => config ? Config [];
    ];
    
    use Server("Server1", Null) as server1;
    use Server("Server2", Config [@host => "production.com"; @port => 443;]) as server2;
    
    export [@s1 => server1; @s2 => server2;];
`;

try {
    const result3 = BCON.parse(code3);
    console.log('Server 1 (config=Null):', JSON.stringify(result3.s1, null, 2));
    console.log('Server 2 (config=Config[...]):', JSON.stringify(result3.s2, null, 2));
    
    assert.strictEqual(result3.s1.name, "Server1");
    assert.strictEqual(result3.s1.config.host, "localhost");
    assert.strictEqual(result3.s1.config.port, 8080);
    
    assert.strictEqual(result3.s2.name, "Server2");
    assert.strictEqual(result3.s2.config.host, "production.com");
    assert.strictEqual(result3.s2.config.port, 443);
    
    console.log('✅ Test 3 przeszedł');
} catch (err) {
    console.log('❌ Test 3 nie przeszedł:', err.message);
}

// Test 4: Spread operator w tablicach
console.log('\n📋 Test 4: Spread operator w tablicach');
const code4 = `
    use [@* => "value1"; @* => "value2";] as arr1;
    use [@* => "value3"; @* => "value4";] as arr2;
    
    # Spread w tablicy
    use [@* => "start"; ...arr1; @* => "middle"; ...arr2; @* => "end";] as combined;
    
    export combined;
`;

try {
    const result4 = BCON.parse(code4);
    console.log('Combined array:', JSON.stringify(result4, null, 2));
    
    assert.deepStrictEqual(result4, ["start", "value1", "value2", "middle", "value3", "value4", "end"]);
    
    console.log('✅ Test 4 przeszedł');
} catch (err) {
    console.log('❌ Test 4 nie przeszedł:', err.message);
}

// Test 5: Głęboko zagnieżdżone konstruktory
console.log('\n📋 Test 5: Głęboko zagnieżdżone konstruktory');
const code5 = `
    class Coordinates (lat, lon) [
        @lat: Number => lat ? 0.0;
        @lon: Number => lon ? 0.0;
    ];
    
    class Address (street, city, coords) [
        @street: String => street ? "Unknown";
        @city: String => city ? "Unknown";
        @coords: Coordinates => coords ? Coordinates(52.2297, 21.0122);
    ];
    
    class Office (name, address) [
        @name: String => name;
        @address: Address => address ? Address("Main St", "Warsaw", Null);
    ];
    
    use Office("HQ", Null) as office1;
    use Office("Branch", Address("Tech Park", "Krakow", Coordinates(50.0647, 19.9450))) as office2;
    
    export [@o1 => office1; @o2 => office2;];
`;

try {
    const result5 = BCON.parse(code5);
    console.log('Office 1 (wszystkie defaults):', JSON.stringify(result5.o1, null, 2));
    console.log('Office 2 (pełna hierarchia):', JSON.stringify(result5.o2, null, 2));
    
    assert.strictEqual(result5.o1.name, "HQ");
    assert.strictEqual(result5.o1.address.street, "Main St");
    assert.strictEqual(result5.o1.address.city, "Warsaw");
    assert.strictEqual(result5.o1.address.coords.lat, 52.2297);
    assert.strictEqual(result5.o1.address.coords.lon, 21.0122);
    
    assert.strictEqual(result5.o2.name, "Branch");
    assert.strictEqual(result5.o2.address.street, "Tech Park");
    assert.strictEqual(result5.o2.address.city, "Krakow");
    assert.strictEqual(result5.o2.address.coords.lat, 50.0647);
    assert.strictEqual(result5.o2.address.coords.lon, 19.9450);
    
    console.log('✅ Test 5 przeszedł');
} catch (err) {
    console.log('❌ Test 5 nie przeszedł:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ Wszystkie testy zakończone!\n');
