import importESLint from '../importers/eslint.importer';
import { FileInfo, API, Options, types, ASTPath } from 'jscodeshift';

const COMMENT_TEXT = 'TODO: Fix this the next time this file needs to be modified.';
const ESLINT_DISABLE_REGEXP = /^\s*eslint-disable-next-line(\s|$)(.*)/;

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

        const codeShiftResult = api.j(file.source);

        targets.forEach(target => {
            const startingPaths = codeShiftResult.find(
                types.namedTypes.Node,
                (node) => node.loc && node.loc.start.line === target.line)
                .paths();

            const firstPathOnLine =
                startingPaths.find((path) => path.node.loc.end.line === target.line) ||
                startingPaths[0];

            if (!firstPathOnLine) {
                api.report(
                    `Unable to find any nodes on line ${target.line} of ${file.path}. Skipping suppression of ${target.ruleId}`
                );

                return;
            }

            addDisableComment(file.path, api, COMMENT_TEXT, target.line, target.ruleId, firstPathOnLine);
        });

        return codeShiftResult.toSource();
    } catch (e) {
        api.report(e);
    }
}

function addDisableComment(filePath: string, api: API, commentText: string, targetLine: number, ruleId: string, path: ASTPath<any>) {

    let targetPath = path;
    while (
        targetPath.parent &&
        (!targetPath.parent.node.loc || targetPath.parent.node.loc.start.line === targetLine)
        ) {
        targetPath = targetPath.parent;
    }

    if (
        targetPath.parent &&
        targetPath.parent.value.type === 'IfStatement' &&
        targetPath.parent.value.alternate === targetPath.value &&
        targetPath.parent.value.consequent.type === 'BlockStatement'
    ) {
        const ifStatement = targetPath.parent.value;

        const { consequent } = ifStatement;
        const consequentBody = consequent.body;

        if (consequentBody.length === 0) {
            if (tryRewriteEslintDisable(consequent.innerComments, ruleId)) {
                return;
            }

            consequentBody.push(api.j.noop());
        }

        const lastStatement = consequentBody[consequentBody.length - 1];

        if (tryRewriteEslintDisable(lastStatement.trailingComments, ruleId)) {
            return;
        }

        if (!lastStatement.comments) {
            lastStatement.comments = [];
        }

        if (!lastStatement.trailingComments) {
            lastStatement.trailingComments = [];
        }

        const newComments = [
            createTrailingComment(api, ` ${commentText}`),
            createTrailingComment(api, ` eslint-disable-next-line ${ruleId}`),
        ];

        lastStatement.comments.push(...newComments);
        lastStatement.trailingComments.push(...newComments);

        return;
    }

    if (targetPath.node.type === 'JSXClosingElement') {
        const { children } = targetPath.parent.value;

        if (tryRewriteJsxEslintDisable(children, children.length, ruleId)) {
            return;
        }

        children.push(createJsxComment(api, commentText));
        children.push(api.j.jsxText('\n'));
        children.push(createJsxComment(api, `eslint-disable-next-line ${ruleId}`));
        children.push(api.j.jsxText('\n'));

        return;
    }

    if (targetPath.node.type === 'JSXAttribute') {
        createNormalComment(api, ruleId, commentText, targetPath.value);

        return;
    }

    if (targetPath.parent && targetPath.parent.node.type === 'JSXExpressionContainer') {
        createNormalComment(api, ruleId, commentText, targetPath.value);

        return;
    }

    if (targetPath.parent && targetPath.parent.node.type.substr(0, 3) === 'JSX') {
        if (!targetPath.parent.value.children) {
            api.report(`Skipping suppression of violation of ${ruleId} on ${targetLine} of ${filePath}`);
            return;
        }

        const { children } = targetPath.parent.value;

        // jscodeshift has some bugs around how it handles JSXText nodes that can cause
        // it to swallow significant whitespace. Creating whitespace only nodes appears to
        // solve the issue.
        for (let siblingIndex = children.length - 1; siblingIndex >= 0; siblingIndex--) {
            const sibling = children[siblingIndex];
            if (sibling.type !== 'JSXText') {
                continue;
            }

            if (sibling.value[0] === '\n' && sibling.value.trim().length === 0) {
                continue;
            }

            const lines = sibling.value.split('\n');
            const segments = lines.flatMap((line, lineIndex) => {
                const result = [];

                const trimmedLine = line.trimEnd();
                if (trimmedLine.length !== 0) {
                    if (lineIndex === 0) {
                        const startTrimmedLine = trimmedLine.trimStart();
                        if (startTrimmedLine.length === line.length) {
                            result.push(line);
                        } else {
                            if (startTrimmedLine.length < trimmedLine.length) {
                                result.push(trimmedLine.substr(0, trimmedLine.length - startTrimmedLine.length));
                            }

                            result.push(startTrimmedLine);

                            if (trimmedLine.length < line.length) {
                                result.push(line.substr(trimmedLine.length));
                            }
                        }
                    } else {
                        if (trimmedLine.length === line.length) {
                            result.push(line);
                        } else {
                            result.push(trimmedLine, line.substr(trimmedLine.length));
                        }
                    }
                }

                if (lineIndex != lines.length - 1) {
                    result.push('\n');
                }

                return result;
            });

            children.splice(siblingIndex, 1, ...segments.map((segment) => api.j.jsxText(segment)));
        }

        let targetIndex = children.indexOf(targetPath.value);
        for (let siblingIndex = targetIndex - 1; siblingIndex >= 0; siblingIndex--) {
            const sibling = children[siblingIndex];
            if (sibling.type === 'JSXText') {
                if (sibling.value.indexOf('\n') !== -1) {
                    break;
                }

                targetIndex = siblingIndex;
            } else if (sibling.loc) {
                if (sibling.loc.start.line !== targetLine) {
                    break;
                }

                targetIndex = siblingIndex;
            }
        }

        if (tryRewriteJsxEslintDisable(children, targetIndex, ruleId)) {
            return;
        }

        const previousSibling = children[targetIndex - 1];

        if (previousSibling && previousSibling.type === 'JSXText') {
            const textValue = previousSibling.value;
            const lastNewline = textValue.lastIndexOf('\n');
            if (
                lastNewline !== textValue.length - 1 &&
                textValue.substr(lastNewline + 1).trim().length === 0
            ) {
                previousSibling.value = textValue.substr(0, lastNewline);
                children.splice(targetIndex, 0, api.j.jsxText(textValue.substr(lastNewline)));
                targetIndex++;
            }
        }

        children.splice(
            targetIndex,
            0,
            createJsxComment(api, commentText),
            api.j.jsxText('\n'),
            createJsxComment(api, `eslint-disable-next-line ${ruleId}`),
            api.j.jsxText('\n')
        );

        return;
    }

    createNormalComment(api, ruleId, commentText, targetPath.value);
}

function createNormalComment(api: API, ruleId: string, commentText: string, targetNode) {

    if (tryRewriteEslintDisable(targetNode.leadingComments, ruleId)) {
        return;
    }

    if (!targetNode.comments) {
        targetNode.comments = [];
    }

    if (!targetNode.leadingComments) {
        targetNode.leadingComments = [];
    }

    const newComments = [
        api.j.line(` ${commentText}`),
        api.j.line(` eslint-disable-next-line ${ruleId}`),
    ];

    targetNode.comments.push(...newComments);
    targetNode.leadingComments.push(...newComments);
}

function tryRewriteJsxEslintDisable(children, targetIndex, ruleId) {
    let currentIndex = targetIndex - 1;

    while (currentIndex >= 0) {
        const sibling = children[currentIndex];
        if (sibling.type === 'JSXText' && sibling.value.trim().length === 0) {
            currentIndex--;
        } else {
            if (
                sibling.type === 'JSXExpressionContainer' &&
                sibling.expression.type === 'JSXEmptyExpression' &&
                tryRewriteEslintDisable(sibling.expression.comments, ruleId)
            ) {
                return true;
            }

            return false;
        }
    }

    return false;
}

function tryRewriteEslintDisable(comments, ruleId) {
    if (!comments || !comments.length) {
        return false;
    }

    const lastComment = comments[comments.length - 1];

    const match = ESLINT_DISABLE_REGEXP.exec(lastComment.value);
    if (!match) {
        return false;
    }

    const [ruleDetails, ...explanationParts] = match[2].split('--');

    const disabledRules = ruleDetails.split(',').map((x) => x.trim());
    if (!disabledRules.length || disabledRules.includes(ruleId)) {
        return true;
    }

    const explanationSuffix = explanationParts.length
        ? ` -- ${explanationParts.join('--').trim()}`
        : '';

    lastComment.value = ` eslint-disable-next-line ${disabledRules.join(
        ', '
    )}, ${ruleId}${explanationSuffix}`;

    if (lastComment.type === 'CommentBlock') {
        lastComment.value += ' ';
    }

    return true;
}

// Using the builder methods to generate a jsx comment expression
// results in newlines in weird places. Parsing the exact strings that
// we want, however, produces the desired output.
function createJsxComment(api: API, text: string) {
    // The <element> around the curly braces causes this to be parsed as a JSXExpressionContainer
    // instead of as a BlockExpression.
    const expressionContainer = api.j(`<element>{/* a comment */}</element>`).paths()[0].value.program
        .body[0].expression.children[0];

    expressionContainer.expression.innerComments[0].value = ` ${text} `;

    return expressionContainer;
}

// Using the builder methods to generate trailing comments results
// in comments without preceding newlines. However, parsing a small
// module containing a trailing comment with a preceding newline will
// generate a node with the necessary properties.
function createTrailingComment(api: API, text: string) {
    const comment = api
        .j(
            `statement();
// trailing comment`
        )
        .paths()[0].value.program.body[0].comments[0];

    comment.value = text;

    return comment;
}
