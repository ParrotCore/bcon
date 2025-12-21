/**
 * BCON Stringifier - Transforming JS objects to BCON text
 */

import { inspect } from 'node:util';

class Stringifier {
    constructor(options = {}) {
        this.options = {
            space: options.space || 0,
            replacer: options.replacer || null
        };
    }

    /**
     * Main stringification method
     */
    stringify(value) {
        if (!this.isObject(value) && !Array.isArray(value)) {
            throw new TypeError('Value must be an object or array');
        }

        return 'export ' + this.stringifyObject(value, 0) + ';';
    }

    /**
     * Checks if value is associative object
     */
    isObject(value) {
        return value !== null && 
               typeof value === 'object' && 
               !Array.isArray(value) &&
               !(value instanceof Date) &&
               !(value instanceof RegExp);
    }

    /**
     * Stringifies object or array
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
            
            // Key
            if (isArray) {
                result += '@*';
            } else {
                result += '@' + key;
            }
            
            result += space + '=>' + space;
            
            // Value
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
     * Stringifies single value
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
            
            // Escape special characters if no space
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
     * Generates indentation for given depth
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
 * Helper function for stringification
 */
function stringify(value, replacer, space) {
    const stringifier = new Stringifier({ replacer, space });
    return stringifier.stringify(value);
}

export default stringify;
