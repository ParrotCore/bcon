# BCON Parser - Wsparcie dla ES Modules

## Krótki przewodnik

BCON Parser od wersji 1.1.0 wspiera **zarówno CommonJS jak i ES Modules (ESM)**!

### Instalacja
```bash
npm install bcon-parser
```

### Użycie - CommonJS
```javascript
const BCON = require('bcon-parser');

const config = BCON.parse(`
    use "localhost" as host;
    export [@host => host];
`);
```

### Użycie - ES Modules
```javascript
import BCON from 'bcon-parser';
// lub: import { parse, stringify } from 'bcon-parser';

const config = BCON.parse(`
    use "localhost" as host;
    export [@host => host];
`);
```

### Nowe funkcjonalności

#### 1. Import/Export ESM
```javascript
// default export
import BCON from 'bcon-parser';

// named exports
import { parse, stringify, init } from 'bcon-parser';
```

#### 2. Poprawiona destrukturyzacja
```javascript
// Słowo kluczowe 'skip' działa teraz poprawnie
const result = parse(`
    use [@* => "a"; @* => "b"; @* => "c"] as arr;
    use [skip; skip; third] from arr;
    export third;
`);
// result === "c"
```

#### 3. Ostatni element bez średnika
```javascript
// Można pominąć średnik po ostatnim elemencie
const result = parse(`
    use [@* => 1; @* => 2; @* => 3] as nums;
    use [first; second] from nums;  // ← brak średnika po 'second'
    export first;
`);
```

### Ładowanie plików .bcon

**CommonJS:**
```javascript
BCON.init({ allowRequire: true });
const config = require('./config.bcon');
```

**ESM:**
```javascript
import { readFileSync } from 'fs';
import { parse } from 'bcon-parser';

const config = parse(readFileSync('./config.bcon', 'utf-8'));
```

### Przykładowe pliki

- `example-esm.mjs` - Przykład użycia ESM
- `test-esm.mjs` - Testy dla wersji ESM
- `ESM-MIGRATION.md` - Szczegółowy przewodnik migracji

### Dokumentacja

Pełna dokumentacja znajduje się w [README.md](README.md).

### Kompatybilność

- ✅ Node.js 14+ (ESM)
- ✅ Node.js 12+ (CommonJS)
- ✅ Dual package - oba systemy działają jednocześnie
- ✅ Pełna kompatybilność wsteczna

---

**Pytania?** Zobacz [ESM-MIGRATION.md](ESM-MIGRATION.md) lub [README.md](README.md)
