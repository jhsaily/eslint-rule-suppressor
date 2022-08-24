import importESLint from '../importers/eslint.importer';
import { FileInfo, API, Options } from 'jscodeshift';
import { EOL } from 'node:os';

const COMMENT_TEXT = 'TODO: Fix this the next time this file needs to be modified.';

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

        // const codeShiftResult = api.j(file.source);
        const splitSource = file.source.split(/\r?\n/).map(_ => {
            return { originalLine: _, errorsToSuppress: new Set<string>() };
        });
        const finalSource = new Array<string>();

        targets.forEach(target => {
            const line = splitSource[target.line - 1];
            line.errorsToSuppress.add(target.ruleId);
        });

        splitSource.forEach((_) => {
            const rulesToSuppress = Array.from(_.errorsToSuppress).sort((a, b) => a.localeCompare(b));
            const originalLine = _.originalLine;
            const originalLineIndentation = _.originalLine.slice(0, _.originalLine.indexOf(originalLine.trimStart()));
            if (rulesToSuppress.length > 0) {
                finalSource.push(`${originalLineIndentation}// ${COMMENT_TEXT}`);
                finalSource.push(`${originalLineIndentation}// eslint-disable-next-line ${rulesToSuppress.join(', ')}`);
            }

            finalSource.push(_.originalLine);
        })

        return finalSource.join(EOL);
    } catch (e) {
        api.report(e);
    }
}
