#!/usr/bin/env node

import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import { load, JSON_SCHEMA } from 'js-yaml';
import { promises, existsSync, lstatSync, readFileSync, writeFileSync } from 'fs';
import { isAbsolute, join, parse } from 'path';
import yargs from 'yargs/yargs';

/**
 * yaml to typescript
 */
const cli = async () => {
  // process data
  const argv = await yargs(process.argv.slice(2)).boolean(['t', 'h', 'o', 's']).argv;
  const source = argv._[0] as string;
  const target = argv._[1] as string;
  const typescript = argv.t as boolean;
  const help = argv.h as boolean;
  const silent = argv.s as boolean;
  const opt = argv.o as boolean;
  const cwd = process.cwd();

  // print help
  if (help) {
    console.log(`  usage : ymlts source [target] [flags]

  source: source file path to .yaml or .yml
  target: target file path to .d.ts or .ts file
  flags : -t  generate .ts instead of .d.ts
          -o  make all properties optional
          -s  silent mode
          -h  show help message
    `);
    // interrupe process
    return;
  }

  // handle source
  const sourceArg = source;
  const sourceAbsolut = isAbsolute(sourceArg);
  const sourcePath = sourceAbsolut ? sourceArg : join(cwd, sourceArg);
  const sourceDir = parse(sourcePath).dir;
  const sourceName = parse(sourcePath).name;
  const sourceBase = join(sourceDir, sourceName);
  const sourceYaml = sourceBase.concat('.yaml');
  const sourceYml = sourceBase.concat('.yml');
  const sourceFileYaml = existsSync(sourceYaml) && lstatSync(sourceYaml).isFile();
  const sourceFileYml = existsSync(sourceYml) && lstatSync(sourceYml).isFile();
  const sourceFile = sourceFileYaml ? sourceYaml : sourceFileYml ? sourceYml : sourcePath;

  const targetArg = target ? target.replace(/\.d\.ts|\.ts/g, '') : source;
  const targetAbsolut = isAbsolute(targetArg);
  const targetPath = targetAbsolut ? targetArg : join(cwd, targetArg);
  const targetDir = parse(targetPath).dir;
  const targetName = parse(targetPath).name;
  const targetBase = join(targetDir, targetName);
  const targetFile = targetBase.concat(typescript ? '.ts' : '.d.ts');

  // print source and target
  if (!silent) console.log('source:\t', sourceFile);
  if (!silent) console.log('target:\t', targetFile);

  // throw error file not found
  if (!sourceFileYaml && !sourceFileYml) throw Error('source file not found');

  // yaml to json
  const file = readFileSync(sourceFile, 'utf8');
  const doc = load(file, { schema: JSON_SCHEMA, json: true });

  // json to typescript
  const targetData = await generator(doc, targetName, typescript, opt);

  // write file
  await promises.mkdir(targetDir, { recursive: true });
  writeFileSync(targetFile, targetData);
};

/**
 * parse json file to typescript
 * @param {any} doc json file
 * @param {string} name main interface type name
 * @param {boolean} ts generate typescript file
 * @param {boolean} opt optional properties
 * @return {string} serialized typescript or typescript types file
 */
const generator = async (doc: any, name: string, ts: boolean, opt: boolean): Promise<string> => {
  // target language
  const targetLanguage = jsonInputForTargetLanguage('ts');
  await targetLanguage.addSource({
    name: name,
    samples: [JSON.stringify(doc)],
  });

  // input data
  const inputData = new InputData();
  inputData.addInput(targetLanguage);

  // serialize
  const { lines } = await quicktype({
    inputData: inputData,
    lang: 'ts',
    allPropertiesOptional: opt ? true : false,
    rendererOptions: {
      'just-types': 'true',
    },
  });

  // typescript or typescript types
  const data = ts ? lines : lines.map((e) => e.replace('export ', ''));

  // return data as string
  return data.join('\n');
};

/**
 * process error handler
 * @param {Error} error process error
 */
const error = (error: Error) => {
  let message;

  switch (error.name) {
    case 'TypeError':
      message = 'error:\t source file undefined';
      break;

    default:
      message = 'error:\t ' + error.message;
      break;
  }

  console.log(message);
};

/**
 * main process
 */
const main = async () => {
  await cli();
};

// execute process
main().catch(error);
