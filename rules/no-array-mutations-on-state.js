const MUTATING_ARRAY_METHODS = new Set([
    'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'
]);

function isMutatingArrayMethodOnFirstParamOrThis(node, firstParamName) {
    // Check if the call is for the sort method
    if (node.callee.property && MUTATING_ARRAY_METHODS.has(node.callee.property.name)) {
        let object = node.callee.object;
        // Traverse up the member expressions (e.g., this.something.nested) to the root
        while (object.type === 'MemberExpression') {
            object = object.object;
        }
        // After traversing up, if the last object is `this` or the first parameter, return true
        if ((object.type === 'ThisExpression') || (object.type === 'Identifier' && object.name === firstParamName)) {
            return true;
        }
    }
    return false;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow array mutations in pinia getters that modify the reactive state of the store itself.",
            category: "Possible Errors",
            recommended: false, // False because custom rules are not recommended by default
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    enableFix: {
                        type: 'boolean'
                    }
                },
                additionalProperties: false
            }
        ],
    },
    create: function (context) {
        const options = context.options[0] || {};
        const enableFix = options.enableFix === true; // Fix disabled by default if not explicitly set
        let gettersContext = [];

        return {
            'Property': function (node) {
                if (node.key.name === 'getters' && node.value.type === 'ObjectExpression') {
                    gettersContext.push(true);
                }
            },
            'Property:exit': function (node) {
                if (node.key.name === 'getters' && node.value.type === 'ObjectExpression') {
                    gettersContext.pop();
                }
            },
            'ArrowFunctionExpression': function (node) {
                if (gettersContext.length > 0 && node.params.length) {
                    const firstParamName = node.params[0].name;
                    // Save the first parameter name into the getters context. Use `getterFuncParam` key.
                    gettersContext[gettersContext.length - 1] = {getterFuncParam: firstParamName};
                }
            },
            'CallExpression': function (node) {
                if (
                    gettersContext.length > 0 &&
                    isMutatingArrayMethodOnFirstParamOrThis(node, gettersContext[gettersContext.length - 1].getterFuncParam)
                ) {
                    context.report({
                        node: node.callee.property,
                        message: require('../messages/messages'),
                        loc: node.callee.property.loc,
                        data: {
                            method: node.callee.property.name,
                        },
                        fix: enableFix ? function (fixer) {
                            const sourceCode = context.getSourceCode();
                            const sortableObjectText = sourceCode.getText(node.callee.object);
                            return fixer.replaceText(node.callee.object, `structuredClone(${sortableObjectText})`);
                        } : null,
                    });
                }
            }
        };
    }
}
