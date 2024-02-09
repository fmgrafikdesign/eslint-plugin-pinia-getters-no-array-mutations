import {defineStore} from "pinia";

defineStore('will-lint', {
    state: {
        exampleArray: [0, 1, 2, 3, 4],
        some: {
            nestedArray: [
                { index: 0 },
                { index: 1 },
                { index: 2 },
                { index: 3 }
            ],
        },
    },
    getters: {
        // The rule will complain about these getters
        reverseArray1: state => state.exampleArray.reverse(),
        sortNestedArray1: state => state.some.nestedArray.sort(),
        reverseArray2: () => this.exampleArray.reverse(),
        sortNestedArray2: () => this.some.nestedArray.sort(),
    }
})
