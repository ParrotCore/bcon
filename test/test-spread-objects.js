const BCON = require('..');
const assert = require('assert');

console.log('\n🧪 Testing spread operator in objects and arrays\n');
console.log('='.repeat(70));

// Test 1: Spread in object
console.log('\n📋 Test 1: Spread in object');
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
    
    console.log('✅ Test 1 passed');
} catch (err) {
    console.log('❌ Test 1 failed:', err.message);
}

// Test 2: Merging multiple objects
console.log('\n📋 Test 2: Merging multiple objects');
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
    
    console.log('✅ Test 2 passed');
} catch (err) {
    console.log('❌ Test 2 failed:', err.message);
}

// Test 3: Overwriting keys (last wins)
console.log('\n📋 Test 3: Overwriting keys in spread');
const code3 = `
use [@name => "Default"; @age => 25;] as defaults;
use [@name => "John"; ...defaults; @email => "john@example.com";] as profile;
export profile;
`;

try {
    const result3 = BCON.parse(code3);
    console.log('Result:', JSON.stringify(result3, null, 2));
    
    // name from defaults overwrites the initial "John"
    assert.strictEqual(result3.name, "Default");
    assert.strictEqual(result3.age, 25);
    assert.strictEqual(result3.email, "john@example.com");
    
    console.log('✅ Test 3 passed (spread overwrites earlier keys)');
} catch (err) {
    console.log('❌ Test 3 failed:', err.message);
}

// Test 4: Spread in array (for comparison)
console.log('\n📋 Test 4: Spread in array');
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
    
    console.log('✅ Test 4 passed');
} catch (err) {
    console.log('❌ Test 4 failed:', err.message);
}

// Test 5: Error - spread array in object
console.log('\n📋 Test 5: Error - spread array in object (should throw error)');
const code5 = `
use [@* => "a"; @* => "b";] as arr;
use [@key1 => "v1"; ...arr;] as obj;
export obj;
`;

try {
    const result5 = BCON.parse(code5);
    console.log('❌ Test 5 failed: Should throw error!');
} catch (err) {
    console.log('Error:', err.message);
    assert(err.message.includes('Cannot spread non-object value in object'));
    console.log('✅ Test 5 passed (correctly detected error)');
}

// Test 6: Error - spread object in array
console.log('\n📋 Test 6: Error - spread object in array (should throw error)');
const code6 = `
use [@key1 => "v1"; @key2 => "v2";] as obj;
use [@* => "a"; ...obj; @* => "b";] as arr;
export arr;
`;

try {
    const result6 = BCON.parse(code6);
    console.log('❌ Test 6 failed: Should throw error!');
} catch (err) {
    console.log('Error:', err.message);
    assert(err.message.includes('Cannot spread non-array value in array'));
    console.log('✅ Test 6 passed (correctly detected error)');
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ All tests completed!\n');
