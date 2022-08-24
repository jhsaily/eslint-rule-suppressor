/* eslint-disable */
/* eslint-enable @typescript-eslint/no-empty-function, quotes */
/* eslint @typescript-eslint/no-empty-function: "error", quotes: ["error", "single"] */

class MultipleErrorsSingleLineClass {
    constructor(arg: string = "") {
    }

    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    someMethod(arg: string = "") {
    }

    // eslint-disable-next-line quotes
    anotherMethod(args: string = "") {
        // do something
    }
}