# Migracja do ES Modules (ESM)

Ten dokument opisuje jak zmigrować kod BCON Parser z CommonJS na ES Modules.

## Różnice między CommonJS a ESM

### CommonJS (dotychczasowe)
```javascript
const BCON = require('bcon-parser');

BCON.init({ allowRequire: true });
const config = require('./config.bcon');
```

### ES Modules (nowe)
```javascript
import BCON from 'bcon-parser';
// lub
import { parse, stringify, init } from 'bcon-parser';

// Ładowanie plików .bcon wymaga manualnego parsowania
import { readFileSync } from 'fs';
const config = parse(readFileSync('./config.bcon', 'utf-8'));
```

## Krok po kroku

### 1. Zmień rozszerzenie pliku
Opcjonalnie zmień `.js` na `.mjs` lub dodaj `"type": "module"` do `package.json`.

**Opcja A - Używaj `.mjs`:**
```bash
mv app.js app.mjs
```

**Opcja B - Dodaj do package.json:**
```json
{
  "type": "module"
}
```

### 2. Zamień require na import

**Przed (CommonJS):**
```javascript
const BCON = require('bcon-parser');
const fs = require('fs');
const path = require('path');
```

**Po (ESM):**
```javascript
import BCON from 'bcon-parser';
import { readFileSync } from 'fs';
import { join } from 'path';
```

### 3. Zamień module.exports na export

**Przed (CommonJS):**
```javascript
module.exports = myFunction;
// lub
module.exports = {
    myFunction,
    myVariable
};
```

**Po (ESM):**
```javascript
export default myFunction;
// lub
export { myFunction, myVariable };
```

### 4. Ładowanie plików .bcon

**Przed (CommonJS z allowRequire):**
```javascript
BCON.init({ allowRequire: true });
const config = require('./config.bcon');
```

**Po (ESM):**
```javascript
import { readFileSync } from 'fs';
import { parse } from 'bcon-parser';

const configContent = readFileSync('./config.bcon', 'utf-8');
const config = parse(configContent);
```

### 5. Użycie __dirname i __filename

ESM nie ma `__dirname` i `__filename`. Użyj `import.meta.url`:

**Przed (CommonJS):**
```javascript
const configPath = path.join(__dirname, 'config.bcon');
```

**Po (ESM):**
```javascript
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, 'config.bcon');
```

## Przykład pełnej migracji

### Przed (CommonJS)
```javascript
// app.js
const BCON = require('bcon-parser');
const path = require('path');

BCON.init({
    allowRequire: true,
    config: {
        defaultPath: __dirname
    }
});

const config = require('./config.bcon');

function processConfig() {
    console.log('Config:', config);
    return BCON.stringify(config);
}

module.exports = { processConfig };
```

### Po (ESM)
```javascript
// app.mjs
import BCON from 'bcon-parser';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

BCON.init({
    config: {
        defaultPath: __dirname
    }
});

const configContent = readFileSync(join(__dirname, 'config.bcon'), 'utf-8');
const config = BCON.parse(configContent);

function processConfig() {
    console.log('Config:', config);
    return BCON.stringify(config);
}

export { processConfig };
```

## Dlaczego warto migrować?

1. **Nowoczesny standard** - ESM to oficjalny standard JavaScript
2. **Lepsza wydajność** - Static imports pozwalają na tree-shaking
3. **Lepsze narzędzia** - Większość nowoczesnych bundlerów preferuje ESM
4. **Przyszłość** - Node.js skupia się na ESM

## Kompatybilność wsteczna

BCON Parser nadal w pełni wspiera CommonJS! Możesz używać obu systemów jednocześnie:
- CommonJS: `const BCON = require('bcon-parser');`
- ESM: `import BCON from 'bcon-parser';`

Nie musisz migrować od razu - oba systemy będą wspierane.
