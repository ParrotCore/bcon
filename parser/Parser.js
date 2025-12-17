/**
 * BCON Parser - Analiza składniowa
 * Tworzy AST (Abstract Syntax Tree) z tokenów
 */

const { existsSync, lstatSync } = require('node:fs');
const { resolve: resolvePath, join: joinPath } = require('node:path');

class Parser {
    constructor(tokens, source, config = {}) {
        this.tokens = tokens;
        this.source = source;
        this.pos = 0;
        this.config = config;
    }

    /**
     * Pobiera aktualny token
     */
    current() {
        return this.tokens[this.pos];
    }

    /**
     * Pobiera następny token i przesuwa pozycję
     */
    next() {
        return this.tokens[this.pos++];
    }

    /**
     * Sprawdza czy jest jeszcze token
     */
    hasNext() {
        return this.pos < this.tokens.length;
    }

    /**
     * Rzuca błąd składni
     */
    error(message, token = this.current()) {
        if (!token) {
            const lastToken = this.tokens[this.tokens.length - 1];
            throw new SyntaxError(
                `${message} (unexpected end of input after line ${lastToken?.line || 1})`
            );
        }
        throw new SyntaxError(
            `${message} at line ${token.line}, column ${token.column} (got "${token.value}")`
        );
    }

    /**
     * Oczekuje określonego typu tokena
     */
    expect(type, errorMessage) {
        const token = this.next();
        if (!token) {
            this.error(errorMessage || `Expected ${type}, got end of input`);
        }
        if (token.type !== type) {
            this.error(errorMessage || `Expected ${type}`, token);
        }
        return token;
    }

    /**
     * Sprawdza typ aktualnego tokena bez przesuwania
     */
    check(type) {
        const token = this.current();
        return token && token.type === type;
    }

    /**
     * Parsuje cały moduł BCON
     */
    parse() {
        const ast = {
            type: 'Module',
            imports: [],
            uses: [],
            body: null,
            hasExplicitExport: false
        };

        // Parsuj import i use
        while (this.hasNext()) {
            const token = this.current();
            
            if (token.type === 'IMPORT') {
                ast.imports.push(this.parseImport());
            } else if (token.type === 'USE') {
                ast.uses.push(this.parseUse());
            } else if (token.type === 'EXPORT') {
                // export keyword - parsuj wartość eksportu
                this.next();
                ast.hasExplicitExport = true;
                ast.body = this.parseValue();
                this.expect('SEMICOLON', 'Expected semicolon after export');
                break;
            } else {
                this.error('Expected import, use, or export', token);
            }
        }

        return ast;
    }

    /**
     * Parsuje wyrażenie import
     */
    parseImport() {
        this.expect('IMPORT');
        
        // Jeśli zaczyna się od [, parsuj najpierw i sprawdź 'as' czy 'from'
        if (this.check('LBRACKET')) {
            // Zapamietaj pozycję
            const startPos = this.pos;
            
            // Parsuj jako binding (destrukturyzacja)
            const possibleBinding = this.parseBinding();
            
            if (this.check('FROM')) {
                // import [ bindings ] from file;
                this.next(); // skip 'from'
                const file = this.expect('FILE', 'Expected file literal after from');
                this.expect('SEMICOLON', 'Expected semicolon after import');
                
                const fileInfo = this.parseFileLiteral(file);
                return {
                    type: 'ImportDeclaration',
                    source: fileInfo,
                    binding: possibleBinding,
                    token: file
                };
            } else {
                this.error('Expected "from" after [bindings]', this.current());
            }
        } else {
            // import file as binding;
            const file = this.expect('FILE', 'Expected file literal after import');
            this.expect('AS', 'Expected "as" after file');
            const binding = this.parseBinding();
            this.expect('SEMICOLON', 'Expected semicolon after import');
            
            const fileInfo = this.parseFileLiteral(file);
            return {
                type: 'ImportDeclaration',
                source: fileInfo,
                binding,
                token: file
            };
        }
    }

    /**
     * Parsuje wyrażenie use
     */
    parseUse() {
        this.expect('USE');
        
        // Jeśli zaczyna się od [, musimy sprawdzić, czy to destrukturyzacja czy wartość
        if (this.check('LBRACKET')) {
            // Zajrzyj do środka, aby określić, czy to destrukturyzacja czy obiekt/tablica
            const nextToken = this.tokens[this.pos + 1];
            const isDestructuring = nextToken && 
                (nextToken.type === 'IDENTIFIER' || nextToken.type === 'LBRACKET' || nextToken.type === 'SEMICOLON');
            
            if (isDestructuring) {
                // Sprawdź jeszcze dokładniej - jeśli ma @key to na pewno wartość, nie destrukturyzacja
                const hasObjectKeys = nextToken.type === 'ASSOC_KEY' || nextToken.type === 'NUMERIC_KEY';
                
                if (!hasObjectKeys) {
                    // use [ bindings ] from value;
                    const binding = this.parseBinding();
                    
                    if (this.check('FROM')) {
                        this.next(); // skip 'from'
                        const value = this.parseValue();
                        this.expect('SEMICOLON', 'Expected semicolon after use');
                        
                        return {
                            type: 'UseDeclaration',
                            value,
                            binding
                        };
                    } else if (this.check('AS')) {
                        // To jednak była wartość - błąd w logice, ale spróbuj obsłużyć
                        this.error('Cannot use destructuring syntax with "as" keyword', this.current());
                    } else {
                        this.error('Expected "from" after bindings', this.current());
                    }
                }
            }
            
            // use [value] as binding;
            const value = this.parseValue();
            this.expect('AS', 'Expected "as" after value');
            const binding = this.parseBinding();
            this.expect('SEMICOLON', 'Expected semicolon after use');
            
            return {
                type: 'UseDeclaration',
                value,
                binding
            };
        } else {
            // use value as binding;
            const value = this.parseValue();
            this.expect('AS', 'Expected "as" after value');
            const binding = this.parseBinding();
            this.expect('SEMICOLON', 'Expected semicolon after use');
            
            return {
                type: 'UseDeclaration',
                value,
                binding
            };
        }
    }

    /**
     * Parsuje binding (nazwa lub destrukturyzacja)
     */
    parseBinding() {
        const token = this.current();
        
        if (token.type === 'IDENTIFIER') {
            this.next();
            return {
                type: 'Identifier',
                name: token.value
            };
        } else if (token.type === 'LBRACKET') {
            return this.parseDestructuring();
        } else {
            this.error('Expected identifier or [', token);
        }
    }

    /**
     * Parsuje destrukturyzację
     */
    parseDestructuring(path = []) {
        this.expect('LBRACKET');
        const bindings = [];
        let arrayIndex = 0;

        while (this.hasNext() && !this.check('RBRACKET')) {
            const token = this.current();
            
            if (token.type === 'IDENTIFIER') {
                const name = token.value;
                this.next();

                if (this.check('ARROW')) {
                    // alias => źródło
                    this.next();
                    const source = this.current();
                    
                    if (source.type === 'IDENTIFIER') {
                        this.next();
                        bindings.push({
                            type: 'DestructuringBinding',
                            alias: source.value,
                            path: [...path, name]
                        });
                        this.expect('SEMICOLON', 'Expected semicolon in destructuring');
                    } else if (source.type === 'LBRACKET') {
                        // Zagnieżdżona destrukturyzacja
                        const nested = this.parseDestructuring([...path, name]);
                        bindings.push(...nested.bindings);
                        // Semicolon jest już obsłużony w rekurencji
                    } else {
                        this.error('Expected identifier or [ after =>', source);
                    }
                } else if (this.check('SEMICOLON')) {
                    // Prosta binding - dla tablicy użyj indeksu
                    bindings.push({
                        type: 'DestructuringBinding',
                        alias: name,
                        path: [...path, arrayIndex.toString()]
                    });
                    arrayIndex++;
                    this.next(); // skip semicolon
                } else {
                    this.error('Expected => or ; after identifier', this.current());
                }
            } else if (token.type === 'LBRACKET') {
                // Array destructuring
                const nested = this.parseDestructuring([...path, arrayIndex.toString()]);
                bindings.push(...nested.bindings);
                arrayIndex++;
            } else if (token.type === 'SEMICOLON') {
                // Pusty element
                this.next();
                arrayIndex++;
            } else if (token.type === 'SKIP') {
                // Słowo kluczowe 'skip' - pomin element
                this.next();
                this.expect('SEMICOLON', 'Expected semicolon after skip');
                arrayIndex++;
            } else {
                this.error('Expected identifier, [, skip, or ;', token);
            }
        }

        this.expect('RBRACKET');

        return {
            type: 'Destructuring',
            bindings
        };
    }

    /**
     * Parsuje wartość (literal, identifier, path, lub obiekt)
     */
    parseValue() {
        const token = this.current();
        
        if (!token) {
            this.error('Expected value');
        }

        // Obiekty i tablice
        if (token.type === 'LBRACKET') {
            return this.parseObject();
        }

        // Literały
        if (this.isLiteral(token)) {
            this.next();
            return this.parseLiteral(token);
        }

        // Path (Main.property.nested)
        if (token.type === 'PATH') {
            this.next();
            return {
                type: 'Path',
                path: token.value,
                token
            };
        }

        // Identifier
        if (token.type === 'IDENTIFIER') {
            this.next();
            return {
                type: 'Identifier',
                name: token.value,
                token
            };
        }

        this.error('Expected value', token);
    }

    /**
     * Sprawdza czy token jest literałem
     */
    isLiteral(token) {
        return ['STRING', 'NUMBER', 'BIGINT', 'BOOLEAN', 'NULL', 
                'UNDEFINED', 'DATE', 'FILE', 'REGEXP'].includes(token.type);
    }

    /**
     * Parsuje obiekt lub tablicę
     */
    parseObject() {
        this.expect('LBRACKET');
        const properties = [];
        let arrayIndex = 0;
        let isArray = null; // null = nieznane, true = array, false = object

        while (this.hasNext() && !this.check('RBRACKET')) {
            const keyToken = this.current();
            
            // Wykryj typ (array vs object)
            if (keyToken.type === 'NUMERIC_KEY') {
                if (isArray === false) {
                    this.error('Cannot mix array and object syntax', keyToken);
                }
                isArray = true;
            } else if (keyToken.type === 'ASSOC_KEY') {
                if (isArray === true) {
                    this.error('Cannot mix array and object syntax', keyToken);
                }
                isArray = false;
            } else {
                this.error('Expected @key or @*', keyToken);
            }

            this.next(); // skip key token
            this.expect('ARROW', 'Expected =>');
            
            const value = this.parseValue();
            this.expect('SEMICOLON', 'Expected semicolon after property');

            const key = keyToken.type === 'NUMERIC_KEY' 
                ? arrayIndex++ 
                : keyToken.value.substring(1); // remove @

            properties.push({
                type: 'Property',
                key,
                value,
                keyToken
            });
        }

        this.expect('RBRACKET');

        return {
            type: isArray ? 'ArrayExpression' : 'ObjectExpression',
            properties
        };
    }

    /**
     * Parsuje literał i zwraca node AST z wartością
     */
    parseLiteral(token) {
        const node = {
            type: 'Literal',
            valueType: token.type,
            raw: token.value,
            token
        };

        switch (token.type) {
            case 'STRING':
                node.value = token.value.slice(1, -1); // usuń cudzysłowy
                break;

            case 'NUMBER':
                node.value = this.parseNumber(token.value);
                break;

            case 'BIGINT':
                node.value = BigInt(token.value.slice(0, -1));
                break;

            case 'BOOLEAN':
                node.value = token.value === 'True';
                break;

            case 'NULL':
                node.value = null;
                break;

            case 'UNDEFINED':
                node.value = undefined;
                break;

            case 'DATE':
                node.value = this.parseDateLiteral(token);
                break;

            case 'FILE':
                node.value = this.parseFileLiteral(token);
                break;

            case 'REGEXP':
                node.value = this.parseRegExpLiteral(token);
                break;

            default:
                this.error('Unknown literal type', token);
        }

        return node;
    }

    /**
     * Parsuje liczby (obsługuje ES2023 notacje)
     */
    parseNumber(str) {
        // Usuń podkreślenia
        str = str.replace(/_/g, '');
        return Number(str);
    }

    /**
     * Parsuje literał daty
     */
    parseDateLiteral(token) {
        const dateStr = token.value.slice(1, -6); // usuń " i ".date
        return new Date(dateStr);
    }

    /**
     * Parsuje literał pliku
     */
    parseFileLiteral(token) {
        const parts = token.value.match(/"(.+)"\.(.+)/);
        if (!parts) {
            this.error('Invalid file literal format', token);
        }

        const [, pathStr, encoding] = parts;
        const normalizedEncoding = encoding.replace(/-/g, '');

        // Sprawdź encoding
        if (!Buffer.isEncoding(normalizedEncoding)) {
            throw new Error(
                `Unknown encoding "${encoding}" at line ${token.line}, column ${token.column}`
            );
        }

        // Rozwiąż ścieżkę
        const absolutePath = resolvePath(pathStr) === pathStr
            ? pathStr
            : joinPath(this.config.defaultPath || process.cwd(), pathStr);

        // Sprawdź istnienie pliku
        if (!existsSync(absolutePath)) {
            throw new Error(
                `File "${absolutePath}" does not exist at line ${token.line}, column ${token.column}`
            );
        }

        // Sprawdź czy to plik
        const stats = lstatSync(absolutePath);
        if (!stats.isFile()) {
            throw new TypeError(
                `"${absolutePath}" is not a file at line ${token.line}, column ${token.column}`
            );
        }

        return {
            path: absolutePath,
            encoding: normalizedEncoding
        };
    }

    /**
     * Parsuje literał RegExp
     */
    parseRegExpLiteral(token) {
        const match = token.value.match(/^\/(.*)\/([igsmuy]*)$/);
        if (!match) {
            this.error('Invalid RegExp literal', token);
        }

        const [, pattern, flags] = match;
        return new RegExp(pattern, flags);
    }
}

module.exports = Parser;
