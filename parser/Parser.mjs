/**
 * BCON Parser - Syntax Analysis
 * Creates AST (Abstract Syntax Tree) from tokens
 */

import { existsSync, lstatSync } from 'node:fs';
import { resolve as resolvePath, join as joinPath } from 'node:path';

class Parser {
    constructor(tokens, source, config = {}) {
        this.tokens = tokens;
        this.source = source;
        this.pos = 0;
        this.config = config;
    }

    /**
     * Gets current token
     */
    current() {
        return this.tokens[this.pos];
    }

    /**
     * Gets next token and advances position
     */
    next() {
        return this.tokens[this.pos++];
    }

    /**
     * Checks if there are more tokens
     */
    hasNext() {
        return this.pos < this.tokens.length;
    }

    /**
     * Throws syntax error
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
     * Expects specific token type
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
     * Checks current token type without advancing
     */
    check(type) {
        const token = this.tokens[this.pos];
        return token && token.type === type;
    }
    
    /**
     * Checks if current token is one of the given types
     */
    checkAny(...types) {
        const token = this.tokens[this.pos];
        return token && types.includes(token.type);
    }

    /**
     * Parses complete BCON module
     */
    parse() {
        const ast = {
            type: 'Module',
            imports: [],
            uses: [],
            classes: [],
            body: null,
            hasExplicitExport: false
        };

        // Parse import, use, class and loose expressions
        while (this.hasNext()) {
            const token = this.current();
            
            if (token.type === 'IMPORT') {
                ast.imports.push(this.parseImport());
            } else if (token.type === 'CLASS') {
                ast.classes.push(this.parseClass());
            } else if (token.type === 'USE') {
                ast.uses.push(this.parseUse());
            } else if (token.type === 'EXPORT') {
                // export keyword - parse export value
                this.next();
                ast.hasExplicitExport = true;
                ast.body = this.parseValue();
                this.expect('SEMICOLON', 'Expected semicolon after export');
                break;
            } else {
                // Allow loose expressions (unused values) - parse and ignore
                try {
                    this.parseValue();
                    this.expect('SEMICOLON', 'Expected semicolon after expression');
                    // Expression will be ignored - not added to AST
                } catch (e) {
                    // If can't be parsed as value, it's a real error
                    this.error('Expected import, class, use, export, or valid expression', token);
                }
            }
        }

        return ast;
    }

    /**
     * Parses import expression
     */
    parseImport() {
        this.expect('IMPORT');
        
        // If starts with [, parse first and check for 'as' or 'from'
        if (this.check('LBRACKET')) {
            // Remember position
            const startPos = this.pos;
            
            // Parse as binding (destructuring)
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
     * Parses use expression
     */
    parseUse() {
        this.expect('USE');
        
        // If starts with [, we need to check if it's destructuring or value
        if (this.check('LBRACKET')) {
            // Peek inside to determine if it's destructuring or object/array
            const nextToken = this.tokens[this.pos + 1];
            const isDestructuring = nextToken && 
                (nextToken.type === 'IDENTIFIER' || nextToken.type === 'LBRACKET' || nextToken.type === 'SEMICOLON' || nextToken.type === 'SKIP');
            
            if (isDestructuring) {
                // Check more carefully - if it has @key it's definitely a value, not destructuring
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
                        // This was actually a value - logic error, but try to handle
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
        } else if (this.check('IDENTIFIER')) {
            // Może to być: use ClassName(...) as binding lub use value as binding
            const idToken = this.current();
            const className = idToken.value;
            this.next();
            
            // Sprawdź czy jest wywołanie konstruktora
            if (this.check('LPAREN')) {
                const args = this.parseArguments();
                this.expect('AS', 'Expected "as" after constructor call');
                const binding = this.parseBinding();
                this.expect('SEMICOLON', 'Expected semicolon after use');
                
                return {
                    type: 'UseDeclaration',
                    value: {
                        type: 'ConstructorCall',
                        className,
                        arguments: args,
                        token: idToken
                    },
                    binding
                };
            } else if (this.check('LBRACKET')) {
                // use ClassName [value] as binding - walidator
                const obj = this.parseObject();
                this.expect('AS', 'Expected "as" after value');
                const binding = this.parseBinding();
                this.expect('SEMICOLON', 'Expected semicolon after use');
                
                return {
                    type: 'UseDeclaration',
                    value: {
                        type: 'ClassInstance',
                        className,
                        value: obj,
                        token: idToken
                    },
                    binding
                };
            } else {
                // use identifier as binding - referencja do zmiennej
                this.expect('AS', 'Expected "as" after identifier');
                const binding = this.parseBinding();
                this.expect('SEMICOLON', 'Expected semicolon after use');
                
                return {
                    type: 'UseDeclaration',
                    value: {
                        type: 'Identifier',
                        name: className,
                        token: idToken
                    },
                    binding
                };
            }
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
     * Parses call arguments (constructor)
     */
    parseArguments() {
        this.expect('LPAREN');
        const args = [];
        
        while (this.hasNext() && !this.check('RPAREN')) {
            const arg = this.parseArgument();
            args.push(arg);
            
            if (this.check('COMMA')) {
                this.next();
            } else if (!this.check('RPAREN')) {
                this.error('Expected , or ) in argument list');
            }
        }
        
        this.expect('RPAREN');
        return args;
    }

    /**
     * Parses single argument
     */
    parseArgument() {
        let isSpread = false;
        
        if (this.check('SPREAD')) {
            this.next();
            isSpread = true;
        }
        
        const value = this.parseExpression();
        
        return {
            type: 'Argument',
            value,
            isSpread
        };
    }

    /**
     * Parses binding (name or destructuring)
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
     * Parses destructuring
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
                    // alias => source
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
                        // Nested destructuring
                        const nested = this.parseDestructuring([...path, name]);
                        bindings.push(...nested.bindings);
                        // Semicolon already handled in recursion
                    } else {
                        this.error('Expected identifier or [ after =>', source);
                    }
                } else if (this.check('SEMICOLON')) {
                    // Simple binding - for array use index
                    bindings.push({
                        type: 'DestructuringBinding',
                        alias: name,
                        path: [...path, arrayIndex.toString()]
                    });
                    arrayIndex++;
                    this.next(); // skip semicolon
                } else if (this.check('RBRACKET')) {
                    // Last element without semicolon
                    bindings.push({
                        type: 'DestructuringBinding',
                        alias: name,
                        path: [...path, arrayIndex.toString()]
                    });
                    arrayIndex++;
                } else {
                    this.error('Expected => or ; or ] after identifier', this.current());
                }
            } else if (token.type === 'LBRACKET') {
                // Array destructuring
                const nested = this.parseDestructuring([...path, arrayIndex.toString()]);
                bindings.push(...nested.bindings);
                arrayIndex++;
            } else if (token.type === 'SEMICOLON') {
                // Empty element
                this.next();
                arrayIndex++;
            } else if (token.type === 'SKIP') {
                // Skip keyword - skip element
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
     * Parses value (literal, identifier, path, or object)
     */
    parseValue() {
        return this.parseExpression();
    }

    /**
     * Parses expression with ? operator (nullish coalescing)
     */
    parseExpression() {
        let left = this.parsePrimaryValue();
        
        // Handle ? operator (returns left side if exists, right otherwise)
        if (this.check('QUESTION')) {
            this.next();
            const right = this.parsePrimaryValue();
            return {
                type: 'ConditionalExpression',
                left,
                right
            };
        }
        
        return left;
    }

    /**
     * Parses primary value
     */
    parsePrimaryValue() {
        const token = this.current();
        
        if (!token) {
            this.error('Expected value');
        }

        // Objects and arrays
        if (token.type === 'LBRACKET') {
            return this.parseObject();
        }

        // Literals
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
            const name = token.value;
            this.next();
            
            // Check if identifier is followed by ( - might be constructor
            if (this.check('LPAREN')) {
                const args = this.parseArguments();
                return {
                    type: 'ConstructorCall',
                    className: name,
                    arguments: args,
                    token
                };
            }
            
            // Check if identifier is followed by [ - might be class instance
            if (this.check('LBRACKET')) {
                const obj = this.parseObject();
                return {
                    type: 'ClassInstance',
                    className: name,
                    value: obj,
                    token
                };
            }
            
            return {
                type: 'Identifier',
                name: name,
                token
            };
        }

        this.error('Expected value', token);
    }

    /**
     * Checks if token is a literal
     */
    isLiteral(token) {
        return ['STRING', 'NUMBER', 'BIGINT', 'BOOLEAN', 'NULL', 
                'UNDEFINED', 'DATE', 'FILE', 'REGEXP'].includes(token.type);
    }

    /**
     * Parses object or array
     */
    parseObject() {
        this.expect('LBRACKET');
        const properties = [];
        let arrayIndex = 0;
        let isArray = null; // null = nieznane, true = array, false = object

        while (this.hasNext() && !this.check('RBRACKET')) {
            const keyToken = this.current();
            
            // Handle spread operator (for arrays and objects)
            if (keyToken.type === 'SPREAD') {
                // Allow spread in arrays or when type is not yet determined
                if (isArray === null) {
                    // We'll need to determine type based on spread value
                    // For now allow spread
                }
                
                this.next(); // skip ...
                const value = this.parseExpression();
                this.expect('SEMICOLON', 'Expected semicolon after spread');
                
                properties.push({
                    type: 'SpreadElement',
                    argument: value,
                    keyToken
                });
                continue;
            }
            
            // Detect type (array vs object)
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
            type: isArray === true ? 'ArrayExpression' : (isArray === false ? 'ObjectExpression' : 'UnknownExpression'),
            properties,
            isArray // Przekaż flagę do Evaluatora
        };
    }

    /**
     * Parses literal and returns AST node with value
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
                node.value = token.value.slice(1, -1); // remove quotes
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
     * Parses numbers (supports ES2023 notations)
     */
    parseNumber(str) {
        // Remove underscores
        str = str.replace(/_/g, '');
        return Number(str);
    }

    /**
     * Parses date literal
     */
    parseDateLiteral(token) {
        const dateStr = token.value.slice(1, -6); // usuń " i ".date
        return new Date(dateStr);
    }

    /**
     * Parses file literal
     */
    parseFileLiteral(token) {
        const parts = token.value.match(/"(.+)"\.(.+)/);
        if (!parts) {
            this.error('Invalid file literal format', token);
        }

        const [, pathStr, encoding] = parts;
        const normalizedEncoding = encoding.replace(/-/g, '');

        // Check encoding
        if (!Buffer.isEncoding(normalizedEncoding)) {
            throw new Error(
                `Unknown encoding "${encoding}" at line ${token.line}, column ${token.column}`
            );
        }

        // Resolve path
        const absolutePath = resolvePath(pathStr) === pathStr
            ? pathStr
            : joinPath(this.config.defaultPath || process.cwd(), pathStr);

        // Check file existence
        if (!existsSync(absolutePath)) {
            throw new Error(
                `File "${absolutePath}" does not exist at line ${token.line}, column ${token.column}`
            );
        }

        // Check if it's a file
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
     * Parses RegExp literal
     */
    parseRegExpLiteral(token) {
        const match = token.value.match(/^\/(.*)\/([igsmuy]*)$/);
        if (!match) {
            this.error('Invalid RegExp literal', token);
        }

        const [, pattern, flags] = match;
        return new RegExp(pattern, flags);
    }

    /**
     * Parses class definition
     */
    parseClass() {
        this.expect('CLASS');
        
        const nameToken = this.expect('IDENTIFIER', 'Expected class name');
        const className = nameToken.value;
        
        // Constructor parameters (optional)
        let parameters = [];
        if (this.check('LPAREN')) {
            parameters = this.parseClassParameters();
        }
        
        // Inheritance or composition
        let baseClass = null;
        let mixins = [];
        
        if (this.check('EXTENDS')) {
            this.next();
            const baseToken = this.expect('IDENTIFIER', 'Expected base class name');
            baseClass = baseToken.value;
        }
        
        if (this.check('INCLUDES')) {
            this.next();
            const mixinToken = this.expect('IDENTIFIER', 'Expected mixin class name');
            mixins.push(mixinToken.value);
            
            // Possible mixin list
            while (this.check('IDENTIFIER')) {
                mixins.push(this.next().value);
            }
        }
        
        // Parse class body [...]
        this.expect('LBRACKET', 'Expected [ to start class body');
        
        const fields = [];
        
        while (this.hasNext() && !this.check('RBRACKET')) {
            const field = this.parseClassField();
            fields.push(field);
        }
        
        this.expect('RBRACKET', 'Expected ] to end class body');
        this.expect('SEMICOLON', 'Expected semicolon after class');
        
        return {
            type: 'ClassDeclaration',
            name: className,
            parameters,
            baseClass,
            mixins,
            fields
        };
    }

    /**
     * Parses class parameters (constructor)
     */
    parseClassParameters() {
        this.expect('LPAREN');
        const params = [];
        
        while (this.hasNext() && !this.check('RPAREN')) {
            const param = this.parseClassParameter();
            params.push(param);
            
            // If no more parameters, break
            if (this.check('COMMA')) {
                this.next();
            } else if (!this.check('RPAREN')) {
                this.error('Expected , or ) in parameter list');
            }
        }
        
        this.expect('RPAREN');
        return params;
    }

    /**
     * Parses single class parameter
     */
    parseClassParameter() {
        let isSpread = false;
        
        if (this.check('SPREAD')) {
            this.next();
            isSpread = true;
        }
        
        const nameToken = this.expect('IDENTIFIER', 'Expected parameter name');
        
        return {
            type: 'ClassParameter',
            name: nameToken.value,
            isSpread
        };
    }

    /**
     * Parses class field
     */
    parseClassField() {
        const keyToken = this.expect('ASSOC_KEY', 'Expected @key in class field');
        const fieldName = keyToken.value.substring(1); // remove @
        
        // Optional field?
        let isOptional = false;
        if (this.check('QUESTION')) {
            this.next();
            isOptional = true;
        }
        
        this.expect('COLON', 'Expected : after field name');
        
        // Parse type
        const fieldType = this.parseType();
        
        // Default value (only =>)
        let defaultValue = null;
        if (this.check('ARROW')) {
            this.next();
            defaultValue = this.parseExpression();
        }
        
        this.expect('SEMICOLON', 'Expected semicolon after field');
        
        return {
            type: 'ClassField',
            name: fieldName,
            fieldType,
            isOptional,
            defaultValue
        };
    }

    /**
     * Parses field type
     */
    parseType() {
        const token = this.current();
        
        // Primitive types
        if (token.type === 'IDENTIFIER') {
            const typeName = token.value;
            this.next();
            
            // Handle generic types <T>
            if (this.check('LBRACKET')) {
                // For simplicity, not implementing generics yet
            }
            
            return {
                type: 'TypeReference',
                name: typeName
            };
        }
        
        // Array type [type1, type2, ...] or object type
        if (token.type === 'LBRACKET') {
            this.next();
            
            // Check if it's object structure (has @key) or array/tuple
            if (this.check('ASSOC_KEY')) {
                const fields = [];
                
                while (this.hasNext() && !this.check('RBRACKET')) {
                    const keyToken = this.expect('ASSOC_KEY', 'Expected @key');
                    const fieldName = keyToken.value.substring(1);
                    
                    let isOptional = false;
                    if (this.check('QUESTION')) {
                        this.next();
                        isOptional = true;
                    }
                    
                    this.expect('COLON');
                    const fieldType = this.parseType();
                    
                    let defaultValue = null;
                    if (this.check('EQUALS')) {
                        this.next();
                        defaultValue = this.parseValue();
                    }
                    
                    this.expect('SEMICOLON');
                    
                    fields.push({
                        name: fieldName,
                        fieldType,
                        isOptional,
                        defaultValue
                    });
                }
                
                this.expect('RBRACKET');
                
                return {
                    type: 'ObjectType',
                    fields
                };
            }
            
            // Otherwise it's tuple or array
            const elementTypes = [];
            let isTuple = false;
            
            while (this.hasNext() && !this.check('RBRACKET')) {
                const elemType = this.parseType();
                elementTypes.push(elemType);
                
                if (this.check('SEMICOLON')) {
                    this.next();
                    isTuple = true;
                } else if (!this.check('RBRACKET')) {
                    this.error('Expected ; or ] in type definition');
                }
            }
            
            this.expect('RBRACKET');
            
            return {
                type: isTuple ? 'TupleType' : 'ArrayType',
                elementTypes
            };
        }
        
        // Enum type (list of strings)
        if (token.type === 'STRING') {
            const values = [token.value.slice(1, -1)]; // remove quotes
            this.next();
            
            // If no comma, it's a single string literal type
            return {
                type: 'LiteralType',
                value: values[0],
                literalType: 'string'
            };
        }
        
        this.error('Expected type', token);
    }
}

export default Parser;
