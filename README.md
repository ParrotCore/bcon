# BCON - BCON Configures Only Nicely

<div align="center">

![BCON Icon](https://github.com/ParrotCore/bcon/raw/master/icon.png?raw=true)

**A declarative configuration language designed for clarity, readability, and ease of use**

[![npm version](https://img.shields.io/npm/v/bcon-parser.svg)](https://www.npmjs.com/package/bcon-parser)
[![license](https://img.shields.io/npm/l/bcon-parser.svg)](https://github.com/parrotcore/bcon-parser/blob/master/LICENSE)

[Features](#key-features) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples)

</div>

---

## Overview

**BCON** (BCON Configures Only Nicely) is a modern, human-readable configuration language designed specifically for defining complex project configurations with the expressiveness of a programming language without the complexity of arithmetic operations.

Unlike traditional configuration formats, BCON provides:
- **Rich type system** with native support for dates, regular expressions, and files
- **Classes with validation** for structured data schemas and type checking
- **Variable system** with imports and references
- **String interpolation** for dynamic values
- **Destructuring** for elegant data extraction
- **Comments** for documentation
- **Explicit exports** for clarity

BCON is perfect for application configuration files, build systems, deployment scripts, and any scenario where human-readable, maintainable configuration is essential.

## Key Features

- ✨ **Simple and intuitive syntax** - Easy to read and write, even for non-programmers
- 💬 **Comments support** - Both single-line and multi-line comments
- 🔤 **Multi-line strings** - With interpolation for dynamic content
- 📅 **Rich data types** - Native support for `Date`, `RegExp`, `File`, and all ES2023 number formats
- 🗂️ **Data structures** - Dictionaries (objects) and arrays
- 📦 **Module system** - Import and reuse configurations from other files
- 🔗 **Variable references** - Access nested data with dot notation
- 🎯 **Destructuring** - Extract specific values elegantly
- 🏗️ **Classes with validation** - Define schemas with type checking and inheritance
- 🚫 **No arithmetic** - Purely declarative, focused on value definitions
- 🎨 **VS Code support** - Syntax highlighting extension available

## Syntax Highlighting

A dedicated BCON syntax highlighter for Visual Studio Code is available, created by **yobonez**.

- **Extension Name:** BCON Syntax Highlighting
- **Repository:** [github.com/yobonez/vscode-bcon-highlighting](https://github.com/yobonez/vscode-bcon-highlighting)

---

## Installation

```bash
npm install bcon-parser
```

## Module Support

BCON Parser v1.1.0+ supports both **CommonJS (CJS)** and **ES Modules (ESM)** with full backward compatibility.

### CommonJS (Node.js traditional)

The traditional Node.js module system using `require()`:

```javascript
const BCON = require('bcon-parser');

const config = BCON.parse('export "Hello";');
console.log(config); // "Hello"
```

**Loading .bcon files with require():**

```javascript
const BCON = require('bcon-parser');

BCON.init({ allowRequire: true });

// Now you can require .bcon files directly
const config = require('./config.bcon');
console.log(config.appName);
```

### ES Modules (ESM)

Modern JavaScript module system using `import`:

```javascript
import BCON from 'bcon-parser';
// Or use named imports:
import { parse, stringify, init } from 'bcon-parser';

const config = parse('export "Hello from ESM";');
console.log(config); // "Hello from ESM"
```

**Loading .bcon files in ESM:**

Since ESM doesn't support custom require extensions, read and parse files manually:

```javascript
import { readFileSync } from 'fs';
import { parse } from 'bcon-parser';

const configContent = readFileSync('./config.bcon', 'utf-8');
const config = parse(configContent);
console.log(config.appName);
```

### Choosing Between CJS and ESM

| Feature | CommonJS | ES Modules |
|---------|----------|------------|
| **Syntax** | `require()` / `module.exports` | `import` / `export` |
| **File Extension** | `.js` | `.mjs` or `.js` with `"type": "module"` |
| **Dynamic Loading** | `require()` works anywhere | `import()` is async |
| **.bcon Files** | Auto-load with `allowRequire: true` | Manual read + parse |
| **Compatibility** | Legacy, widely supported | Modern standard |
| **Performance** | Runtime resolution | Static analysis, tree-shaking |

**Recommendation:** Use ESM for new projects. Both are fully supported and will continue to be maintained.

### Migration from CommonJS to ESM

If you're migrating from CommonJS to ESM:

1. **Change file extensions** to `.mjs` or add `"type": "module"` to `package.json`
2. **Replace `require()`** with `import`:
   ```javascript
   // Before
   const BCON = require('bcon-parser');
   
   // After
   import BCON from 'bcon-parser';
   ```

3. **Replace `module.exports`** with `export`:
   ```javascript
   // Before
   module.exports = { myFunction };
   
   // After
   export { myFunction };
   ```

4. **Handle __dirname and __filename**:
   ```javascript
   import { fileURLToPath } from 'url';
   import { dirname } from 'path';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   ```

5. **Load .bcon files manually**:
   ```javascript
   import { readFileSync } from 'fs';
   import { parse } from 'bcon-parser';
   
   const config = parse(readFileSync('./config.bcon', 'utf-8'));
   ```

---

## Quick Start

### Basic Example

```javascript
// CommonJS
const BCON = require('bcon-parser');

// ES Modules
import BCON from 'bcon-parser';

// Parse BCON code
const config = BCON.parse(`
    use "Production" as environment;
    use 8080 as port;
    
    export [
        @environment => environment;
        @port => port;
        @host => "0.0.0.0";
        @database => [
            @host => "localhost";
            @port => 5432;
        ];
    ];
`);

console.log(config);
// Output: { environment: 'Production', port: 8080, host: '0.0.0.0', database: { host: 'localhost', port: 5432 } }
```

### Initialization (Optional)

**CommonJS:**

```javascript
const BCON = require('bcon-parser');

BCON.init({
    allowRequire: true,  // Enable require('./file.bcon')
    allowGlobal: false,
    config: {
        defaultPath: __dirname,
        defaultEncoding: 'utf-8'
    }
});
```

**ES Modules:**

```javascript
import BCON from 'bcon-parser';
// Or: import { parse, stringify, init } from 'bcon-parser';

BCON.init({
    allowGlobal: false,
    config: {
        defaultPath: process.cwd(),  // Note: use process.cwd() instead of __dirname
        defaultEncoding: 'utf-8'
    }
});
```

### Working with .bcon Files

**CommonJS** - Direct require (recommended):

```javascript
const BCON = require('bcon-parser');

BCON.init({ allowRequire: true });

// Now you can require .bcon files directly
const config = require('./config.bcon');
console.log(config.appName); // "My Application"
```

**ES Modules** - Manual parsing:

```javascript
import { readFileSync } from 'fs';
import { parse } from 'bcon-parser';

const configContent = readFileSync('./config.bcon', 'utf-8');
const config = parse(configContent);
console.log(config.appName); // "My Application"
```

---

## Documentation

### Table of Contents

1. [Syntax Guide](#syntax-guide)
   - [Comments](#comments)
   - [Data Types](#data-types)
   - [Data Structures](#data-structures)
   - [Variables](#variables)
   - [Imports](#imports)
   - [Destructuring](#destructuring)
   - [References](#references)
   - [Classes](#classes)
   - [Export Statement](#export-statement)
2. [API Reference](#api-reference)
3. [Examples](#examples)

---

# Syntax Guide

## Comments

BCON supports two types of comments for documenting your configuration:

### Single-line Comments

Use `#` for comments that span a single line:

```bcon
# This is a single-line comment
use "production" as environment;  # Inline comment
```

### Multi-line Comments

Use single quotes `'...'` for multi-line comments:

```bcon
'This is a multi-line comment
that can span multiple lines.
Very useful for documentation!'

use "config" as name;
```

## Data Types

BCON supports a rich set of data types for various configuration needs:

### Strings

Standard double-quoted strings with support for interpolation:

```bcon
use "World" as target;
use "Hello, [target]!" as greeting;  # String interpolation
```

**Multi-line strings** can also be used:

```bcon
use "This is a
multi-line
string value" as description;
```

### Numbers

Full support for all ES2023 numeric notations:

```bcon
use 42 as integer;
use 3.14159 as float;
use .5 as decimal;
use 1e+10 as scientific;
use 1e-5 as smallScientific;
use 0xFF00CC as hexadecimal;  # 16711884
use 0o755 as octal;            # 493
use 0b1010 as binary;          # 10
use -273.15 as negative;
```

### BigInt

For arbitrarily large integers:

```bcon
use 99721376669331060n as bigNumber;
use 9007199254740991n as maxSafeInt;
```

### Boolean

```bcon
use True as isEnabled;
use False as isDisabled;
```

### Special Values

```bcon
use Null as empty;
use Undefined as notSet;
use NaN as notANumber;
use Infinity as unlimited;
```

### Regular Expressions

Native regex support with flags:

```bcon
use /^[a-zA-Z]+$/i as namePattern;
use /\d{3}-\d{3}-\d{4}/ as phonePattern;
use /^[\p{Script=Latin}\p{P}]+$/u as unicodePattern;
```

### Dates

Parse dates from string format:

```bcon
# Format: "MM-DD-YYYY, HH:MM:SS.MS".date
use "01-01-2025, 12:00:00.000".date as newYear;
use "12-31-1999, 23:59:59.999".date as y2k;
```

### Files

Load external file content with specified encoding:

```bcon
use "./config.json".utf8 as jsonConfig;
use "./logo.png".binary as logo;
use "./data.txt".ascii as textData;
```

Supported encodings: `utf8`, `ascii`, `binary`, `base64`, `hex`, `latin1`, `utf16le`, etc.

## Data Structures

BCON provides two primary data structures:

### Dictionaries (Objects)

Dictionaries use the `@key => value` syntax:

```bcon
export [
    @name => "John Doe";
    @age => 30;
    @email => "john@example.com";
    @address => [
        @city => "New York";
        @zip => "10001";
    ];
];
```

### Arrays

Arrays use the `@*` syntax for items:

```bcon
export [
    @* => "First item";
    @* => "Second item";
    @* => "Third item";
];
```

### Mixed Structures

You can nest dictionaries and arrays:

```bcon
export [
    @users => [
        @* => [
            @name => "Alice";
            @role => "Admin";
        ];
        @* => [
            @name => "Bob";
            @role => "User";
        ];
    ];
];
```

## Variables

Variables allow you to define reusable values:

### Basic Variable Assignment

```bcon
use "production" as environment;
use 8080 as port;
use "0.0.0.0" as host;

export [
    @environment => environment;
    @port => port;
    @host => host;
];
```

### Complex Variable Values

Variables can hold any BCON value, including dictionaries and arrays:

```bcon
use [
    @host => "localhost";
    @port => 5432;
    @username => "admin";
] as database;

use [
    @* => "read";
    @* => "write";
    @* => "delete";
] as permissions;

export [
    @database => database;
    @permissions => permissions;
];
```

## Imports

Import external BCON files to reuse configurations:

### Basic Import (Assignment)

Use `as` to import the entire file content as a single variable:

```bcon
# Import entire file content
import "./database.bcon".utf8 as dbConfig;

export [
    @database => dbConfig;
];
```

### Import with Destructuring

Use `from` to extract specific values during import:

```bcon
# database.bcon contains: { host: "localhost", port: 5432, username: "admin" }
import [
    host => dbHost;
    port => dbPort;
] from "./database.bcon".utf8;

export [
    @host => dbHost;
    @port => dbPort;
];
```

### Import Syntax Rules

- **`import file as binding;`** - Import entire file content
- **`import [bindings] from file;`** - Destructure specific values from file

```bcon
# Import whole file
import "./config.bcon".utf8 as config;

# Destructure from file
import [apiKey; timeout] from "./api.bcon".utf8;
```

## Destructuring

Destructuring allows you to extract specific values from dictionaries, arrays, or variables into separate variables.

### Dictionary Destructuring

Use `from` to extract specific keys from a dictionary:

```bcon
# First, create a variable with a dictionary
use [
    @username => "alice123";
    @email => "alice@example.com";
    @age => 28;
    @role => "admin";
] as user;

# Then, destructure specific keys from it
use [
    username;
    email;
] from user;

# Now 'username' and 'email' are separate variables
export [
    @username => username;
    @email => email;
];
```

### Dictionary Destructuring with Aliases

Rename variables during extraction:

```bcon
# Create a variable
use [
    @username => "bob456";
    @age => 35;
] as user;

# Destructure with renaming
use [
    username => userName;  # Rename to 'userName'
    age => userAge;        # Rename to 'userAge'
] from user;

export [
    @name => userName;
    @age => userAge;
];
```

### Array Destructuring

Extract specific elements from arrays:

```bcon
use [
    @* => "Hello";
    @* => "Beautiful";
    @* => "World";
] as words;

# Extract first element
use [first] from words;

# Extract second element (skip first with semicolon)
use [; second] from words;

# Extract third element (skip first two with semicolons)
use [; ; third] from words;

export [
    @greeting => "[first] [second] [third]";
];
```

**Using the `skip` keyword:**

For better readability when skipping multiple elements, use the `skip` keyword:

```bcon
use [
    @* => "First";
    @* => "Second";
    @* => "Third";
    @* => "Fourth";
    @* => "Fifth";
] as items;

# Skip first three elements, extract fourth
use [skip; skip; skip; fourth] from items;

# Mix skip with semicolons for single skips
use [skip; second] from items;

export [
    @selected => fourth;
    @other => second;
];
```

The `skip` keyword is especially useful when working with large arrays where multiple semicolons would reduce readability.

### Nested Destructuring

Work with nested structures:

```bcon
use [
    @database => [
        @host => "localhost";
        @port => 5432;
        @credentials => [
            @username => "admin";
            @password => "secret";
        ];
    ];
] as config;

# Extract nested values
use [
    database => [
        host;
        credentials => [
            username => dbUser;
            password => dbPass;
        ];
    ];
] from config;

export [
    @host => host;
    @user => dbUser;
    @pass => dbPass;
];
```

### Import with Destructuring

Extract values directly during file import:

```bcon
# File: ./api-config.bcon
export [
    @baseUrl => "https://api.example.com";
    @timeout => 5000;
    @apiKey => "secret-key-123";
    @version => "v2";
];

# File: ./main.bcon
import [
    baseUrl;
    apiKey;
] from "./api-config.bcon".utf8;

export [
    @url => baseUrl;
    @key => apiKey;
];
```

### Use vs Import

Both `use` and `import` support the same syntax:

- **Assignment with `as`:** Assign entire value to a variable
  ```bcon
  use value as variable;
  import file as variable;
  ```

- **Destructuring with `from`:** Extract specific values
  ```bcon
  use [bindings] from value;
  import [bindings] from file;
  ```

## References

BCON provides powerful reference capabilities for accessing nested data:

### Variable References

- **Case-sensitive:** `IDENTIFIER` is different from `Identifier`
- **Dot notation:** Access nested properties using dots

```bcon
use [
    @server => [
        @host => "localhost";
        @port => 8080;
    ];
    @database => [
        @host => "db.local";
        @port => 5432;
    ];
] as config;

export [
    @serverHost => config.server.host;
    @dbHost => config.database.host;
];
```

### Array Element Access

```bcon
use [
    @* => "First";
    @* => "Second";
    @* => "Third";
] as items;

export [
    @first => items.0;
    @second => items.1;
    @third => items.2;
];
```

### The `Main` Object

The `Main` object contains the entire parsed configuration and can be referenced from anywhere:

```bcon
use "MyApp" as appName;
use "1.0.0" as version;

export [
    @app => [
        @name => appName;
        @version => version;
    ];
    @welcome => "Welcome to [Main.app.name] v[Main.app.version]!";
    @greeting => "Hello from [Main.app.name]!";
];
```

### The `This` Object

The `This` object represents the currently parsed section (scope):

```bcon
export [
    @user => [
        @firstName => "John";
        @lastName => "Doe";
        @fullName => "[This.firstName] [This.lastName]";
    ];
    @admin => [
        @firstName => "Jane";
        @lastName => "Smith";
        @fullName => "[This.firstName] [This.lastName]";
    ];
];
```

### String Interpolation

Embed variable and property references in strings using square brackets:

```bcon
use "Alice" as userName;
use "developer" as role;

export [
    @message => "User [userName] has role [role]";
    @user => [
        @name => userName;
        @role => role;
        @bio => "[This.name] is a [This.role]";
    ];
    @greeting => "Welcome, [Main.user.name]!";
];
```

## Classes

**NEW in BCON 2.1:** Define reusable schemas with type validation and inheritance.

### Why Classes?

Classes in BCON provide:
- **Type safety** - Validate data structure at parse time
- **Documentation** - Self-documenting schemas
- **Reusability** - Define once, use many times
- **Inheritance** - Extend and compose schemas
- **Default values** - Reduce repetition

### Basic Class Definition

```bcon
class Person [
    @name: String;
    @age: Number;
    @email?: String;  # Optional field
];

use Person [
    @name => "Alice";
    @age => 30;
] as alice;

export alice;
# Result: { name: "Alice", age: 30 }
```

### Field Types

**Primitive types:**
- `String`, `Number`, `Boolean`, `BigInt`
- `Date`, `RegExp`
- `Array`, `Object`
- `Null`, `Undefined`, `Any`

**Nested object types:**

```bcon
class Address [
    @street: String;
    @city: String;
    @coordinates: [
        @lat: Number;
        @lon: Number;
    ];
];
```

**Array types:**

```bcon
class Team [
    @name: String;
    @members: Array;  # Array of any elements
];
```

### Optional Fields

Mark fields as optional with `?`:

```bcon
class User [
    @username: String;
    @email?: String;      # Optional
    @phone?: String;      # Optional
];
```

### Default Values

Provide default values with `=`:

```bcon
class Config [
    @host: String = "localhost";
    @port: Number = 8080;
    @debug: Boolean = False;
];

use Config [
    @host => "example.com";
    # port and debug will use defaults
] as config;
# Result: { host: "example.com", port: 8080, debug: false }
```

### Class Inheritance

Extend classes to add or override fields:

```bcon
class Animal [
    @name: String;
    @age: Number;
];

class Dog extends Animal [
    @breed: String;
    @goodBoy: Boolean = True;
];

use Dog [
    @name => "Buddy";
    @age => 5;
    @breed => "Golden Retriever";
] as buddy;
# Result: { name: "Buddy", age: 5, breed: "Golden Retriever", goodBoy: true }
```

### Nested Class Instances

Use class instances as field values:

```bcon
class Coordinates [
    @lat: Number;
    @lon: Number;
];

class City [
    @name: String;
    @location: Coordinates;  # Type reference
];

use City [
    @name => "Warsaw";
    @location => Coordinates [
        @lat => 52.2297;
        @lon => 21.0122;
    ];
] as warsaw;
```

### Type Validation

Classes validate types at parse time:

```bcon
class Product [
    @name: String;
    @price: Number;
];

use Product [
    @name => "Book";
    @price => "free";  # ERROR! Type mismatch: expected Number, got string
] as product;
```

### Required Fields

Fields without `?` are required:

```bcon
class Book [
    @title: String;
    @author: String;
    @year?: Number;
];

use Book [
    @title => "1984";
    # ERROR! Missing required field "author"
] as book;
```

### Real-World Example

```bcon
# Define schemas
class Address [
    @street: String;
    @city: String;
    @country: String;
    @zipCode?: String;
];

class Company [
    @name: String;
    @founded: Date;
    @employees: Number;
    @headquarters: Address;
];

# Create instance with validation
use Company [
    @name => "TechCorp";
    @founded => "01-01-2020".date;
    @employees => 150;
    @headquarters => Address [
        @street => "123 Innovation Ave";
        @city => "San Francisco";
        @country => "USA";
        @zipCode => "94105";
    ];
] as company;

export company;
```

## Export Statement

**The `export` statement is required** in every BCON file (introduced in BCON 2.0).

### Why Export?

The `export` keyword:
- Makes code intent **explicit** and **clear**
- Improves **readability** by showing what's returned
- Provides **flexibility** - export objects, arrays, variables, or literals
- Aligns with **modern JavaScript** ES6 module syntax

### Export Syntax

```bcon
export value;
```

Where `value` can be:
- A dictionary (object)
- An array
- A variable
- A literal value

### Export Examples

**Export an object:**

```bcon
use "John Doe" as author;

export [
    @title => "My Document";
    @author => author;
    @year => 2025;
];
```

**Export an array:**

```bcon
export [
    @* => "red";
    @* => "green";
    @* => "blue";
];
```

**Export a variable:**

```bcon
use [
    @name => "Config";
    @version => "1.0.0";
] as config;

export config;
```

**Export a literal:**

```bcon
export "Hello, World!";
```

### Export Rules

- ✅ Every BCON file **must** contain an `export` statement
- ✅ `export` can export any value type
- ✅ `export` must be the **last statement** in the file
- ❌ Files without `export` will cause a syntax error

---

# API Reference

## Module Exports

The `bcon-parser` module exports the following methods:

```javascript
const BCON = require('bcon-parser');

console.log(Object.keys(BCON)); 
// Output: ["parse", "stringify", "init", "config"]
```

## `BCON.init(options)`

Initialize BCON with custom configuration.

### Parameters

- **`options`** (Object) - Configuration options
  - **`allowGlobal`** (Boolean) - Make BCON accessible globally as `global.BCON` (default: `false`)
  - **`allowRequire`** (Boolean) - Enable `require()` for `.bcon` files (default: `false`)
  - **`config`** (Object) - Configuration settings
    - **`defaultPath`** (String) - Base path for imports and requires (default: `__dirname`)
    - **`defaultEncoding`** (String) - Default file encoding (default: `'utf-8'`)

### Example

```javascript
BCON.init({
    allowGlobal: true,
    allowRequire: true,
    config: {
        defaultPath: __dirname,
        defaultEncoding: 'utf-8'
    }
});
```

### Using `allowRequire`

When enabled, you can directly require `.bcon` files:

```javascript
BCON.init({ allowRequire: true });

const config = require('./config.bcon');
console.log(config);
```

### Using `allowGlobal`

When enabled, BCON is accessible globally:

```javascript
BCON.init({ allowGlobal: true });

// Now accessible anywhere
const result = BCON.parse('export "Hello";');
```

## `BCON.parse(code)`

Parse BCON code string into JavaScript object.

### Parameters

- **`code`** (String) - BCON code to parse

### Returns

- (Any) - Parsed JavaScript value (object, array, string, number, etc.)

### Example

```javascript
const config = BCON.parse(`
    use "localhost" as host;
    use 3000 as port;
    
    export [
        @host => host;
        @port => port;
        @url => "http://[host]:[port]";
    ];
`);

console.log(config);
// Output: { host: 'localhost', port: 3000, url: 'http://localhost:3000' }
```

### Error Handling

```javascript
try {
    const result = BCON.parse(bconCode);
    console.log(result);
} catch (error) {
    console.error('Parse error:', error.message);
}
```

## `BCON.stringify(value, replacer, space)`

Convert JavaScript value to BCON format string. The output always includes the `export` keyword as required by BCON syntax.

### Parameters

- **`value`** (Any) - JavaScript value to stringify (must be an object or array)
- **`replacer`** (Function|null) - Optional replacer function for transforming values
- **`space`** (String|Number|null) - Indentation for formatting (default: 2 spaces)

### Returns

- (String) - BCON formatted string with `export` statement

### Examples

**Basic stringify:**

```javascript
const data = {
    name: "Alice",
    age: 30,
    active: true
};

const bcon = BCON.stringify(data);
console.log(bcon);
// Output:
// export [
//   @name => "Alice";
//   @age => 30;
//   @active => True;
// ];
```

**With custom indentation:**

```javascript
const data = { users: ["Alice", "Bob"] };

const bcon = BCON.stringify(data, null, '\t');
console.log(bcon);
// Output (with tabs):
// export [
// 	@users => [
// 		@* => "Alice";
// 		@* => "Bob";
// 	];
// ];
```

**Stringify array:**

```javascript
const users = [
    { username: "alice", role: "admin" },
    { username: "bob", role: "user" }
];

console.log(BCON.stringify(users));
// Output:
// export [
//   @* => [
//     @username => "alice";
//     @role => "admin";
//   ];
//   @* => [
//     @username => "bob";
//     @role => "user";
//   ];
// ];
```

## `BCON.config`

Access the current BCON configuration:

```javascript
console.log(BCON.config);
// Output:
// {
//   default_path: '/path/to/project',
//   default_encoding: 'utf-8'
// }
```

---

# Examples

## Complete Configuration File

**File: `app.bcon`**

```bcon
'Application Configuration
Main configuration file for the web application'

use "MyWebApp" as appName;
use "1.2.3" as version;
use "production" as environment;

use [
    @host => "localhost";
    @port => 5432;
    @username => "dbuser";
    @password => "securepass123";
    @database => "myapp_db";
] as database;

use [
    @* => "/api/v1";
    @* => "/api/v2";
] as apiVersions;

use [
    @jwt => [
        @secret => "jwt-secret-key-here";
        @expiresIn => "24h";
    ];
    @session => [
        @secret => "session-secret-key";
        @maxAge => 86400000;
    ];
] as security;

use "12-25-2025, 00:00:00.000".date as maintenanceStart;

export [
    @app => [
        @name => appName;
        @version => version;
        @environment => environment;
        @description => "[appName] v[version] running in [environment] mode";
    ];
    @server => [
        @host => "0.0.0.0";
        @port => 8080;
        @protocol => "http";
        @url => "[Main.server.protocol]://[Main.server.host]:[Main.server.port]";
    ];
    @database => database;
    @api => [
        @versions => apiVersions;
        @currentVersion => apiVersions.1;
        @baseUrl => "[Main.server.url][This.currentVersion]";
    ];
    @security => security;
    @maintenance => [
        @scheduled => maintenanceStart;
        @message => "Maintenance scheduled for [This.scheduled]";
    ];
    @features => [
        @authentication => True;
        @rateLimit => True;
        @caching => False;
        @logging => True;
    ];
];
```

**Usage in Node.js:**

```javascript
const BCON = require('bcon-parser');

BCON.init({
    allowRequire: true,
    config: { defaultPath: __dirname }
});

const config = require('./app.bcon');

console.log(config.app.name);           // "MyWebApp"
console.log(config.server.url);         // "http://0.0.0.0:8080"
console.log(config.api.baseUrl);        // "http://0.0.0.0:8080/api/v2"
console.log(config.database.host);      // "localhost"
console.log(config.features.caching);   // false
```

## Multi-File Configuration

**File: `database.bcon`**

```bcon
export [
    @host => "db.production.com";
    @port => 5432;
    @credentials => [
        @username => "admin";
        @password => "prod_password_123";
    ];
    @ssl => True;
    @poolSize => 20;
];
```

**File: `api.bcon`**

```bcon
import "./database.bcon".utf8 as dbConfig;

use [
    @* => "read";
    @* => "write";
    @* => "delete";
] as permissions;

export [
    @database => dbConfig;
    @permissions => permissions;
    @endpoints => [
        @users => "/api/users";
        @posts => "/api/posts";
        @comments => "/api/comments";
    ];
    @rateLimit => [
        @maxRequests => 100;
        @windowMs => 900000;
    ];
];
```

**Usage:**

```javascript
const BCON = require('bcon-parser');
const { readFileSync } = require('fs');

BCON.init({ config: { defaultPath: __dirname } });

const apiConfig = BCON.parse(readFileSync('./api.bcon', 'utf-8'));

console.log(apiConfig.database.host);      // "db.production.com"
console.log(apiConfig.permissions[0]);     // "read"
console.log(apiConfig.endpoints.users);    // "/api/users"
```

## Working with Complex Data

```bcon
use /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ as emailRegex;
use /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/ as passwordRegex;

use "01-01-2024, 00:00:00.000".date as serviceStartDate;
use "./terms.txt".utf8 as termsOfService;
use "./logo.png".base64 as appLogo;

use [
    @* => [
        @name => "Alice Johnson";
        @email => "alice@example.com";
        @role => "Administrator";
        @since => "03-15-2023, 09:00:00.000".date;
    ];
    @* => [
        @name => "Bob Smith";
        @email => "bob@example.com";
        @role => "Developer";
        @since => "06-20-2023, 10:30:00.000".date;
    ];
] as users;

export [
    @validation => [
        @email => emailRegex;
        @password => passwordRegex;
    ];
    @service => [
        @startDate => serviceStartDate;
        @uptime => Infinity;
    ];
    @users => users;
    @assets => [
        @logo => appLogo;
        @terms => termsOfService;
    ];
    @stats => [
        @totalUsers => 1e+6;
        @activeUsers => 750000;
        @storageUsed => 5.8e+12;
        @maxStorage => 1e+15;
    ];
];
```

## Converting JavaScript to BCON

```javascript
const BCON = require('bcon-parser');

// JavaScript object
const serverConfig = {
    name: "Production Server",
    host: "192.168.1.100",
    port: 443,
    ssl: true,
    certificates: {
        key: "./private.key",
        cert: "./certificate.crt"
    },
    allowedOrigins: [
        "https://example.com",
        "https://www.example.com"
    ],
    maxConnections: 1000,
    timeout: 30000,
    compression: true
};

// Convert to BCON
const bconString = BCON.stringify(serverConfig, null, 2);
console.log(bconString);

// Save to file
const fs = require('fs');
fs.writeFileSync('server.bcon', bconString);
```

**Output: `server.bcon`**

```bcon
export [
  @name => "Production Server";
  @host => "192.168.1.100";
  @port => 443;
  @ssl => True;
  @certificates => [
    @key => "./private.key";
    @cert => "./certificate.crt";
  ];
  @allowedOrigins => [
    @* => "https://example.com";
    @* => "https://www.example.com";
  ];
  @maxConnections => 1000;
  @timeout => 30000;
  @compression => True;
];
```

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to the [GitHub repository](https://github.com/parrotcore/bcon-parser).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Created by **parrotcore**

## Links

- **GitHub:** [github.com/parrotcore/bcon-parser](https://github.com/parrotcore/bcon-parser)
- **npm:** [npmjs.com/package/bcon-parser](https://www.npmjs.com/package/bcon-parser)
- **VS Code Extension:** [github.com/yobonez/vscode-bcon-highlighting](https://github.com/yobonez/vscode-bcon-highlighting)

---

<div align="center">

**Made with ❤️ by the BCON community**

</div>