import * as fsAsync from 'node:fs/promises'
import * as path from 'node:path';
import eslintRuleSuppressor from "./eslint-rule-suppressor.transformer";
import { FileInfo, API, Options } from 'jscodeshift';
import * as jscodeshift from 'jscodeshift';

const SOURCE_TEST_FILES_PATH = path.resolve('./test-files');
const TARGET_TEST_FILES_PATH = path.resolve(__dirname, 'test-files');
const ACTUAL_FILE_NAME_TS = 'actual.ts';
const ACTUAL_FILE_NAME_TSX = 'actual.tsx';
const EXPECTED_FILE_NAME_TS = 'expected.ts';
const EXPECTED_FILE_NAME_TSX = 'expected.tsx';

const getActualPath = (testFileName: string, tsx: boolean = false): string => {
    const fileName = tsx ? ACTUAL_FILE_NAME_TSX : ACTUAL_FILE_NAME_TS;
    const filePath = path.resolve(TARGET_TEST_FILES_PATH, testFileName, fileName);

    return filePath;
}

const getExpectedPath = (testFileName: string, tsx: boolean = false): string => {
    const fileName = tsx ? EXPECTED_FILE_NAME_TSX : EXPECTED_FILE_NAME_TS;
    const filePath = path.resolve(TARGET_TEST_FILES_PATH, testFileName, fileName);

    return filePath;
}

const readFileAsync = async (filePath: string) => {
    const fileText = await fsAsync.readFile(filePath, {
        encoding: 'utf-8'
    });

    return fileText;
}

const runTransformerAsync = async (targetFile: string) => {
    const fileText = await readFileAsync(targetFile);
    const file: FileInfo = { path: targetFile, source: fileText };
    const api: API = {
        j: jscodeshift.withParser('tsx'),
        jscodeshift: jscodeshift.withParser('tsx'),
        report: console.log,
        stats: undefined
    }
    const options: Options = {
        parser: 'tsx'
    }
    return await eslintRuleSuppressor(file, api, options);
}

describe('eslint-rule-suppressor.transformer', () => {

    beforeAll(async () => {
        await fsAsync.cp(SOURCE_TEST_FILES_PATH, TARGET_TEST_FILES_PATH, {
            recursive: true
        });
    })

    afterAll(async () => {
        await fsAsync.rm(TARGET_TEST_FILES_PATH, {
            recursive: true,
            maxRetries: 10,
        })
    })

    it('should transform a simple file', async () => {
        const testFileName = 'simple-test-file'
        const testFilePath = getActualPath(testFileName, false);
        const expectedPath = getExpectedPath(testFileName, false);
        const expectedResult = await readFileAsync(expectedPath);
        const result = await runTransformerAsync(testFilePath);

        expect(result.split(/\r?\n/)).toEqual(expectedResult.split(/\r?\n/));
    })

    it('should transform a file with multiple errors on a single line', async () => {
        const testFileName = 'multiple-errors-on-single-line'
        const testFilePath = getActualPath(testFileName, false);
        const expectedPath = getExpectedPath(testFileName, false);
        const expectedResult = await readFileAsync(expectedPath);
        const result = await runTransformerAsync(testFilePath);

        expect(result.split(/\r?\n/)).toEqual(expectedResult.split(/\r?\n/));
    })
})