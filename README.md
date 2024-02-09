# eslint-plugin-pinia-getters-no-array-mutations


This ESLint plugin introduces a rule for [Pinia](https://pinia.vuejs.org/), the intuitive, type-safe, and flexible store pattern for [Vue.js](https://vuejs.org/) applications. By ensuring that [getters](https://pinia.vuejs.org/core-concepts/getters.html) in Pinia stores avoid in-place array mutations on the store's state, it prevents side effects, hard-to-track reactivity issues and unexpected infinite recursive
behavior, ensuring a smoother development experience and less frustrating bug hunts. :)

## Installation

If you haven't installed eslint in your project yet, follow its [installation guide](https://eslint.org/).

Then, install this plugin:
```shell
npm install eslint-plugin-pinia-getters-no-array-mutations --save-dev
```
## Usage
To include the rule in your ESLint checks, add it to your `.eslintrc` configuration like this:

```javascript
{
  "plugins": [
    // ... other plugins
    "pinia-getters-no-array-mutations"
  ],
  "rules": {
    // ... other rules
    "pinia-getters-no-array-mutations/no-array-mutations-on-state": "error",
  }
}
```

### Fix

The rule offers an automatic fix in the form of creating a clone of the original structure via `structuredClone`.
Be aware that this changes the semantics of your code, therefore it is disabled by default. If you are not sure what
`structuredClone` does or if it's the right approach for you, please read the section
[Understanding the Fix](#understanding-the-automatic-fix-structuredClone-deep-cloning).

You can enable the automatic fix in you `.eslintrc` configuration like this:

```javascript
"rules": {
  // ...
  "pinia-getters-no-array-mutations/no-array-mutations-on-state": ["error", { "enableFix": true }]
  // ...
}
```

Executing the fix will wrap the affected property in a `structuredClone()` call:

```javascript
// Before:
sortedDifferently: (state) => state.someArray.sort(sortFn)

// After:
sortedDifferently: (state) => structuredClone(state.someArray).sort(sortFn)
```

## About the rule: `no-array-mutations-on-state`

This rule checks for and reports any usage of array methods that mutate the store's state directly within Pinia getters.

### Examples

#### Invalid Code Examples

The rule will flag any use of mutating array methods that are directly applied to `this`, `state`, or any nested
properties within a Pinia getter function. Here are some examples that __will be flagged__ by the rule:

```javascript
const store = {
  getters: {
    // Using .sort() directly on this.someArray
    sortedArray: (state) => this.someArray.sort(sortFn),

    // Mutating a nested array on this
    sortedNestedArray: (state) => this.nested.someArray.sort(sortFn),

    // same idea for state
    sortedStateArray: (state) => state.someArray.sort(sortFn),

    // Mutating a nested array on state
    sortedStateNestedArray: (state) => state.nested.someArray.sort(sortFn),
  }
};
```

#### Valid Code Examples

The following code examples use non-mutating patterns and will not be flagged by the rule:

```javascript
const store = {
  getters: {
    // Making a shallow copy of an array on this before sorting - may still be dangerous if you have nested arrays
    sortedArray: (state) => [...this.someArray].sort(sortFn),
    sortedNestedArray: (state) => [...this.nested.someArray].sort(sortFn),
    
    // Same for state
    sortedStateArray: (state) => [...state.someArray].sort(sortFn),
    sortedStateNestedArray: (state) => [...state.nested.someArray].sort(sortFn),
    
    // Using structuredClone to deeply clone an array on this before sorting
    sortedDeepCloneArray: (state) => structuredClone(this.someArray).sort(sortFn),
    sortedStateDeepCloneNestedArray: (state) => structuredClone(state.nested.someArray).sort(sortFn),
  }
};
```

### What This Rule Checks

- Any instance where `this`, `state` or any member like `state.someArray` `this.deeply.nested.property` is followed by a call to a mutating array method.
- Usage of `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, and `copyWithin` on arrays that are
  part of the store's reactive state.

### Limitations / What This Rule Doesn't Check

#### Mutating other stores

The rule currently does not cover cases where other stores' getters or properties are mutated. For example:
  ```javascript
  getters: {
    sortedDifferently: () => {
      const otherStore = useOtherStore();
      otherStore.someArray.sort(sortFn); // Not currently flagged by this rule, but still dangerous
    }
  }
  ```

  Since the rule does not flag the mutation of other properties, e.g. from other stores, you may still end up with
methods that mutate arrays in place. This is a trade-off because the alternative would be to make the rule very broad,
which could end up causing a lot of false positives, e.g. flagging operations on non-reactive arrays.  If you have a good approach to improve this, please open a pull request or raise an issue :)

#### Complex reactivity inheritance

If you build complex getters, for example by using `Maps`, `Sets`, `Object.values` or similar to get a subset of your state, and then use
methods that mutate this subset, it might affect the underlying reactive state. This rule is not made for complex
use cases like that.

#### Your copy method

The rule does not check the contents of your array. If you create a shallow copy of a deeply nested array,
you may still end up mutating properties of the original state if you mutate it. Example:

  ```javascript
  getters: {
    sortedDifferently: () => {
      const otherStore = useOtherStore();
      otherStore.someArray.sort(sortFn); // Not currently flagged by this rule, but still dangerous
    }
  }
  ```

To avoid this, use a deep cloning
method like `structuredClone` or any library of your choosing, popular choices being lodash's
[_.cloneDeep](https://www.geeksforgeeks.org/lodash-_-clonedeep-method/) or [klona](https://github.com/lukeed/klona).

## Understanding the Automatic Fix: `structuredClone` Deep Cloning

This plugin offers an automatic fix to prevent array mutations by cloning the target array before applying methods like
`.sort()`. The cloning is done using the structuredClone function, a recent addition to the JavaScript language that
creates a deep clone of a given object, preserving the structure and data of the original without any reference to it.

### Implications of Using `structuredClone`:
- __Deep Cloning__: Unlike shallow copy techniques, `structuredClone` will recursively copy all properties, leading to
  a completely new array while maintaining nested data. This is useful for preventing side effects in reactive state
  management but be mindful of any performance implications.
- __Compatibility__: `structuredClone` is supported in modern browsers and Node.js environments; however, if you are
  targeting older environments, a polyfill or alternative cloning method may be necessary.
  Check a compatibility table like [caniuse](https://caniuse.com/?search=structuredClone) for up-to-date support information.
- __Performance Considerations__: Deep cloning an entire structure can be more resource-intensive than shallow cloning.
  While this shouldn't be an issue for small to medium-sized arrays, it's important to be cautious with large or complex
  state objects, as the operation could impact performance or memory usage.
- __Semantic Changes__: Keep in mind that wrapping array operations with structuredClone results in a semantic change
  to your getters. The returned arrays will now be independent copies, any changes to them won't be reflected in the
  original state, and vice versa.

### Alternatives

- If your state's array only consists of primitives, you may prefer to use
[spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) like this:
`[...state.shallowArray].sort(sortFn)`. This creates a shallow copy of your array.
- If structuredClone does not meet your requirements, feel free to use any other cloning method or library like lodash's
  [_.cloneDeep](https://www.geeksforgeeks.org/lodash-_-clonedeep-method/) or [klona](https://github.com/lukeed/klona).
Example:
  ```javascript
  import { cloneDeep } from 'lodash';
  
  // ...
  getters: {
      sortedArray: (state) => cloneDeep(state).sort(sortFn), // valid 
  }
  // ...
  ```

## Motivation

After one too many hard-to-track reactivity issues, `maximum call stack size exceeded` errors and infinite recursion
loops, I am no longer willing to spend time endlessly debugging code just to remember at some point that `.sort`
modifies arrays in place.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a
pull request.

License: ISC

© Fabian Mohr, 2024. All rights reserved.
