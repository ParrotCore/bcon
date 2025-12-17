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
    }

    /**
     * Ewaluuje moduł BCON
     */
    evaluate(ast, parseFunction) {
        this.parseFunction = parseFunction;
        this.variables = {};

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
                return this.evaluateObject(node, context);
            
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
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
        if (node.name in this.variables) {
            return this.variables[node.name];
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
        const isArray = node.type === 'ArrayExpression';
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
            const value = this.evaluateValue(prop.value, context);
            result[prop.key] = value;
        }

        return result;
    }
}

module.exports = Evaluator;
