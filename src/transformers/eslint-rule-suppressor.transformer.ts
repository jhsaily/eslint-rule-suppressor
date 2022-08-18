import importESLint from '../importers/eslint.importer';
import type { FileInfo, API, Options } from 'jscodeshift';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function eslintRuleSuppressor(file: FileInfo, api: API, options: Options) {
    const eslint = importESLint();

    try {
        const allResults = await eslint.lintText(file.source, { filePath: file.path });
        const result = allResults[0];

        if (!allResults || !result || !result.messages || result.messages.length === 0) {
            return;
        }

        const targets = result.messages.filter(_ => _.ruleId && (_.severity >= 2 || (options.suppressWarnings && _.severity >= 1)));

        if (targets.length === 0) {
            return;
        }

        targets.forEach(target => {

        })
    } catch (e) {
        console.error(e)
    }
}