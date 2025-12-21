# Constructor Inheritance in BCON

BCON supports full inheritance of constructor parameters in class definitions.

## Basic Inheritance

When a child class extends a parent class that has constructor parameters, the child can:
1. Add its own constructor parameters
2. Inherit parent's constructor parameters if it doesn't define any
3. Override parent fields using constructor parameters

### Example 1: Child adds parameters

```bcon
class Animal (name, age) [
    @name: String => name;
    @age: Number => age;
    @species: String => "Unknown";
];

class Dog (name, age, breed) extends Animal [
    @breed: String => breed;
];

export Dog("Buddy", 5, "Golden Retriever");
# Result: { name: "Buddy", age: 5, species: "Unknown", breed: "Golden Retriever" }
```

### Example 2: Child inherits parent constructor

If the child doesn't define constructor parameters, it automatically inherits the parent's:

```bcon
class Person (name, age) [
    @name: String => name;
    @age: Number => age;
];

class Employee extends Person [
    @employeeId: String => "EMP-001";
    @department: String => "General";
];

export Employee("John", 30);
# Result: { name: "John", age: 30, employeeId: "EMP-001", department: "General" }
```

### Example 3: Multi-level inheritance

Constructor parameters are inherited through multiple levels:

```bcon
class LivingBeing (name) [
    @name: String => name;
    @alive: Boolean => True;
];

class Animal (name, species) extends LivingBeing [
    @species: String => species;
];

class Dog (name, species, breed) extends Animal [
    @breed: String => breed;
];

export Dog("Max", "Canine", "Labrador");
# Result: { name: "Max", alive: true, species: "Canine", breed: "Labrador" }
```

### Example 4: Overriding parent fields

Child constructor parameters can override parent's default values:

```bcon
class Base (value) [
    @value: String => value;
    @category: String => "base";
];

class Derived (value, category) extends Base [
    @category: String => category;  # Overrides parent's default
    @extended: Boolean => True;
];

export Derived("test", "custom");
# Result: { value: "test", category: "custom", extended: true }
```

### Example 5: Mixing validators and constructors

A child with a constructor can extend a parent validator (class without constructor):

```bcon
class BaseConfig [
    @timeout: Number => 5000;
    @retries: Number => 3;
];

class CustomConfig (name) extends BaseConfig [
    @name: String => name;
    @custom: Boolean => True;
];

export CustomConfig("MyConfig");
# Result: { timeout: 5000, retries: 3, name: "MyConfig", custom: true }
```

### Example 6: Default values with inheritance

Constructor parameters support the `?` operator for default values:

```bcon
class Connection (host, port) [
    @host: String => host ? "localhost";
    @port: Number => port ? 8080;
];

class SecureConnection (host, port, cert) extends Connection [
    @cert: String => cert ? "default.pem";
    @secure: Boolean => True;
];

export SecureConnection("example.com", Null, Null);
# Result: { host: "example.com", port: 8080, cert: "default.pem", secure: true }
```

## Rules

1. **Parameter addition**: Child classes can add new constructor parameters to those inherited from parent
2. **Parameter inheritance**: If child has no constructor parameters, it inherits parent's parameters
3. **Field inheritance**: All fields from parent classes are inherited and can be overridden
4. **Type validation**: Type checking applies to all inherited and new fields
5. **Default values**: Both parent and child constructor parameters can use `?` operator for defaults

## Use Cases

- Creating specialized versions of base classes (e.g., `Animal` → `Dog`)
- Building configuration hierarchies (e.g., `BaseConfig` → `ServerConfig`)
- Implementing type hierarchies with progressive specialization
- Reusing constructor logic across related classes
