/**
 * BCON Evaluator - Wykonanie AST
 * Przekształca AST w właściwe wartości JavaScript
 */

const { readFileSync } = require('node:fs');

class Evaluator {
    constructor(config = {}) {
        this.config = config;
        this.cache = new Map();
        this.variables = {};
        this.classes = {}; // Przechowywanie definicji klas
    }

    /**
     * Ewaluuje moduł BCON
     */
    evaluate(ast, parseFunction) {
        this.parseFunction = parseFunction;
        this.variables = {};
        this.classes = {};

        // Ewaluuj definicje klas
        for (const classDecl of ast.classes) {
            this.registerClass(classDecl);
        }

        // Ewaluuj importy
        for (const importDecl of ast.imports) {
            this.evaluateImport(importDecl);
        }

        // Ewaluuj use
        for (const useDecl of ast.uses) {
            this.evaluateUse(useDecl);
        }

        // Ewaluuj body (wartość export lub domyślny obiekt)
        const result = this.evaluateValue(ast.body, {});
        
        return result;
    }

    /**
     * Ewaluuje import
     */
    evaluateImport(importDecl) {
        const { source, binding } = importDecl;
        const { path, encoding } = source;

        // Sprawdź cache
        let value;
        if (this.cache.has(path)) {
            value = this.cache.get(path);
        } else {
            try {
                const content = readFileSync(path, encoding);
                value = this.parseFunction(content);
                this.cache.set(path, value);
            } catch (error) {
                error.stack += `\n    at: ${path}`;
                throw error;
            }
        }

        // Przypisz do binding
        this.assignBinding(binding, value);
    }

    /**
     * Ewaluuje use
     */
    evaluateUse(useDecl) {
        const { value, binding } = useDecl;
        const evaluated = this.evaluateValue(value, {});
        this.assignBinding(binding, evaluated);
    }

    /**
     * Przypisuje wartość do bindingu (identifier lub destructuring)
     */
    assignBinding(binding, value) {
        if (binding.type === 'Identifier') {
            this.variables[binding.name] = value;
        } else if (binding.type === 'Destructuring') {
            for (const item of binding.bindings) {
                let extracted = value;
                
                // Przejdź przez ścieżkę
                for (const key of item.path) {
                    if (extracted == null) {
                        extracted = undefined;
                        break;
                    }
                    
                    // Dla tablic, próbuj zinterpretować klucz jako indeks
                    if (Array.isArray(extracted)) {
                        const index = /^\d+$/.test(key) ? parseInt(key, 10) : key;
                        extracted = extracted[index];
                    } else {
                        extracted = extracted[key];
                    }
                }
                
                this.variables[item.alias] = extracted;
            }
        }
    }

    /**
     * Pobiera wartość z zagnieżdżonej ścieżki
     */
    getPath(obj, path) {
        let current = obj;
        
        for (const key of path) {
            if (current == null) {
                return undefined;
            }
            
            // Dla tablic, próbuj zinterpretować klucz jako indeks
            if (Array.isArray(current) && /^\d+$/.test(key)) {
                current = current[parseInt(key, 10)];
            } else {
                current = current[key];
            }
        }
        
        return current;
    }

    /**
     * Ewaluuje wartość
     */
    evaluateValue(node, context) {
        if (!node) {
            throw new Error('Cannot evaluate null node');
        }

        switch (node.type) {
            case 'Literal':
                return this.evaluateLiteral(node, context);
            
            case 'Identifier':
                return this.evaluateIdentifier(node, context);
            
            case 'Path':
                return this.evaluatePath(node, context);
            
            case 'ObjectExpression':
            case 'ArrayExpression':
            case 'UnknownExpression':
                return this.evaluateObject(node, context);
            
            case 'ClassInstance':
                return this.evaluateClassInstance(node, context);
            
            case 'ConstructorCall':
                return this.evaluateConstructorCall(node, context);
            
            case 'ConditionalExpression':
                return this.evaluateConditionalExpression(node, context);
            
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    /**
     * Ewaluuje wyrażenie warunkowe (operator ?)
     * Zwraca lewą stronę jeśli istnieje (nie jest null/undefined), prawą w przeciwnym razie
     */
    evaluateConditionalExpression(node, context) {
        const left = this.evaluateValue(node.left, context);
        
        // Sprawdź czy lewa strona "istnieje" (nie jest null ani undefined)
        if (left !== null && left !== undefined) {
            return left;
        }
        
        return this.evaluateValue(node.right, context);
    }

    /**
     * Ewaluuje literał
     */
    evaluateLiteral(node, context) {
        if (node.valueType === 'STRING') {
            // Interpolacja stringów
            return this.interpolateString(node.value, context);
        } else if (node.valueType === 'FILE') {
            // Wczytaj plik
            const { path, encoding } = node.value;
            return readFileSync(path, encoding);
        }
        
        return node.value;
    }

    /**
     * Interpolacja stringów [Main.property]
     */
    interpolateString(str, context) {
        return str.replace(
            /(?<!\\)\[([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*|\.\d+)*)\]/g,
            (match, path) => {
                try {
                    const value = this.resolvePath(path, context);
                    return value !== undefined && value !== null ? String(value) : match;
                } catch {
                    return match;
                }
            }
        ).replace(
            /\\([bfnrtv\[\]\\"])/g,
            (match, char) => {
                const escapes = {
                    'b': '\b',
                    'f': '\f',
                    'n': '\n',
                    'r': '\r',
                    't': '\t',
                    'v': '\v',
                    '[': '[',
                    ']': ']',
                    '\\': '\\',
                    '"': '"'
                };
                return escapes[char] || match;
            }
        );
    }

    /**
     * Ewaluuje identifier
     */
    evaluateIdentifier(node, context) {
        // Najpierw sprawdź w zmiennych globalnych
        if (node.name in this.variables) {
            return this.variables[node.name];
        }
        
        // Jeśli nie ma w zmiennych, sprawdź w kontekście (parametry konstruktora)
        if (node.name in context && node.name !== 'Main' && node.name !== 'This') {
            return context[node.name];
        }
        
        throw new Error(`Undefined variable: ${node.name}`);
    }

    /**
     * Ewaluuje path (Main.property.nested)
     */
    evaluatePath(node, context) {
        return this.resolvePath(node.path, context);
    }

    /**
     * Rozwiązuje ścieżkę względem kontekstu
     */
    resolvePath(pathStr, context) {
        const parts = pathStr.split('.');
        const root = parts[0];

        let obj;
        if (root === 'Main') {
            obj = context.Main;
        } else if (root === 'This') {
            obj = context.This;
        } else if (root in this.variables) {
            obj = this.variables[root];
        } else {
            throw new Error(`Undefined variable: ${root}`);
        }

        return this.getPath(obj, parts.slice(1));
    }

    /**
     * Ewaluuje obiekt lub tablicę
     */
    evaluateObject(node, parentContext) {
        let isArray = node.type === 'ArrayExpression';
        
        // Jeśli typ jest nieznany (tylko spread bez kluczy), ustal typ dynamicznie
        if (node.type === 'UnknownExpression') {
            // Sprawdź pierwszy spread element aby ustalić typ
            const firstSpread = node.properties.find(p => p.type === 'SpreadElement');
            if (firstSpread) {
                // Ewaluuj pierwszy spread aby sprawdzić czy to tablica czy obiekt
                const tempContext = { ...parentContext };
                const firstValue = this.evaluateValue(firstSpread.argument, tempContext);
                isArray = Array.isArray(firstValue);
            } else {
                // Brak spread - domyślnie obiekt (to nie powinno się zdarzyć)
                isArray = false;
            }
        }
        
        const result = isArray ? [] : {};

        // Utwórz nowy kontekst
        const context = {
            ...parentContext,
            This: result
        };

        // Jeśli to główny obiekt, ustaw Main
        if (!parentContext.Main) {
            context.Main = result;
        }

        // Ewaluuj właściwości
        for (const prop of node.properties) {
            if (prop.type === 'SpreadElement') {
                const spreadValue = this.evaluateValue(prop.argument, context);
                
                if (isArray) {
                    // Spread w tablicy - musi być tablica
                    if (!Array.isArray(spreadValue)) {
                        throw new TypeError(`Cannot spread non-array value in array`);
                    }
                    
                    // Dodaj wszystkie elementy z rozpakowanej tablicy
                    result.push(...spreadValue);
                } else {
                    // Spread w obiekcie - musi być obiekt
                    if (typeof spreadValue !== 'object' || spreadValue === null || Array.isArray(spreadValue)) {
                        throw new TypeError(`Cannot spread non-object value in object`);
                    }
                    
                    // Skopiuj wszystkie klucze z obiektu
                    Object.assign(result, spreadValue);
                }
            } else {
                const value = this.evaluateValue(prop.value, context);
                
                if (isArray) {
                    // Dla tablic używaj push zamiast przypisywania przez indeks
                    result.push(value);
                } else {
                    // Dla obiektów używaj klucza
                    result[prop.key] = value;
                }
            }
        }

        return result;
    }

    /**
     * Ewaluuje wywołanie konstruktora
     */
    evaluateConstructorCall(node, context) {
        const { className, arguments: args } = node;
        
        if (!this.classes[className]) {
            throw new Error(`Class "${className}" not found`);
        }
        
        const classDef = this.classes[className];
        
        // Sprawdź czy klasa ma parametry
        if (classDef.parameters.length === 0) {
            throw new Error(
                `Class "${className}" is a validator (no constructor parameters) and cannot be called with arguments. Use: use ${className} [...] as instance`
            );
        }
        
        // Ewaluuj argumenty
        const evaluatedArgs = [];
        for (const arg of args) {
            const value = this.evaluateValue(arg.value, context);
            
            if (arg.isSpread) {
                // Spread operator - dodaj wszystkie elementy tablicy
                if (!Array.isArray(value)) {
                    throw new Error(`Spread operator can only be used with arrays`);
                }
                evaluatedArgs.push(...value);
            } else {
                evaluatedArgs.push(value);
            }
        }
        
        // Przypisz argumenty do parametrów
        const parameterValues = {};
        let spreadValues = [];
        
        for (let i = 0; i < classDef.parameters.length; i++) {
            const param = classDef.parameters[i];
            
            if (param.isSpread) {
                // Spread parameter - zbierz wszystkie pozostałe argumenty
                spreadValues = evaluatedArgs.slice(i);
                parameterValues[param.name] = spreadValues;
                break;
            } else {
                if (i < evaluatedArgs.length) {
                    parameterValues[param.name] = evaluatedArgs[i];
                } else {
                    parameterValues[param.name] = undefined;
                }
            }
        }
        
        // Utwórz instancję z parametrami
        return this.createInstanceWithParameters(className, parameterValues, context);
    }

    /**
     * Ewaluuje instancję klasy
     */
    evaluateClassInstance(node, context) {
        const { className, value } = node;
        
        if (!this.classes[className]) {
            throw new Error(`Class "${className}" not found`);
        }
        
        const classDef = this.classes[className];
        
        // Sprawdź czy klasa ma parametry (jest konstruktorem)
        if (classDef.parameters.length > 0) {
            throw new Error(
                `Class "${className}" is a constructor and requires arguments. Use: use ${className}(...args) as instance`
            );
        }
        
        // Ewaluuj wartość obiektu
        const objValue = this.evaluateValue(value, context);
        
        // Utwórz instancję z walidacją
        return this.createInstance(className, objValue, context);
    }

    /**
     * Rejestruje definicję klasy
     */
    registerClass(classDecl) {
        const { name, parameters, baseClass, mixins, fields } = classDecl;
        
        // Rozwiń dziedziczenie
        let allFields = [...fields];
        
        if (baseClass) {
            if (!this.classes[baseClass]) {
                throw new Error(`Base class "${baseClass}" not found`);
            }
            // Dodaj pola z klasy bazowej (mogą być nadpisane)
            allFields = [...this.classes[baseClass].fields, ...fields];
        }
        
        // Dodaj pola z mixinów
        for (const mixin of mixins) {
            if (!this.classes[mixin]) {
                throw new Error(`Mixin class "${mixin}" not found`);
            }
            allFields = [...this.classes[mixin].fields, ...allFields];
        }
        
        this.classes[name] = {
            name,
            parameters: parameters || [],
            baseClass,
            mixins,
            fields: allFields
        };
    }

    /**
     * Tworzy instancję klasy z walidacją
     */
    createInstance(className, value, context) {
        if (!this.classes[className]) {
            throw new Error(`Class "${className}" not found`);
        }
        
        const classDef = this.classes[className];
        const instance = {};
        const providedKeys = new Set(Object.keys(value));
        
        // Waliduj i przypisz pola
        for (const field of classDef.fields) {
            const { name, fieldType, isOptional, defaultValue } = field;
            
            let fieldValue;
            
            if (name in value) {
                fieldValue = value[name];
                providedKeys.delete(name);
            } else if (defaultValue !== null) {
                fieldValue = this.evaluateValue(defaultValue, context);
            } else if (isOptional) {
                continue; // Pole opcjonalne i nie podane
            } else {
                throw new Error(
                    `Missing required field "${name}" in class "${className}"`
                );
            }
            
            // Waliduj typ
            this.validateType(fieldValue, fieldType, `${className}.${name}`);
            
            instance[name] = fieldValue;
        }
        
        // Sprawdź czy nie ma nadmiarowych pól
        if (providedKeys.size > 0) {
            const extra = Array.from(providedKeys).join(', ');
            throw new Error(
                `Unknown fields in class "${className}": ${extra}`
            );
        }
        
        return instance;
    }

    /**
     * Tworzy instancję klasy z parametrami konstruktora
     */
    createInstanceWithParameters(className, parameterValues, context) {
        if (!this.classes[className]) {
            throw new Error(`Class "${className}" not found`);
        }
        
        const classDef = this.classes[className];
        const instance = {};
        
        // Utwórz kontekst z parametrami dla ewaluacji defaultValue
        const paramContext = {
            ...context,
            ...parameterValues
        };
        
        // Przypisz pola
        for (const field of classDef.fields) {
            const { name, fieldType, isOptional, defaultValue } = field;
            
            let fieldValue;
            
            if (defaultValue !== null) {
                // Ewaluuj wartość domyślną (może używać parametrów z operatorem ?)
                fieldValue = this.evaluateValue(defaultValue, paramContext);
                
                // Jeśli pole jest opcjonalne i wartość to undefined, pomiń
                if (isOptional && (fieldValue === undefined || fieldValue === null)) {
                    continue;
                }
            } else if (isOptional) {
                continue; // Pole opcjonalne bez wartości domyślnej
            } else {
                throw new Error(
                    `Missing value for required field "${name}" in constructor of class "${className}"`
                );
            }
            
            // Waliduj typ (ale pomiń jeśli pole opcjonalne i wartość to undefined)
            if (!(isOptional && (fieldValue === undefined || fieldValue === null))) {
                this.validateType(fieldValue, fieldType, `${className}.${name}`);
            }
            
            instance[name] = fieldValue;
        }
        
        return instance;
    }

    /**
     * Waliduje typ wartości
     */
    validateType(value, typeNode, fieldPath) {
        switch (typeNode.type) {
            case 'TypeReference':
                return this.validateTypeReference(value, typeNode.name, fieldPath);
            
            case 'ObjectType':
                return this.validateObjectType(value, typeNode, fieldPath);
            
            case 'ArrayType':
                return this.validateArrayType(value, typeNode, fieldPath);
            
            case 'TupleType':
                return this.validateTupleType(value, typeNode, fieldPath);
            
            case 'LiteralType':
                return this.validateLiteralType(value, typeNode, fieldPath);
            
            default:
                throw new Error(`Unknown type node: ${typeNode.type}`);
        }
    }

    /**
     * Waliduje typ referencyjny
     */
    validateTypeReference(value, typeName, fieldPath) {
        // Typy prymitywne
        const primitiveValidators = {
            'String': (v) => typeof v === 'string',
            'Number': (v) => typeof v === 'number' && !isNaN(v),
            'Boolean': (v) => typeof v === 'boolean',
            'BigInt': (v) => typeof v === 'bigint',
            'Date': (v) => v instanceof Date,
            'RegExp': (v) => v instanceof RegExp,
            'Array': (v) => Array.isArray(v),
            'Object': (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
            'Any': (v) => true,
            'Null': (v) => v === null,
            'Undefined': (v) => v === undefined,
        };
        
        if (typeName in primitiveValidators) {
            if (!primitiveValidators[typeName](value)) {
                throw new TypeError(
                    `Type mismatch at ${fieldPath}: expected ${typeName}, got ${this.getTypeName(value)}`
                );
            }
            return;
        }
        
        // Sprawdź czy to klasa użytkownika - waliduj głęboko
        if (typeName in this.classes) {
            // Dla obiektów sprawdź czy mają odpowiednie pola
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                throw new TypeError(
                    `Type mismatch at ${fieldPath}: expected instance of ${typeName}, got ${this.getTypeName(value)}`
                );
            }
            
            // GŁĘBOKA WALIDACJA: Sprawdź czy obiekt pasuje do schematu klasy
            const classDef = this.classes[typeName];
            const providedKeys = new Set(Object.keys(value));
            
            for (const field of classDef.fields) {
                const { name, fieldType, isOptional, defaultValue } = field;
                
                if (name in value) {
                    // Rekurencyjnie waliduj zagnieżdżone pola
                    this.validateType(value[name], fieldType, `${fieldPath}.${name}`);
                    providedKeys.delete(name);
                } else if (!isOptional && defaultValue === null) {
                    throw new Error(
                        `Missing required field "${name}" at ${fieldPath} (expected by class ${typeName})`
                    );
                }
            }
            
            // Sprawdź nadmiarowe pola
            if (providedKeys.size > 0) {
                const extra = Array.from(providedKeys).join(', ');
                throw new Error(
                    `Unknown fields at ${fieldPath}: ${extra} (not defined in class ${typeName})`
                );
            }
            
            return;
        }
        
        throw new Error(`Unknown type: ${typeName}`);
    }

    /**
     * Waliduje typ obiektowy
     */
    validateObjectType(value, typeNode, fieldPath) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new TypeError(
                `Type mismatch at ${fieldPath}: expected object, got ${this.getTypeName(value)}`
            );
        }
        
        const providedKeys = new Set(Object.keys(value));
        
        for (const field of typeNode.fields) {
            if (field.name in value) {
                this.validateType(value[field.name], field.fieldType, `${fieldPath}.${field.name}`);
                providedKeys.delete(field.name);
            } else if (!field.isOptional && field.defaultValue === null) {
                throw new Error(
                    `Missing required field "${field.name}" at ${fieldPath}`
                );
            }
        }
        
        if (providedKeys.size > 0) {
            const extra = Array.from(providedKeys).join(', ');
            throw new Error(`Unknown fields at ${fieldPath}: ${extra}`);
        }
    }

    /**
     * Waliduje typ tablicowy
     */
    validateArrayType(value, typeNode, fieldPath) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                `Type mismatch at ${fieldPath}: expected array, got ${this.getTypeName(value)}`
            );
        }
        
        if (typeNode.elementTypes.length > 0) {
            const elemType = typeNode.elementTypes[0];
            for (let i = 0; i < value.length; i++) {
                this.validateType(value[i], elemType, `${fieldPath}[${i}]`);
            }
        }
    }

    /**
     * Waliduje typ tuple
     */
    validateTupleType(value, typeNode, fieldPath) {
        if (!Array.isArray(value)) {
            throw new TypeError(
                `Type mismatch at ${fieldPath}: expected tuple, got ${this.getTypeName(value)}`
            );
        }
        
        if (value.length !== typeNode.elementTypes.length) {
            throw new TypeError(
                `Tuple length mismatch at ${fieldPath}: expected ${typeNode.elementTypes.length}, got ${value.length}`
            );
        }
        
        for (let i = 0; i < value.length; i++) {
            this.validateType(value[i], typeNode.elementTypes[i], `${fieldPath}[${i}]`);
        }
    }

    /**
     * Waliduje typ literału
     */
    validateLiteralType(value, typeNode, fieldPath) {
        if (value !== typeNode.value) {
            throw new TypeError(
                `Type mismatch at ${fieldPath}: expected literal "${typeNode.value}", got ${JSON.stringify(value)}`
            );
        }
    }

    /**
     * Pobiera nazwę typu dla wartości
     */
    getTypeName(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'Array';
        if (value instanceof Date) return 'Date';
        if (value instanceof RegExp) return 'RegExp';
        if (typeof value === 'bigint') return 'BigInt';
        return typeof value;
    }
}

module.exports = Evaluator;
