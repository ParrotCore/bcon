# BCON - BCON Configures Only Nicely

## Overview

**BCON** is a programming language designed specifically for defining and storing complex project configurations in a human-readable format while retaining the advanced features of programming languages.<br />

## Key Features

- Simple and intuitive syntax for easy readability and writing
- Support for single-line and multi-line comments
- Multi-line strings with interpolation
- Built-in support for `RegExp`, `Date`, and `File` types
- Full support for numeric notations as defined in `ES2023`
- Data structuring using **arrays** and **dictionaries**
- **No arithmetic operations** – BCON is focused purely on **declarative value definitions**

## Syntax Highlighting

A dedicated BCON syntax highlighter for `VSCode`, created by **yobonez**, is available.

- **Extension Name:** `BCON Syntax Highlighting`
- **Download:** [GitHub Repository](https://github.com/yobonez/vscode-bcon-highlighting)

![BKON Icon](https://github.com/ParrotCore/bcon/raw/master/icon.png?raw=true)

---

# Syntax Guide

## Comments

- **Multi-line comment:**

```bcon
'This is a multi-
-line comment.'
```

- **Single-line comment:**

```bcon
# This comment spans only the current line.
```

## Data Types

- **Files:** `"./path/to/file.extension".encoding` (e.g., `"./keywords.txt".utf8`)
- **Strings:** `"Your message: [`**Main.users[0].username**`]!"`
- **Dates:** `"MM-DD-YYYY, HH:MM:SS.MS".date` (e.g., `"01-01-1970, 12:43:13.773".date`)
- **Regular Expressions:** `/pattern/flags` (e.g., `/[abc]+/gi`)
- **Numbers:** Supports all numeric formats from `ES2023`, including:
  - `0xNN...N` [hexadecimal],
  - `0oNN...N` [octagonal],
  - `0bNN...N` [binary],
  - `Ne+NN`,
  - `Ne-NN`,
  - `N.N`,
  - `.N`,
  - `M`,
  - negative numbers (`-N`), etc.
- **BigInts:** `Nn`, e.g. `99721376669331060n`,
- **Keywords:**
  - `Undefined`,
  - `Null`,
  - `NaN`,
  - `False`,
  - `True`,
  - `Infinity`

## Data Structures

- **Dictionaries:**

```bcon
[
	@key => value;
];
```

- **Arrays:**

```bcon
[
	@* => value;
];
```

## Expressions

### Importing Files

```bcon
# Import data from a BCON file and store it as a variable.
import "./path/to/file.bcon".utf8 as IDENTIFIER;
```

### Defining Variables

```bcon
# Assign a value to a variable.
use 0xFF00CC as color;

# Assign dictionaries or arrays:
use [
	@key => "Hello";
] as dictionary;

use [
	@* => "World!";
] as array;
```

## Destructuring

Destructuring allows extracting specific values from dictionaries, arrays, or imported files.

### Dictionary Destructuring

```bcon
use [
	@username => "LenaKrukov1997";
	@age => 22;
] as user;

# Extract the "age" key into a separate variable.
use user as [
	age;
];

# Assign "age" to an alias variable.
use user as [
	age => ALIAS;
];
```

### Array Destructuring

```bcon
use [
	@* => "Hello";
	@* => "World!";
] as hello_world;

# Extract the first element into a variable.
use hello_world as [
	hello;
];

# Extract the second element into a separate variable.
use hello_world as [
	;
	world;
];
```

### File Import Destructuring

```bcon
# Example content of "./db-config.bcon":
[
	@hash => "SHA-256";
	@ip_address => 127.0.0.1;
	@users => [
		@* => [
			@username => "root";
			@password => "PsswdHR1234!";
		];
	];
];

# Example content of "./config.bcon":
import "./db-config.bcon".utf8 as [
	users => [
		[
			username => ADMIN_USERNAME;
			password => ADMIN_PASSWORD;
		];
	];
];
```

## Variable References

- **BCON is case-sensitive** (`IDENTIFIER` ≠ `Identifier`).
- Access dictionary/array elements: `dictionary.key1`, `dictionary[0].key1`, etc.
- The `Main` object contains the **entire parsed configuration**.
- The `This` object represents the **currently parsed section**.
- String interpolation allows embedding values: `"Hello, [Main.user.username]!"`.

---

# BCON Parser

## Installation & Setup

Once you install `bcon-parser`, initialize it as follows:

```js
const BCON = require('bcon-parser');

console.log(Object.keys(BCON)); // ["parse", "stringify", "init"]
```

Initialize the parser with custom settings:

```js
BCON.init({
	allowRequire: false, // Enable if you want to `require()` BCON files.
	allowGlobal: false, // Enable if you want BCON to be accessible globally.
	config: {
		defaultPath: __dirname, // Base path for imports and requires.
		defaultEncoding: 'utf-8' // Encoding used for file imports.
	}
});
```

## Parsing BCON Files

Parsing BCON is as simple as using JSON in Node.js:

```js
BCON.parse(`
use "v3.0.0" as version;

use [
	@privateKey => "./private.key".bin;
	@publicKey => "./public.key".bin;
] as keys;

import "./database.bcon".utf8 as [
	host => dbHost;
	port => dbPort;
];

[
	@version => version;
	@admin => [
		@username => "root";
		@password => "Q@wertyuiop";
	];
	@keys => keys;
	@greeting => "Hello, [Main.admin.username]! The server is running on [dbHost]:[dbPort], its version is [version].";
	@database => [
		@host => dbHost;
		@port => dbPort;
		@username => Main.admin.username;
		@password => Main.admin.password;
	];
	@localhostDirectory => "./views";
	@maxPasswordLength => 128;
	@passwordRegex => /[^a-zA-Z0-9!@#$%^&*(){}\[\];"'\/\\.,]/g;
];
`);
```

## Stringifying JavaScript Objects

Convert JavaScript objects to BCON format:

```js
BCON.stringify([
	{
		username: "JohnDoe",
		age: 24,
		email: "john.doe@example.com",
		password: "password",
		favRegexp: /[abc]+/
	},
], null, '\t');
```

This results in:

```bcon
[
	@* => [
		@username => "JohnDoe";
		@age => 24;
		@email => "john.doe@example.com";
		@password => "password";
		@favRegexp => /[abc]+/;
	];
];
```

