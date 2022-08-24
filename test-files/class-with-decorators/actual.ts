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
export class ClassWithDecorators {

    @testDecorator
    // TEST COMMENT
    public testProperty = "hello";

    @testDecorator
    public testMethod() {
    }

    @testDecorator
    public get TestGetter() {
        return this.testProperty;
    }

    @testDecorator
    public set testSetter(value: any) {
    }
}

@testDecoratorFactory('hello')
export class ClassWithDecoratorFactories {

    @testDecoratorFactory('hello')
    // TEST COMMENT
    public testProperty = "hello";

    @testDecoratorFactory('hello')
    public testMethod() {
    }

    @testDecoratorFactory('hello')
    public get TestGetter() {
        return this.testProperty;
    }

    @testDecoratorFactory('hello')
    public set testSetter(value: any) {
    }
}