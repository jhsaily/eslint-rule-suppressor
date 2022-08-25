import * as commandLineUsage from "command-line-usage";
import * as commandLineArgs from "command-line-args";

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

export interface CommandLineArguments {
    src: string[];
    suppressWarnings: boolean;
    help: boolean;
}

const defaultArguments: CommandLineArguments = {
    src: [],
    suppressWarnings: false,
    help: false,
}

export default class CommandLineArgumentHandler {
    public static parseArguments(): CommandLineArguments {
        const options = commandLineArgs(commandLineOptions);

        return {...defaultArguments, ...options};
    }

    public static printUsageGuide() {
        console.log(commandLineUsage(sections));
    }
}