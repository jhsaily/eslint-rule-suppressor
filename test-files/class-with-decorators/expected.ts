/* eslint-disable */
/* eslint-enable @typescript-eslint/no-empty-function, quotes, @typescript-eslint/naming-convention */
/* eslint @typescript-eslint/no-empty-function: "error", quotes: ["error", "single"] */
/* eslint @typescript-eslint/naming-convention: ["error", {
      "selector": "default",
      "format": ["camelCase"]
    }] */

const testDecoratorFactory = (...args: any[]) => {
    console.log(args);
    return (...decoratorArgs: any[]) => {
        console.log(decoratorArgs);
    }
}

const testDecorator = testDecoratorFactory();

@testDecorator
// TODO: Fix this the next time this file needs to be modified.
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ClassWithDecorators {

    @testDecorator
    // TEST COMMENT
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line quotes
    public testProperty = "hello";

    @testDecorator
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public testMethod() {
    }

    @testDecorator
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get TestGetter() {
        return this.testProperty;
    }

    @testDecorator
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public set testSetter(value: any) {
    }
}

@testDecoratorFactory('hello')
// TODO: Fix this the next time this file needs to be modified.
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ClassWithDecoratorFactories {

    @testDecoratorFactory('hello')
    // TEST COMMENT
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line quotes
    public testProperty = "hello";

    @testDecoratorFactory('hello')
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public testMethod() {
    }

    @testDecoratorFactory('hello')
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get TestGetter() {
        return this.testProperty;
    }

    @testDecoratorFactory('hello')
    // TODO: Fix this the next time this file needs to be modified.
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public set testSetter(value: any) {
    }
}