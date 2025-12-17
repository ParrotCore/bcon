/**
 * BCON Lexer - Tokenizacja kodu BCON
 * Odpowiedzialny za rozbicie tekstu na tokeny
 */

class Lexer {
    constructor(source) {
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }

    /**
     * Usuwa komentarze z kodu źródłowego
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

            // Wykrywanie stringów
            if (char === '"' && prevChar !== '\\' && !isSingleLineComment && !isMultilineComment) {
                isString = !isString;
                output += char;
                prevChar = char;
                continue;
            }

            // Wykrywanie komentarzy wieloliniowych
            if (char === '\'' && prevChar !== '\\' && !isString && !isSingleLineComment) {
                isMultilineComment = !isMultilineComment;
                output += char === '\n' ? '\n' : ' ';
                prevChar = char;
                continue;
            }

            // Wykrywanie komentarzy jednoliniowych
            if (char === '#' && !isString && !isMultilineComment && !isSingleLineComment) {
                isSingleLineComment = true;
                output += ' ';
                prevChar = char;
                continue;
            }

            // Koniec komentarza jednoliniowego
            if (char === '\n' && isSingleLineComment) {
                isSingleLineComment = false;
                output += '\n';
                prevChar = char;
                continue;
            }

            // Dodawanie znaków
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
     * Definicje tokenów jako regexpy
     */
    getTokenPatterns() {
        return [
            // Literały
            { type: 'DATE', pattern: /"[^"\n\r]*"\.date/gi },
            { type: 'FILE', pattern: /"[^"\n\r]*"\.(utf-?8|utf-?16le|base-?64|ascii|latin-?1|binary|hex)/gi },
            { type: 'STRING', pattern: /"(?:[^"\\]|\\.)*"/g },
            { type: 'REGEXP', pattern: /\/(?:[^\/\n\r\\]|\\.)+\/[igsmuy]*/g },
            { type: 'NUMBER', pattern: /(?:-)?(0x[A-Fa-f0-9_]+|0o[0-7_]+|0b[0-1_]+|[0-9_]*\.?[0-9_]+(?:e[+-]?[0-9_]+)?|Infinity|NaN)/g },
            { type: 'BIGINT', pattern: /(?:-)?[0-9_]+n/g },
            
            // Keywords i literały słowne
            { type: 'BOOLEAN', pattern: /\b(True|False)\b/g },
            { type: 'NULL', pattern: /\bNull\b/g },
            { type: 'UNDEFINED', pattern: /\bUndefined\b/g },
            { type: 'IMPORT', pattern: /\bimport\b/g },
            { type: 'USE', pattern: /\buse\b/g },
            { type: 'EXPORT', pattern: /\bexport\b/g },
            { type: 'FROM', pattern: /\bfrom\b/g },
            { type: 'AS', pattern: /\bas\b/g },
            { type: 'SKIP', pattern: /\bskip\b/g },
            
            // Symbole
            { type: 'ARROW', pattern: /=>/g },
            { type: 'ASSOC_KEY', pattern: /@[A-Za-z_][A-Za-z0-9_]*/g },
            { type: 'NUMERIC_KEY', pattern: /@\*/g },
            
            // Identyfikatory
            { type: 'PATH', pattern: /[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*|\.\d+)+/g },
            { type: 'IDENTIFIER', pattern: /[A-Za-z_][A-Za-z0-9_]*/g },
            
            // Pozostałe symbole
            { type: 'LBRACKET', pattern: /\[/g },
            { type: 'RBRACKET', pattern: /\]/g },
            { type: 'SEMICOLON', pattern: /;/g }
        ];
    }

    /**
     * Tokenizacja źródła
     */
    tokenize() {
        const cleanSource = this.removeComments(this.source);
        const patterns = this.getTokenPatterns();
        const matches = [];

        // Zbierz wszystkie dopasowania
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

        // Sortuj po indeksie
        matches.sort((a, b) => a.index - b.index);

        // Filtruj nakładające się dopasowania (wybierz najdłuższe)
        const filtered = [];
        let lastEnd = -1;

        for (const match of matches) {
            if (match.index >= lastEnd) {
                filtered.push(match);
                lastEnd = match.index + match.length;
            } else if (match.index === filtered[filtered.length - 1].index) {
                // Jeśli na tym samym miejscu, wybierz dłuższe dopasowanie
                if (match.length > filtered[filtered.length - 1].length) {
                    filtered[filtered.length - 1] = match;
                    lastEnd = match.index + match.length;
                }
            }
        }

        // Sprawdź nieoczekiwane tokeny
        this.checkForUnexpectedTokens(cleanSource, filtered);

        // Przetwórz tokeny na obiekty z dodatkowymi danymi
        this.tokens = filtered.map(token => this.createToken(token, cleanSource));
        
        return this.tokens;
    }

    /**
     * Sprawdza czy w kodzie nie ma nierozpoznanych tokenów
     */
    checkForUnexpectedTokens(source, tokens) {
        let pos = 0;
        let tokenIndex = 0;

        while (pos < source.length) {
            // Pomiń białe znaki
            if (/\s/.test(source[pos])) {
                pos++;
                continue;
            }

            // Sprawdź czy jesteśmy na początku tokena
            if (tokenIndex < tokens.length && pos === tokens[tokenIndex].index) {
                pos += tokens[tokenIndex].length;
                tokenIndex++;
            } else if (tokenIndex >= tokens.length || pos < tokens[tokenIndex].index) {
                // Nieoczekiwany znak
                const location = this.getLocation(source, pos);
                throw new SyntaxError(
                    `Unexpected token: "${source[pos]}" at line ${location.line}, column ${location.column}`
                );
            }
        }
    }

    /**
     * Tworzy obiekt tokena z dodatkowymi informacjami
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
     * Oblicza linię i kolumnę dla danej pozycji
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

export default Lexer;
