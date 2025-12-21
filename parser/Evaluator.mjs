/**
 * BCON Evaluator - AST Execution
 * Transforms AST into proper JavaScript values
 */

import { readFileSync } from 'node:fs';

class Evaluator {
    constructor(config = {}) {
        this.config = config;
        this.cache = new Map();
        this.variables = {};
        this.classes = {}; // Store class definitions
    }

    /**
     * Evaluates BCON module
     */
    evaluate(ast, parseFunction) {
        this.parseFunction = parseFunction;
        this.variables = {};
        this.classes = {};

        // Evaluate class definitions
        for (const classDecl of ast.classes) {
            this.registerClass(classDecl);
        }

        // Evaluate imports
        for (const importDecl of ast.imports) {
            this.evaluateImport(importDecl);
        }

        // Evaluate use declarations
        for (const useDecl of ast.uses) {
            this.evaluateUse(useDecl);
        }

        // Evaluate body (export value or default object)
        const result = this.evaluateValue(ast.body, {});
        
        return result;
    }

    /**
     * Evaluates import declaration
     */
    evaluateImport(importDecl) {
        const { source, binding } = importDecl;
        const { path, encoding } = source;

        // Check cache
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

        // Assign to binding
        this.assignBinding(binding, value);
    }

    /**
     * Evaluates use declaration
     */
    evaluateUse(useDecl) {
        const { value, binding } = useDecl;
        const evaluated = this.evaluateValue(value, {});
        this.assignBinding(binding, evaluated);
    }

    /**
     * Assigns value to binding (identifier or destructuring)
     */
    assignBinding(binding, value) {
        if (binding.type === 'Identifier') {
            this.variables[binding.name] = value;
        } else if (binding.type === 'Destructuring') {
            for (const item of binding.bindings) {
                let extracted = value;
                
                // Traverse through path
                for (const key of item.path) {
                    if (extracted == null) {
                        extracted = undefined;
                        break;
                    }
                    
                    // For arrays, try to interpret key as index
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
     * Gets value from nested path
     */
    getPath(obj, path) {
        let current = obj;
        
        for (const key of path) {
            if (current == null) return undefined;
            
            // For arrays, try to interpret key as index
            current = Array.isArray(current) && /^\d+$/.test(key)
                ? current[parseInt(key, 10)]
                : current[key];
        }
        
        return current;
    }

    /**
     * Evaluates value node
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
     * Evaluates conditional expression (? operator)
     * Returns left side if it exists (not null/undefined), right side otherwise
     */
    evaluateConditionalExpression(node, context) {
        const left = this.evaluateValue(node.left, context);
        
        // Check if left side "exists" (not null or undefined)
        if (left !== null && left !== undefined) {
            return left;
        }
        
        return this.evaluateValue(node.right, context);
    }

    /**
     * Evaluates literal value
     */
    evaluateLiteral(node, context) {
        if (node.valueType === 'STRING') {
            // String interpolation
            return this.interpolateString(node.value, context);
        } else if (node.valueType === 'FILE') {
            // Load file
            const { path, encoding } = node.value;
            return readFileSync(path, encoding);
        }
        
        return node.value;
    }

    /**
     * String interpolation [Main.property] or [Main.property ? "default"]
     */
    interpolateString(str, context) {
        return str.replace(
            /(?<!\\)\[([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*|\.\d+)*)(?:\s*\?\s*("(?:[^"\\]|\\.)*"|[^\]]+))?\]/g,
            (match, path, defaultValue) => {
                try {
                    const value = this.resolvePath(path, context);
                    
                    // If value exists (not null/undefined), use it
                    if (value !== undefined && value !== null) {
                        return String(value);
                    }
                    
                    // If default value is provided, use it
                    if (defaultValue !== undefined) {
                        return this.parseInterpolationDefault(defaultValue.trim());
                    }
                    
                    // No value and no default - keep placeholder
                    return match;
                } catch {
                    // On error, use default value if provided
                    if (defaultValue !== undefined) {
                        return this.parseInterpolationDefault(defaultValue.trim());
                    }
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
     * Parses default value in string interpolation
     */
    parseInterpolationDefault(value) {
        // Escaped string literal (\"text\" inside the outer string)
        if (value.startsWith('\\"') && value.endsWith('\\"')) {
            return value.slice(2, -2).replace(/\\(.)/g, (match, char) => {
                const escapes = {
                    'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r',
                    't': '\t', 'v': '\v', '"': '"', '\\': '\\'
                };
                return escapes[char] || match;
            });
        }
        
        // String literal
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1).replace(/\\(.)/g, (match, char) => {
                const escapes = {
                    'b': '\b', 'f': '\f', 'n': '\n', 'r': '\r',
                    't': '\t', 'v': '\v', '"': '"', '\\': '\\'
                };
                return escapes[char] || match;
            });
        }
        
        // Number
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return value;
        }
        
        // Boolean
        if (value === 'True') return 'true';
        if (value === 'False') return 'false';
        
        // Null/Undefined
        if (value === 'Null') return 'null';
        if (value === 'Undefined') return 'undefined';
        
        // Default: return as-is
        return value;
    }

    /**
     * Evaluates identifier
     */
    evaluateIdentifier(node, context) {
        // First check in global variables
        if (node.name in this.variables) {
            return this.variables[node.name];
        }
        
        // If not in variables, check in context (constructor parameters)
        if (node.name in context && node.name !== 'Main' && node.name !== 'This') {
            return context[node.name];
        }
        
        throw new Error(`Undefined variable: ${node.name}`);
    }

    /**
     * Evaluates path (Main.property.nested)
     */
    evaluatePath(node, context) {
        return this.resolvePath(node.path, context);
    }

    /**
     * Resolves path relative to context
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
     * Evaluates object or array
     */
    evaluateObject(node, parentContext) {
        let isArray = node.type === 'ArrayExpression';
        
        // If type is unknown (only spread without keys), determine type dynamically
        if (node.type === 'UnknownExpression') {
            // Check first spread element to determine type
            const firstSpread = node.properties.find(p => p.type === 'SpreadElement');
            if (firstSpread) {
                // Evaluate first spread to check if it's array or object
                const tempContext = { ...parentContext };
                const firstValue = this.evaluateValue(firstSpread.argument, tempContext);
                isArray = Array.isArray(firstValue);
            } else {
                // No spread - default to object (this shouldn't happen)
                isArray = false;
            }
        }
        
        const result = isArray ? [] : {};

        // Create new context
        const context = {
            ...parentContext,
            This: result
        };

        // If this is main object, set Main
        if (!parentContext.Main) {
            context.Main = result;
        }

        // Evaluate properties
        for (const prop of node.properties) {
            if (prop.type === 'SpreadElement') {
                const spreadValue = this.evaluateValue(prop.argument, context);
                
                if (isArray) {
                    // Spread in array - must be array
                    if (!Array.isArray(spreadValue)) {
                        throw new TypeError(`Cannot spread non-array value in array`);
                    }
                    
                    // Add all elements from spread array
                    result.push(...spreadValue);
                } else {
                    // Spread in object - must be object
                    if (typeof spreadValue !== 'object' || spreadValue === null || Array.isArray(spreadValue)) {
                        throw new TypeError(`Cannot spread non-object value in object`);
                    }
                    
                    // Copy all keys from object
                    Object.assign(result, spreadValue);
                }
            } else {
                const value = this.evaluateValue(prop.value, context);
                
                if (isArray) {
                    // For arrays use push instead of index assignment
                    result.push(value);
                } else {
                    // For objects use key
                    result[prop.key] = value;
                }
            }
        }

        return result;
    }

    /**
     * Evaluates constructor call
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
        
        // Evaluate arguments
        const evaluatedArgs = [];
        for (const arg of args) {
            const value = this.evaluateValue(arg.value, context);
            
            if (arg.isSpread) {
                // Spread operator - add all array elements
                if (!Array.isArray(value)) {
                    throw new Error(`Spread operator can only be used with arrays`);
                }
                evaluatedArgs.push(...value);
            } else {
                evaluatedArgs.push(value);
            }
        }
        
        // Assign arguments to parameters
        const parameterValues = {};
        let spreadValues = [];
        
        for (let i = 0; i < classDef.parameters.length; i++) {
            const param = classDef.parameters[i];
            
            if (param.isSpread) {
                // Spread parameter - collect all remaining arguments
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
        
        // Create instance with parameters
        return this.createInstanceWithParameters(className, parameterValues, context);
    }

    /**
     * Evaluates class instance
     */
    evaluateClassInstance(node, context) {
        const { className, value } = node;
        
        if (!this.classes[className]) {
            throw new Error(`Class "${className}" not found`);
        }
        
        const classDef = this.classes[className];
        
        // Check if class has parameters (is a constructor)
        if (classDef.parameters.length > 0) {
            throw new Error(
                `Class "${className}" is a constructor and requires arguments. Use: use ${className}(...args) as instance`
            );
        }
        
        // Evaluate object value
        const objValue = this.evaluateValue(value, context);
        
        // Create instance with validation
        return this.createInstance(className, objValue, context);
    }

    /**
     * Registers class definition
     */
    registerClass(classDecl) {
        const { name, parameters, baseClass, mixins, fields } = classDecl;
        
        // Expand inheritance
        let allFields = [...fields];
        let inheritedParameters = parameters || [];
        
        if (baseClass) {
            if (!this.classes[baseClass]) {
                throw new Error(`Base class "${baseClass}" not found`);
            }
            // Add fields from base class (can be overridden)
            allFields = [...this.classes[baseClass].fields, ...fields];
            
            // If child has no constructor parameters, inherit from parent
            if (inheritedParameters.length === 0 && this.classes[baseClass].parameters.length > 0) {
                inheritedParameters = this.classes[baseClass].parameters;
            }
        }
        
        // Add fields from mixins
        for (const mixin of mixins) {
            if (!this.classes[mixin]) {
                throw new Error(`Mixin class "${mixin}" not found`);
            }
            allFields = [...this.classes[mixin].fields, ...allFields];
        }
        
        this.classes[name] = {
            name,
            parameters: inheritedParameters,
            baseClass,
            mixins,
            fields: allFields
        };
    }

    /**
     * Creates class instance with validation
     */
    createInstance(className, value, context) {
        if (!this.classes[className]) {
            throw new Error(`Class "${className}" not found`);
        }
        
        const classDef = this.classes[className];
        const instance = {};
        const providedKeys = new Set(Object.keys(value));
        
        // Validate and assign fields
        for (const field of classDef.fields) {
            const { name, fieldType, isOptional, defaultValue } = field;
            
            let fieldValue;
            
            if (name in value) {
                fieldValue = value[name];
                providedKeys.delete(name);
            } else if (defaultValue !== null) {
                fieldValue = this.evaluateValue(defaultValue, context);
            } else if (isOptional) {
                continue; // Optional field not provided
            } else {
                throw new Error(
                    `Missing required field "${name}" in class "${className}"`
                );
            }
            
            // Waliduj typ
            this.validateType(fieldValue, fieldType, `${className}.${name}`);
            
            instance[name] = fieldValue;
        }
        
        // Check for excess fields
        if (providedKeys.size > 0) {
            const extra = Array.from(providedKeys).join(', ');
            throw new Error(
                `Unknown fields in class "${className}": ${extra}`
            );
        }
        
        return instance;
    }

    /**
     * Creates class instance with constructor parameters
     */
    createInstanceWithParameters(className, parameterValues, context) {
        if (!this.classes[className]) {
            throw new Error(`Class "${className}" not found`);
        }
        
        const classDef = this.classes[className];
        const instance = {};
        
        // Create context with parameters for defaultValue evaluation
        const paramContext = {
            ...context,
            ...parameterValues
        };
        
        // Assign fields
        for (const field of classDef.fields) {
            const { name, fieldType, isOptional, defaultValue } = field;
            
            let fieldValue;
            
            if (defaultValue !== null) {
                // Evaluate default value (can use parameters with ? operator)
                fieldValue = this.evaluateValue(defaultValue, paramContext);
                
                // If field is optional and value is undefined, skip
                if (isOptional && (fieldValue === undefined || fieldValue === null)) {
                    continue;
                }
            } else if (isOptional) {
                continue; // Optional field without default value
            } else {
                throw new Error(
                    `Missing value for required field "${name}" in constructor of class "${className}"`
                );
            }
            
            // Validate type (but skip if optional field and value is undefined)
            if (!(isOptional && (fieldValue === undefined || fieldValue === null))) {
                this.validateType(fieldValue, fieldType, `${className}.${name}`);
            }
            
            instance[name] = fieldValue;
        }
        
        return instance;
    }

    /**
     * Validates value type
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
     * Validates reference type
     */
    validateTypeReference(value, typeName, fieldPath) {
        // Primitive types
        const primitiveValidators = this.getPrimitiveValidators();
        
        if (typeName in primitiveValidators) {
            if (!primitiveValidators[typeName](value)) {
                throw new TypeError(
                    `Type mismatch at ${fieldPath}: expected ${typeName}, got ${this.getTypeName(value)}`
                );
            }
            return;
        }
        
        // Check if it's a user class - validate deeply
        if (typeName in this.classes) {
            // Dla obiektów sprawdź czy mają odpowiednie pola
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                throw new TypeError(
                    `Type mismatch at ${fieldPath}: expected instance of ${typeName}, got ${this.getTypeName(value)}`
                );
            }
            
            // DEEP VALIDATION: Check if object matches class schema
            const classDef = this.classes[typeName];
            const providedKeys = new Set(Object.keys(value));
            
            for (const field of classDef.fields) {
                const { name, fieldType, isOptional, defaultValue } = field;
                
                if (name in value) {
                    // Recursively validate nested fields
                    this.validateType(value[name], fieldType, `${fieldPath}.${name}`);
                    providedKeys.delete(name);
                } else if (!isOptional && defaultValue === null) {
                    throw new Error(
                        `Missing required field "${name}" at ${fieldPath} (expected by class ${typeName})`
                    );
                }
            }
            
            // Check for excess fields
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
     * Validates object type
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
     * Validates array type
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
     * Validates tuple type
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
     * Validates literal type
     */
    validateLiteralType(value, typeNode, fieldPath) {
        if (value !== typeNode.value) {
            throw new TypeError(
                `Type mismatch at ${fieldPath}: expected literal "${typeNode.value}", got ${JSON.stringify(value)}`
            );
        }
    }

    /**
     * Gets type name for value
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
    
    /**
     * Gets primitive type validators map
     */
    getPrimitiveValidators() {
        return {
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
    }
}

export default Evaluator;
