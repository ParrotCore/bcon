/**
 * BCON Lexer - BCON code tokenization
 * Responsible for splitting text into tokens
 */

class Lexer {
    constructor(source) {
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        
        // Cache regex patterns for better performance
        this._cachedPatterns = null;
    }

    /**
     * Removes comments from source code
     */
    removeComments(text) {
        text = text.replace(/\r\n|\r(?!\n)/g, '\n');
        
        let output = '';
        let isString = false;
        let isMultilineComment = false;
        let isSingleLineComment = false;
        let prevChar = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const next = text[i + 1];

            // String detection
            if (char === '"' && prevChar !== '\\' && !isSingleLineComment && !isMultilineComment) {
                isString = !isString;
                output += char;
                prevChar = char;
                continue;
            }

            // Multiline comment detection
            if (char === '\'' && prevChar !== '\\' && !isString && !isSingleLineComment) {
                isMultilineComment = !isMultilineComment;
                output += char === '\n' ? '\n' : ' ';
                prevChar = char;
                continue;
            }

            // Single line comment detection
            if (char === '#' && !isString && !isMultilineComment && !isSingleLineComment) {
                isSingleLineComment = true;
                output += ' ';
                prevChar = char;
                continue;
            }

            // End of single line comment
            if (char === '\n' && isSingleLineComment) {
                isSingleLineComment = false;
                output += '\n';
                prevChar = char;
                continue;
            }

            // Adding characters
            if (isSingleLineComment || isMultilineComment) {
                output += char === '\n' ? '\n' : ' ';
            } else {
                output += char;
            }

            prevChar = char;
        }

        return output;
    }

    /**
     * Token definitions as regexps
     */
    getTokenPatterns() {
        // Return cached patterns if available
        if (this._cachedPatterns) {
            return this._cachedPatterns;
        }
        
        this._cachedPatterns = [
            // Literals
            { type: 'DATE', pattern: /"[^"\n\r]*"\.date/gi },
            { type: 'FILE', pattern: /"[^"\n\r]*"\.(utf-?8|utf-?16le|base-?64|ascii|latin-?1|binary|hex)/gi },
            { type: 'STRING', pattern: /"(?:[^"\\]|\\.)*"/g },
            { type: 'REGEXP', pattern: /\/(?:[^\/\n\r\\]|\\.)+\/[igsmuy]*/g },
            { type: 'NUMBER', pattern: /(?:-)?(0x[A-Fa-f0-9_]+|0o[0-7_]+|0b[0-1_]+|[0-9_]*\.?[0-9_]+(?:e[+-]?[0-9_]+)?|Infinity|NaN)/g },
            { type: 'BIGINT', pattern: /(?:-)?[0-9_]+n/g },
            
            // Keywords and word literals
            { type: 'BOOLEAN', pattern: /\b(True|False)\b/g },
            { type: 'NULL', pattern: /\bNull\b/g },
            { type: 'UNDEFINED', pattern: /\bUndefined\b/g },
            { type: 'IMPORT', pattern: /\bimport\b/g },
            { type: 'USE', pattern: /\buse\b/g },
            { type: 'EXPORT', pattern: /\bexport\b/g },
            { type: 'FROM', pattern: /\bfrom\b/g },
            { type: 'AS', pattern: /\bas\b/g },
            { type: 'SKIP', pattern: /\bskip\b/g },
            { type: 'CLASS', pattern: /\bclass\b/g },
            { type: 'EXTENDS', pattern: /\bextends\b/g },
            { type: 'INCLUDES', pattern: /\bincludes\b/g },
            
            // Symbols
            { type: 'ARROW', pattern: /=>/g },
            { type: 'SPREAD', pattern: /\.{3}/g },
            { type: 'ASSOC_KEY', pattern: /@[A-Za-z_][A-Za-z0-9_]*/g },
            { type: 'NUMERIC_KEY', pattern: /@\*/g },
            
            // Identifiers
            { type: 'PATH', pattern: /[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*|\.\d+)+/g },
            { type: 'IDENTIFIER', pattern: /[A-Za-z_][A-Za-z0-9_]*/g },
            
            // Remaining symbols
            { type: 'LPAREN', pattern: /\(/g },
            { type: 'RPAREN', pattern: /\)/g },
            { type: 'LBRACKET', pattern: /\[/g },
            { type: 'RBRACKET', pattern: /\]/g },
            { type: 'COMMA', pattern: /,/g },
            { type: 'SEMICOLON', pattern: /;/g },
            { type: 'COLON', pattern: /:/g },
            { type: 'QUESTION', pattern: /\?/g },
            { type: 'EQUALS', pattern: /=/g }
        ];
        
        return this._cachedPatterns;
    }

    /**
     * Source tokenization
     */
    tokenize() {
        const cleanSource = this.removeComments(this.source);
        const patterns = this.getTokenPatterns();
        const matches = [];

        // Collect all matches
        for (const { type, pattern } of patterns) {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            
            while ((match = regex.exec(cleanSource)) !== null) {
                matches.push({
                    type,
                    value: match[0],
                    index: match.index,
                    length: match[0].length
                });
            }
        }

        // Sort by index
        matches.sort((a, b) => a.index - b.index);

        // Filter overlapping matches (choose longest)
        const filtered = [];
        let lastEnd = -1;

        for (const match of matches) {
            if (match.index >= lastEnd) {
                filtered.push(match);
                lastEnd = match.index + match.length;
            } else if (match.index === filtered[filtered.length - 1].index) {
                // If at same position, choose longer match
                if (match.length > filtered[filtered.length - 1].length) {
                    filtered[filtered.length - 1] = match;
                    lastEnd = match.index + match.length;
                }
            }
        }

        // Check for unexpected tokens
        this.checkForUnexpectedTokens(cleanSource, filtered);

        // Process tokens into objects with additional data
        this.tokens = filtered.map(token => this.createToken(token, cleanSource));
        
        return this.tokens;
    }

    /**
     * Checks if code contains unrecognized tokens
     */
    checkForUnexpectedTokens(source, tokens) {
        let pos = 0;
        let tokenIndex = 0;

        while (pos < source.length) {
            // Skip whitespace
            if (/\s/.test(source[pos])) {
                pos++;
                continue;
            }

            // Check if we're at token start
            if (tokenIndex < tokens.length && pos === tokens[tokenIndex].index) {
                pos += tokens[tokenIndex].length;
                tokenIndex++;
            } else if (tokenIndex >= tokens.length || pos < tokens[tokenIndex].index) {
                // Unexpected character
                const location = this.getLocation(source, pos);
                throw new SyntaxError(
                    `Unexpected token: "${source[pos]}" at line ${location.line}, column ${location.column}`
                );
            }
        }
    }

    /**
     * Creates token object with additional information
     */
    createToken(match, source) {
        const location = this.getLocation(source, match.index);
        
        return {
            type: match.type,
            value: match.value,
            raw: match.value,
            index: match.index,
            line: location.line,
            column: location.column
        };
    }

    /**
     * Calculates line and column for given position
     */
    getLocation(source, index) {
        let line = 1;
        let column = 1;

        for (let i = 0; i < index && i < source.length; i++) {
            if (source[i] === '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }
        }

        return { line, column };
    }
}

module.exports = Lexer;
