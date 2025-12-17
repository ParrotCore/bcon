/**
 * BCON Stringifier - Przekształcanie obiektów JS na tekst BCON
 */

import {  inspect  } from 'node:util';

class Stringifier {
    constructor(options = {}) {
        this.options = {
            space: options.space || 0,
            replacer: options.replacer || null
        };
    }

    /**
     * Główna metoda stringyfikacji
     */
    stringify(value) {
        if (!this.isObject(value) && !Array.isArray(value)) {
            throw new TypeError('Value must be an object or array');
        }

        return 'export ' + this.stringifyObject(value, 0) + ';';
    }

    /**
     * Sprawdza czy wartość jest obiektem asocjacyjnym
     */
    isObject(value) {
        return value !== null && 
               typeof value === 'object' && 
               !Array.isArray(value) &&
               !(value instanceof Date) &&
               !(value instanceof RegExp);
    }

    /**
     * Stringifikuje obiekt lub tablicę
     */
    stringifyObject(value, depth) {
        const isArray = Array.isArray(value);
        const indent = this.getIndent(depth);
        const nextIndent = this.getIndent(depth + 1);
        const space = this.options.space ? ' ' : '';
        
        let result = '[';
        
        if (this.options.space) {
            result += '\n';
        }

        const entries = isArray 
            ? value.map((v, i) => [i, v])
            : Object.entries(value);

        for (const [key, val] of entries) {
            result += nextIndent;
            
            // Klucz
            if (isArray) {
                result += '@*';
            } else {
                result += '@' + key;
            }
            
            result += space + '=>' + space;
            
            // Wartość
            if (this.isObject(val) || Array.isArray(val)) {
                result += this.stringifyObject(val, depth + 1);
            } else {
                result += this.stringifyValue(val);
            }
            
            result += ';';
            
            if (this.options.space) {
                result += '\n';
            }
        }

        result += indent + ']';
        
        return result;
    }

    /**
     * Stringifikuje pojedynczą wartość
     */
    stringifyValue(value) {
        // Replacer
        if (this.options.replacer) {
            value = this.options.replacer(value);
        }

        // null
        if (value === null) {
            return 'Null';
        }

        // undefined
        if (value === undefined) {
            return 'Undefined';
        }

        // boolean
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }

        // number
        if (typeof value === 'number') {
            return value.toString();
        }

        // bigint
        if (typeof value === 'bigint') {
            return value.toString() + 'n';
        }

        // string
        if (typeof value === 'string') {
            let escaped = value.replace(/(?<!\\)"/g, '\\"');
            
            // Escape specjalne znaki jeśli nie ma space
            if (!this.options.space) {
                escaped = escaped.replace(/[\b\f\n\r\t\v]/g, match => {
                    const escapeMap = {
                        '\b': '\\b',
                        '\f': '\\f',
                        '\n': '\\n',
                        '\r': '\\r',
                        '\t': '\\t',
                        '\v': '\\v'
                    };
                    return escapeMap[match] || match;
                });
            }
            
            return '"' + escaped + '"';
        }

        // Date
        if (value instanceof Date) {
            return `"${value.toLocaleString('en-US')}".date`;
        }

        // RegExp
        if (value instanceof RegExp) {
            return value.toString();
        }

        // Fallback
        return String(value);
    }

    /**
     * Generuje wcięcie dla danego poziomu
     */
    getIndent(depth) {
        if (!this.options.space) {
            return '';
        }

        const unit = typeof this.options.space === 'number'
            ? ' '.repeat(this.options.space)
            : this.options.space;

        return unit.repeat(depth);
    }
}

/**
 * Funkcja pomocnicza do stringifikacji
 */
function stringify(value, replacer, space) {
    const stringifier = new Stringifier({ replacer, space });
    return stringifier.stringify(value);
}

export default stringify;
