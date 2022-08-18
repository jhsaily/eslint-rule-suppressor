import { run as jscodeshift } from 'jscodeshift/src/runner';

export type RunnerOptions = {
    src: string[]
}

export default class TransformRunner {
    public async run(options: RunnerOptions) {
        const transformPath = require.resolve('./transformers/eslint-rule-suppressor.transformer');
        await jscodeshift(
            transformPath,
            options.src,
            {
                ...options,
                parser: 'tsx'
            });
    }
}