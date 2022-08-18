#!/usr/bin/env node
import TransformRunner, {RunnerOptions} from "./runner";
import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";

const appName = 'eslint-rule-suppressor';

const commandLineOptions: commandLineUsage.OptionDefinition[] = [
    { name: 'src', type: String, multiple: true, typeLabel: '{underline file(s)} OR {underline path(s)}', description: 'The source file(s) to process.' },
    { name: 'suppressWarnings', type: Boolean, description: 'Whether warnings should also be suppressed' },
    { name: 'help', type: Boolean, description: 'Print this usage guide.' },
];
const sections: commandLineUsage.Section[] = [
    {
        header: appName,
        content: 'Suppresses eslint rules on a file-per-file basis using the configured linting rules'
    },
    {
        header: 'Options',
        optionList: commandLineOptions
    },
    {
        header: 'Examples',
        content: [
            {
                desc: 'Suppress a single file',
                example: `$ ${appName} --src ./path/to/file.ts`
            },
            {
                desc: 'Suppress a multiple files',
                example: `$ ${appName} --src ./path/to/first/file.ts ./path/to/second/file.ts`
            },
            {
                desc: 'Suppress a single directory',
                example: `$ ${appName} --src ./path/to/directory`
            },
            {
                desc: 'Suppress a multiple directories',
                example: `$ ${appName} --src ./path/to/first/directory ./path/to/second/directory`
            },
            {
                desc: 'Show this usage guide',
                example: `$ ${appName} --help`
            },
        ]
    },
];

(async function main() {
    const options = commandLineArgs(commandLineOptions);
    if (options.src === undefined || options.help) {
        console.log(commandLineUsage(sections));
        return;
    }

    const runner = new TransformRunner();
    try {
        await runner.run(options as RunnerOptions);
    } catch {
        console.error('An error occurred when attempting to run the transformers. Check the above log for more details.')
    }
})();