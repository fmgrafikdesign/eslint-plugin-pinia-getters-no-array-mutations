module.exports = {
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    // 1. Import the plugin
    "plugins": [
        "pinia-getters-no-array-mutations"
    ],
    // 2. Activate the rule
    "rules": {
        // "pinia-getters-no-array-mutations/no-array-mutations-on-state": "error",
        // Alternatively, you can enable the fix (see README of the rule):
        "pinia-getters-no-array-mutations/no-array-mutations-on-state": ["error", { enableFix: true }],
    }
}
