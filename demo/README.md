# Demo for eslint-plugin-pinia-getters-no-array-mutations

This is a minimal demo to showcase the rule. It shows how to set up the `.eslintrc` file and provides a minimal pinia store that will be linted by the `lint` script.

It is not a runnable vue application. 

### Installation

```shell
npm install
```

### Linting

```shell
npm run lint
```

This will give you multiple lint errors. If you enable the fix of the rule (see `.eslintrc.js`, linting with fixes will fix the issues as outlined in the rules readme file:

```shell
npm run lint:fix
```
