import importESLint from '../importers/eslint.importer';
import { FileInfo, API, Options } from 'jscodeshift';
import { EOL } from 'node:os';

const COMMENT_TEXT = 'TODO: Fix this the next time this file needs to be modified.';
const COMMENT_TEXT_REGEXP = /^.*TODO: Fix this the next time this file needs to be modified.*/;
const ESLINT_DISABLE_TEXT = 'eslint-disable-next-line';
const ESLINT_DISABLE_REGEXP = /^.*eslint-disable-next-line(\s|$)(.*)/;

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

        const splitSource = file.source.split(/\r?\n/);
        const sourceWithRulesToSuppress: {
            originalLine: string,
            rulesToSuppress: Set<string>,
            skipLine: boolean
        }[] = [];

        let nextLineRulesToSuppress: string[] = [];
        splitSource.forEach((sourceLine, index) => {
            if (ESLINT_DISABLE_REGEXP.test(sourceLine)) {
                const rulesText = sourceLine.slice(sourceLine.indexOf(ESLINT_DISABLE_TEXT) + ESLINT_DISABLE_TEXT.length);
                const rulesList = rulesText.split(',').map(_ => _.trim());
                nextLineRulesToSuppress = rulesList;
                sourceWithRulesToSuppress.push({
                    originalLine: sourceLine,
                    rulesToSuppress: new Set<string>(),
                    skipLine: true
                });
            } else if(COMMENT_TEXT_REGEXP.test(sourceLine)) {
                sourceWithRulesToSuppress.push({
                    originalLine: sourceLine,
                    rulesToSuppress: new Set<string>(),
                    skipLine: true
                });
            } else {
                sourceWithRulesToSuppress.push({
                    originalLine: sourceLine,
                    rulesToSuppress: new Set<string>(nextLineRulesToSuppress),
                    skipLine: false
                });
                nextLineRulesToSuppress = [];
            }
        });
        const finalSource = new Array<string>();

        targets.forEach(target => {
            const line = sourceWithRulesToSuppress[target.line - 1];
            line.rulesToSuppress.add(target.ruleId);
        });

        sourceWithRulesToSuppress.forEach((_) => {
            if (_.skipLine) {
                return;
            }

            const rulesToSuppress = Array.from(_.rulesToSuppress).sort((a, b) => a.localeCompare(b));
            const originalLine = _.originalLine;
            const originalLineIndentation = _.originalLine.slice(0, _.originalLine.indexOf(originalLine.trimStart()));
            if (rulesToSuppress.length > 0) {
                finalSource.push(`${originalLineIndentation}// ${COMMENT_TEXT}`);
                finalSource.push(`${originalLineIndentation}// ${ESLINT_DISABLE_TEXT} ${rulesToSuppress.join(', ')}`);
            }

            finalSource.push(_.originalLine);
        })

        return finalSource.join(EOL);
    } catch (e) {
        api.report(e);
    }
}
