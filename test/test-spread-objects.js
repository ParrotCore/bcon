const BCON = require('..');
const assert = require('assert');

console.log('\n🧪 Testowanie spread operator w obiektach i tablicach\n');
console.log('='.repeat(70));

// Test 1: Spread w obiekcie
console.log('\n📋 Test 1: Spread w obiekcie');
const code1 = `
use [@key1 => "value1"; @key2 => "value2";] as obj1;
use [@start => "s"; ...obj1; @end => "e";] as combined;
export combined;
`;

try {
    const result1 = BCON.parse(code1);
    console.log('Result:', JSON.stringify(result1, null, 2));
    
    assert.strictEqual(result1.start, "s");
    assert.strictEqual(result1.key1, "value1");
    assert.strictEqual(result1.key2, "value2");
    assert.strictEqual(result1.end, "e");
    
    console.log('✅ Test 1 przeszedł');
} catch (err) {
    console.log('❌ Test 1 nie przeszedł:', err.message);
}

// Test 2: Łączenie wielu obiektów
console.log('\n📋 Test 2: Łączenie wielu obiektów');
const code2 = `
use [@name => "John";] as personalInfo;
use [@email => "john@example.com"; @phone => "123456";] as contactInfo;
use [@department => "Engineering";] as workInfo;
use [...personalInfo; ...contactInfo; ...workInfo;] as fullProfile;
export fullProfile;
`;

try {
    const result2 = BCON.parse(code2);
    console.log('Result:', JSON.stringify(result2, null, 2));
    
    assert.strictEqual(result2.name, "John");
    assert.strictEqual(result2.email, "john@example.com");
    assert.strictEqual(result2.phone, "123456");
    assert.strictEqual(result2.department, "Engineering");
    
    console.log('✅ Test 2 przeszedł');
} catch (err) {
    console.log('❌ Test 2 nie przeszedł:', err.message);
}

// Test 3: Nadpisywanie kluczy (ostatni wygrywa)
console.log('\n📋 Test 3: Nadpisywanie kluczy w spread');
const code3 = `
use [@name => "Default"; @age => 25;] as defaults;
use [@name => "John"; ...defaults; @email => "john@example.com";] as profile;
export profile;
`;

try {
    const result3 = BCON.parse(code3);
    console.log('Result:', JSON.stringify(result3, null, 2));
    
    // name z defaults nadpisuje początkowe "John"
    assert.strictEqual(result3.name, "Default");
    assert.strictEqual(result3.age, 25);
    assert.strictEqual(result3.email, "john@example.com");
    
    console.log('✅ Test 3 przeszedł (spread nadpisuje wcześniejsze klucze)');
} catch (err) {
    console.log('❌ Test 3 nie przeszedł:', err.message);
}

// Test 4: Spread w tablicy (dla porównania)
console.log('\n📋 Test 4: Spread w tablicy');
const code4 = `
use [@* => "a"; @* => "b";] as arr1;
use [@* => "c"; @* => "d";] as arr2;
use [@* => "start"; ...arr1; ...arr2; @* => "end";] as combined;
export combined;
`;

try {
    const result4 = BCON.parse(code4);
    console.log('Result:', JSON.stringify(result4, null, 2));
    
    assert.deepStrictEqual(result4, ["start", "a", "b", "c", "d", "end"]);
    
    console.log('✅ Test 4 przeszedł');
} catch (err) {
    console.log('❌ Test 4 nie przeszedł:', err.message);
}

// Test 5: Błąd - spread tablicy w obiekcie
console.log('\n📋 Test 5: Błąd - spread tablicy w obiekcie (powinien rzucić błąd)');
const code5 = `
use [@* => "a"; @* => "b";] as arr;
use [@key1 => "v1"; ...arr;] as obj;
export obj;
`;

try {
    const result5 = BCON.parse(code5);
    console.log('❌ Test 5 nie przeszedł: Powinien rzucić błąd!');
} catch (err) {
    console.log('Error:', err.message);
    assert(err.message.includes('Cannot spread non-object value in object'));
    console.log('✅ Test 5 przeszedł (poprawnie wykrył błąd)');
}

// Test 6: Błąd - spread obiektu w tablicy
console.log('\n📋 Test 6: Błąd - spread obiektu w tablicy (powinien rzucić błąd)');
const code6 = `
use [@key1 => "v1"; @key2 => "v2";] as obj;
use [@* => "a"; ...obj; @* => "b";] as arr;
export arr;
`;

try {
    const result6 = BCON.parse(code6);
    console.log('❌ Test 6 nie przeszedł: Powinien rzucić błąd!');
} catch (err) {
    console.log('Error:', err.message);
    assert(err.message.includes('Cannot spread non-array value in array'));
    console.log('✅ Test 6 przeszedł (poprawnie wykrył błąd)');
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ Wszystkie testy zakończone!\n');
