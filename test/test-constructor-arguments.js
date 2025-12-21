const BCON = require('..');
const assert = require('assert');

console.log('\n🧪 Testowanie konstruktorów z różną liczbą argumentów\n');
console.log('='.repeat(70));

// Test 1: Mniej argumentów niż parametrów - błąd walidacji typu
console.log('\n📋 Test 1: Mniej argumentów bez ? - błąd walidacji');
const code1 = `
class Point (x, y, z) [
    @x: Number => x;
    @y: Number => y;
    @z: Number => z;
];

export Point(10, 20);  # Brak trzeciego argumentu
`;

try {
    BCON.parse(code1);
    console.log('❌ Test 1 nie przeszedł: oczekiwano błędu');
} catch (err) {
    if (err.message.includes('Type mismatch')) {
        console.log('✅ Test 1 przeszedł: poprawnie wykryto błąd typu');
        console.log('   Komunikat:', err.message);
    } else {
        console.log('❌ Test 1 nie przeszedł: nieoczekiwany błąd:', err.message);
    }
}

// Test 2: Mniej argumentów z operatorem ? - wartość domyślna
console.log('\n📋 Test 2: Mniej argumentów z operatorem ? - wartość domyślna');
const code2 = `
class Point (x, y, z) [
    @x: Number => x ? 0;
    @y: Number => y ? 0;
    @z: Number => z ? 999;  # Domyślna wartość
];

export Point(10, 20);  # Brak trzeciego argumentu, użyje domyślnej
`;

try {
    const result2 = BCON.parse(code2);
    console.log('Wynik:', JSON.stringify(result2, null, 2));
    
    assert.strictEqual(result2.x, 10);
    assert.strictEqual(result2.y, 20);
    assert.strictEqual(result2.z, 999);  // Wartość domyślna
    
    console.log('✅ Test 2 przeszedł: operator ? użył wartości domyślnej');
} catch (err) {
    console.log('❌ Test 2 nie przeszedł:', err.message);
}

// Test 3: Mniej argumentów z opcjonalnym polem (?)
console.log('\n📋 Test 3: Mniej argumentów z opcjonalnym polem');
const code3 = `
class Point (x, y, z) [
    @x: Number => x;
    @y: Number => y;
    @z?: Number => z;  # Pole opcjonalne
];

export Point(10, 20);  # Brak trzeciego argumentu
`;

try {
    const result3 = BCON.parse(code3);
    console.log('Wynik:', JSON.stringify(result3, null, 2));
    
    assert.strictEqual(result3.x, 10);
    assert.strictEqual(result3.y, 20);
    assert.strictEqual(result3.z, undefined);
    
    console.log('✅ Test 3 przeszedł: pole opcjonalne nie jest wymagane');
} catch (err) {
    console.log('❌ Test 3 nie przeszedł:', err.message);
}

// Test 4: Wszystkie argumenty z wartościami domyślnymi
console.log('\n📋 Test 4: Brak argumentów, wszystkie mają domyślne');
const code4 = `
class Point (x, y, z) [
    @x: Number => x ? 0;
    @y: Number => y ? 0;
    @z: Number => z ? 0;
];

export Point();  # Brak wszystkich argumentów
`;

try {
    const result4 = BCON.parse(code4);
    console.log('Wynik:', JSON.stringify(result4, null, 2));
    
    assert.strictEqual(result4.x, 0);
    assert.strictEqual(result4.y, 0);
    assert.strictEqual(result4.z, 0);
    
    console.log('✅ Test 4 przeszedł: wszystkie użyły wartości domyślnych');
} catch (err) {
    console.log('❌ Test 4 nie przeszedł:', err.message);
}

// Test 5: Mieszane - niektóre argumenty podane, niektóre domyślne
console.log('\n📋 Test 5: Częściowe argumenty z wartościami domyślnymi');
const code5 = `
class Config (host, port, timeout) [
    @host: String => host ? "localhost";
    @port: Number => port ? 8080;
    @timeout: Number => timeout ? 5000;
];

export Config("api.example.com");  # Tylko host
`;

try {
    const result5 = BCON.parse(code5);
    console.log('Wynik:', JSON.stringify(result5, null, 2));
    
    assert.strictEqual(result5.host, "api.example.com");
    assert.strictEqual(result5.port, 8080);
    assert.strictEqual(result5.timeout, 5000);
    
    console.log('✅ Test 5 przeszedł: częściowe argumenty z domyślnymi');
} catch (err) {
    console.log('❌ Test 5 nie przeszedł:', err.message);
}

// Test 6: Null jako argument - użyje wartości domyślnej
console.log('\n📋 Test 6: Null jako argument z operatorem ?');
const code6 = `
class Point (x, y) [
    @x: Number => x ? 100;
    @y: Number => y ? 200;
];

export Point(Null, 50);  # x=Null (użyje domyślnej), y=50
`;

try {
    const result6 = BCON.parse(code6);
    console.log('Wynik:', JSON.stringify(result6, null, 2));
    
    assert.strictEqual(result6.x, 100);  // Null ? 100 = 100
    assert.strictEqual(result6.y, 50);
    
    console.log('✅ Test 6 przeszedł: Null użył wartości domyślnej');
} catch (err) {
    console.log('❌ Test 6 nie przeszedł:', err.message);
}

// Test 7: Undefined jako argument - użyje wartości domyślnej
console.log('\n📋 Test 7: Undefined jako argument z operatorem ?');
const code7 = `
class Point (x, y) [
    @x: Number => x ? 100;
    @y: Number => y ? 200;
];

export Point(10, Undefined);  # x=10, y=Undefined (użyje domyślnej)
`;

try {
    const result7 = BCON.parse(code7);
    console.log('Wynik:', JSON.stringify(result7, null, 2));
    
    assert.strictEqual(result7.x, 10);
    assert.strictEqual(result7.y, 200);  // Undefined ? 200 = 200
    
    console.log('✅ Test 7 przeszedł: Undefined użył wartości domyślnej');
} catch (err) {
    console.log('❌ Test 7 nie przeszedł:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ Wszystkie testy zakończone!\n');
console.log('📝 Podsumowanie zachowania:');
console.log('  • Brak argumentu bez ? → błąd walidacji typu');
console.log('  • Brak argumentu z ? → użyje wartości domyślnej');
console.log('  • Pole opcjonalne (field?) → może być undefined');
console.log('  • Null/Undefined z ? → użyje wartości domyślnej');
console.log('  • Operator ? sprawdza czy wartość jest null lub undefined\n');
