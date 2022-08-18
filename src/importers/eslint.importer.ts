import { createRequire } from 'node:module';
import { ESLint } from 'eslint';
import { resolve } from 'node:path';

export default function importESLint(options?: ESLint.Options): ESLint | undefined {
    try {
        const require = createRequire(resolve(process.cwd(), 'index.js'));
        const eslint = require('eslint').ESLint;
        return new eslint(options);
    } catch {
        return undefined;
    }
}