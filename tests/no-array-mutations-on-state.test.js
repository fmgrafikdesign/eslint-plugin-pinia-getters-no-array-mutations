const message = require('../messages/messages');
const {RuleTester} = require('eslint');
const rule = require('../rules/no-array-mutations-on-state');

const ruleTester = new RuleTester({
    parserOptions: {ecmaVersion: 2020, sourceType: 'module'}
});

const MUTATING_ARRAY_METHODS = [
    'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'
];

// Error message function with placeholder replacement
function getErrorMessage(methodName) {
    // Define the message template here or import it from your messages file
    // Replace the placeholder with the actual method name
    return message.replace('{{method}}', methodName);
}

// Valid test cases for using mutating array methods on arrays created through non-mutating operations
const validTestCases = [
    // Using spread syntax to create a new array from 'state.property'
    {
        code: `const store = {
            getters: {
                validMethodStateSpread: state => [...state.array].sort()
            }
        };`,
        name: 'Allows mutation on a new array created by spread from state property',
    },
    // Using spread syntax to create a new array from 'this.property'
    {
        code: `const store = {
            getters: {
                validMethodThisSpread: state => [...this.array].sort()
            }
        };`,
        name: 'Allows mutation on a new array created by spread from this property',
    },
    // Using 'structuredClone' to create a new array from 'state.property'
    {
        code: `const store = {
            getters: {
                validMethodStateClone: state => structuredClone(state.array).sort()
            }
        };`,
        name: 'Allows mutating an array created by structuredClone from state property',
    },
    // Using 'structuredClone' to create a new array from 'this.property'
    {
        code: `const store = {
            getters: {
                validMethodThisClone: state => structuredClone(this.array).sort()
            }
        };`,
        name: 'Allows mutating an array created by structuredClone from this property',
    },
    // Using other non-mutating methods like 'concat', 'slice', 'map' etc.
    {
        code: `const store = {
            getters: {
                validMethodConcat: state => state.array.concat([4, 5, 6]).reverse()
            }
        };`,
        name: 'Allows mutating an array created by concat from state property',
    },
    {
        code: `const store = {
            getters: {
                validMethodSlice: state => state.array.slice().sort()
            }
        };`,
        name: 'Allows mutating an array created by slice from state property',
    },
];

// Tests for methods on the `state` parameter with enabled fix
const stateParamTests = options => MUTATING_ARRAY_METHODS.map((method) => {
    return {
        code: `const store = {
            getters: {
                stateMethod: state => state.array.${method}(/* args */)
            }
        };`,
        options,
        errors: [{ message: getErrorMessage(method) }],
        output: options[0].enableFix ? `const store = {
            getters: {
                stateMethod: state => structuredClone(state.array).${method}(/* args */)
            }
        };`: null,
        name: `No in-place methods on members of state param: .${method}()`,
    };
});

// Tests for deeply nested methods on the `state` parameter with enabled fix
const stateNestedTests = options => MUTATING_ARRAY_METHODS.map((method) => {
    return {
        code: `const store = {
            getters: {
                stateNestedMethod: state => state.property.${method}(/* args */)
            }
        };`,
        options,
        errors: [{ message: getErrorMessage(method) }],
        output: options[0].enableFix ? `const store = {
            getters: {
                stateNestedMethod: state => structuredClone(state.property).${method}(/* args */)
            }
        };`: null,
        name: `No in-place methods on member of state param: .${method}()`,
    };
});

// Tests for deeply nested methods on the `state` parameter with enabled fix
const stateDeepNestedTests = options => MUTATING_ARRAY_METHODS.map((method) => {
    return {
        code: `const store = {
            getters: {
                stateDeepNestedMethod: state => state.deep.nested.property.array.${method}(/* args */)
            }
        };`,
        options,
        errors: [{ message: getErrorMessage(method) }],
        output: options[0].enableFix ? `const store = {
            getters: {
                stateDeepNestedMethod: state => structuredClone(state.deep.nested.property.array).${method}(/* args */)
            }
        };` : null,
        name: `No in-place methods on deeply nested members of state param: .${method}()`,
    };
});

// Tests for methods on `this` with enabled fix
const thisTests = options => MUTATING_ARRAY_METHODS.map((method) => {
    return {
        code: `const store = {
            getters: {
                thisMethod: () => this.array.${method}(/* args */)
            }
        };`,
        options,
        errors: [{ message: getErrorMessage(method) }],
        output: options[0].enableFix ? `const store = {
            getters: {
                thisMethod: () => structuredClone(this.array).${method}(/* args */)
            }
        };` : null,
        name: `No in-place methods on members of 'this': .${method}()`,
    };
});

// Tests for nested property on `this` with enabled fix
const thisNestedTests = options => MUTATING_ARRAY_METHODS.map((method) => {
    return {
        code: `const store = {
            getters: {
                thisProperty: () => this.property.${method}(/* args */)
            }
        };`,
        options,
        errors: [{ message: getErrorMessage(method) }],
        output: options[0].enableFix ? `const store = {
            getters: {
                thisProperty: () => structuredClone(this.property).${method}(/* args */)
            }
        };` : null,
        name: `No in-place methods on members of 'this': .${method}()`,
    };
});

// Tests for deeply nested methods on `this` with enabled fix
const thisDeepNestedTests = options => MUTATING_ARRAY_METHODS.map((method) => {
    return {
        code: `const store = {
            getters: {
                thisDeepNestedMethod: () => this.deep.nested.property.array.${method}(/* args */)
            }
        };`,
        options,
        errors: [{ message: getErrorMessage(method) }],
        output: options[0].enableFix ? `const store = {
            getters: {
                thisDeepNestedMethod: () => structuredClone(this.deep.nested.property.array).${method}(/* args */)
            }
        };` : null,
        name: `No in-place methods on deeply nested members of 'this': .${method}()`,
    };
});

// If fix is enabled: Show error message, and update code with fix
ruleTester.run('no-in-place-in-this-or-first-param: with fix', rule, {
    valid: [
        ...validTestCases,
    ],
    invalid: [
        ...stateParamTests([{ enableFix: true }]),
        ...stateNestedTests([{ enableFix: true }]),
        ...stateDeepNestedTests([{ enableFix: true }]),
        ...thisTests([{ enableFix: true }]),
        ...thisNestedTests([{ enableFix: true }]),
        ...thisDeepNestedTests([{ enableFix: true }]),
    ],
});

// If fix is disabled: Only show error message, do not alter code
ruleTester.run('no-in-place-in-this-or-first-param: without fix', rule, {
    valid: [
        ...validTestCases,
    ],
    invalid: [
        ...stateParamTests([{ enableFix: false }]),
        ...stateNestedTests([{ enableFix: false }]),
        ...stateDeepNestedTests([{ enableFix: false }]),
        ...thisTests([{ enableFix: false }]),
        ...thisNestedTests([{ enableFix: false }]),
        ...thisDeepNestedTests([{ enableFix: false }]),
    ],
});
