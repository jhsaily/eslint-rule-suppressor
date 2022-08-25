#!/usr/bin/env node
import TransformRunner from "./runner";
import CommandLineArgumentHandler from './command-line-argument-handler';

(async function main() {
    const options = CommandLineArgumentHandler.parseArguments();
    if (options.src.length === 0 || options.help) {
        CommandLineArgumentHandler.printUsageGuide();
        return;
    }

    const runner = new TransformRunner();
    try {
        await runner.run(options);
    } catch {
        console.error('An error occurred when attempting to run the transformers. Check the above log for more details.')
    }
})();
