const BCON = require('..');
const assert = require('assert');

console.log('\n🧪 Testing constructors with different number of arguments\n');
console.log('='.repeat(70));

// Test 1: Fewer arguments than parameters - type validation error
console.log('\n📋 Test 1: Fewer arguments without ? - validation error');
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
    console.log('❌ Test 1 failed: expected error');
} catch (err) {
    if (err.message.includes('Type mismatch')) {
        console.log('✅ Test 1 passed: correctly detected type error');
        console.log('   Message:', err.message);
    } else {
        console.log('❌ Test 1 failed: unexpected error:', err.message);
    }
}

// Test 2: Fewer arguments with ? operator - default value
console.log('\n📋 Test 2: Fewer arguments with ? operator - default value');
const code2 = `
class Point (x, y, z) [
    @x: Number => x ? 0;
    @y: Number => y ? 0;
    @z: Number => z ? 999;  # Default value
];

export Point(10, 20);  # Missing third argument, will use default
`;

try {
    const result2 = BCON.parse(code2);
    console.log('Result:', JSON.stringify(result2, null, 2));
    
    assert.strictEqual(result2.x, 10);
    assert.strictEqual(result2.y, 20);
    assert.strictEqual(result2.z, 999);  // Default value
    
    console.log('✅ Test 2 passed: ? operator used default value');
} catch (err) {
    console.log('❌ Test 2 failed:', err.message);
}

// Test 3: Fewer arguments with optional field (?)
console.log('\n📋 Test 3: Fewer arguments with optional field');
const code3 = `
class Point (x, y, z) [
    @x: Number => x;
    @y: Number => y;
    @z?: Number => z;  # Optional field
];

export Point(10, 20);  # Missing third argument
`;

try {
    const result3 = BCON.parse(code3);
    console.log('Result:', JSON.stringify(result3, null, 2));
    
    assert.strictEqual(result3.x, 10);
    assert.strictEqual(result3.y, 20);
    assert.strictEqual(result3.z, undefined);
    
    console.log('✅ Test 3 passed: optional field is not required');
} catch (err) {
    console.log('❌ Test 3 failed:', err.message);
}

// Test 4: All arguments with default values
console.log('\n📋 Test 4: No arguments, all have defaults');
const code4 = `
class Point (x, y, z) [
    @x: Number => x ? 0;
    @y: Number => y ? 0;
    @z: Number => z ? 0;
];

export Point();  # No arguments at all
`;

try {
    const result4 = BCON.parse(code4);
    console.log('Result:', JSON.stringify(result4, null, 2));
    
    assert.strictEqual(result4.x, 0);
    assert.strictEqual(result4.y, 0);
    assert.strictEqual(result4.z, 0);
    
    console.log('✅ Test 4 passed: all used default values');
} catch (err) {
    console.log('❌ Test 4 failed:', err.message);
}

// Test 5: Mixed - some arguments provided, some default
console.log('\n📋 Test 5: Partial arguments with default values');
const code5 = `
class Config (host, port, timeout) [
    @host: String => host ? "localhost";
    @port: Number => port ? 8080;
    @timeout: Number => timeout ? 5000;
];

export Config("api.example.com");  # Only host
`;

try {
    const result5 = BCON.parse(code5);
    console.log('Result:', JSON.stringify(result5, null, 2));
    
    assert.strictEqual(result5.host, "api.example.com");
    assert.strictEqual(result5.port, 8080);
    assert.strictEqual(result5.timeout, 5000);
    
    console.log('✅ Test 5 passed: partial arguments with defaults');
} catch (err) {
    console.log('❌ Test 5 failed:', err.message);
}

// Test 6: Null as argument - use default value
console.log('\n📋 Test 6: Null as argument with ? operator');
const code6 = `
class Point (x, y) [
    @x: Number => x ? 100;
    @y: Number => y ? 200;
];

export Point(Null, 50);  # x=Null (will use default), y=50
`;

try {
    const result6 = BCON.parse(code6);
    console.log('Result:', JSON.stringify(result6, null, 2));
    
    assert.strictEqual(result6.x, 100);  // Null ? 100 = 100
    assert.strictEqual(result6.y, 50);
    
    console.log('✅ Test 6 passed: Null used default value');
} catch (err) {
    console.log('❌ Test 6 failed:', err.message);
}

// Test 7: Undefined as argument - use default value
console.log('\n📋 Test 7: Undefined as argument with ? operator');
const code7 = `
class Point (x, y) [
    @x: Number => x ? 100;
    @y: Number => y ? 200;
];

export Point(10, Undefined);  # x=10, y=Undefined (will use default)
`;

try {
    const result7 = BCON.parse(code7);
    console.log('Result:', JSON.stringify(result7, null, 2));
    
    assert.strictEqual(result7.x, 10);
    assert.strictEqual(result7.y, 200);  // Undefined ? 200 = 200
    
    console.log('✅ Test 7 passed: Undefined used default value');
} catch (err) {
    console.log('❌ Test 7 failed:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('\n✅ All tests completed!\n');
console.log('📝 Behavior summary:');
console.log('  • Missing argument without ? → type validation error');
console.log('  • Missing argument with ? → uses default value');
console.log('  • Optional field (field?) → can be undefined');
console.log('  • Null/Undefined with ? → uses default value');
console.log('  • ? operator checks if value is null or undefined\n');
