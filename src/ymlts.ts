#!/usr/bin/env node

import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import { load, JSON_SCHEMA } from 'js-yaml';
import { readdirSync, promises, existsSync, lstatSync, readFileSync, writeFileSync } from 'fs';
import { extname, isAbsolute, join, parse } from 'path';
import yargs from 'yargs/yargs';

/**
 * yaml to typescript
 */
const cli = async () => {
  // process data
  const argv = await yargs(process.argv.slice(2)).boolean(['t', 'h', 'o', 's', 'm']).argv;
  const source = argv._[0] as string;
  const target = argv._[1] as string;
  const types = argv.t as boolean;
  const help = argv.h as boolean;
  const silent = argv.s as boolean;
  const opt = argv.o as boolean;
  const merge = argv.m as boolean;
  const cwd = process.cwd();

  if (help) {
    // print help
    console.log(`  usage : ymlts source [target] [flags]

    source: source file or folder to .yaml or .yml
    target: target file or folder to .d.ts or .ts file
    flags : -t  generate .ts instead of .d.ts
            -o  make all properties optional
            -m  merge all files into one
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
  const sourceIsDir = existsSync(sourcePath) && lstatSync(sourcePath).isDirectory();
  const sourceYaml = sourcePath.concat('.yaml');
  const sourceYml = sourcePath.concat('.yml');
  const sourceIsYaml = existsSync(sourceYaml);
  const sourceIsYml = existsSync(sourceYml);
  const sourceFile = sourceIsYaml ? sourceYaml : sourceIsYml ? sourceYml : sourcePath;
  const sourceFiles = sourceIsDir ? getYamlFiles(sourcePath) : [sourceFile];

  // handle target
  const targetArg = target ? target.replace(/\.d\.ts|\.ts/g, '') : source;
  const targetAbsolut = isAbsolute(targetArg);
  const targetPath = targetAbsolut ? targetArg : join(cwd, targetArg);
  const targetFile = targetPath.concat(types ? '.ts' : '.d.ts');
  const targetFiles = sourceIsDir ? sourceFiles.map(file => {
    return file.replace(source, target).replace(/\.yml|\.yaml/g, types ? '.ts' : '.d.ts');
  }) : [targetFile];

  // throw error if no source files found
  if (!sourceIsYaml && !sourceIsYml && !sourceFiles.length) {
    throw Error('no source files found');
  }

  if (merge) {
    // merge types into one file
    let samples: string[] = [];

    for (let i = 0; i < sourceFiles.length; i++) {
      // print status
      if (!silent) console.log('source:\t', sourceFiles[i]);

      // yaml to json
      const yaml = readFileSync(sourceFiles[i], 'utf8');
      const json = load(yaml, { schema: JSON_SCHEMA, json: true });
      samples.push(JSON.stringify(json));
    }

    // print status
    if (!silent) console.log('target:\t', targetFile);

    // json to typescript
    const dir = parse(targetFile).dir;
    const name = parse(targetFile.replace(/\.d\.ts|\.ts/g, '')).name;
    const typescript = await generator(samples, name, types, opt);

    // write file
    await promises.mkdir(dir, { recursive: true });
    writeFileSync(targetFile, typescript);
  } else {
    for (let i = 0; i < sourceFiles.length; i++) {
      // print status
      if (!silent) console.log('source:\t', sourceFiles[i]);
      if (!silent) console.log('target:\t', targetFiles[i]);

      // yaml to json
      const yaml = readFileSync(sourceFiles[i], 'utf8');
      const json = load(yaml, { schema: JSON_SCHEMA, json: true });
      const samples = [JSON.stringify(json)];

      // json to typescript
      const dir = parse(targetFiles[i]).dir;
      const name = parse(targetFiles[i].replace(/\.d\.ts|\.ts/g, '')).name;
      const typescript = await generator(samples, name, types, opt);

      // write file
      await promises.mkdir(dir, { recursive: true });
      writeFileSync(targetFiles[i], typescript);
    }
  }
};

/**
 * Get yaml files from folder
 * @param {string} path base folder path
 * @returns {string[]} array of yaml files
 */
const getYamlFiles = (path: string): string[] => {
  let files: string[] = [];

  if (existsSync(path)) {
    // get files from path
    const content = readdirSync(path);
    for (let i = 0; i < content.length; i++) {
      const file = join(path, content[i]);

      // recursive call if path is directory
      if (lstatSync(file).isDirectory()) {
        files = files.concat(getYamlFiles(file));
      }

      // use path if file is yaml
      else if (extname(file).includes('.yaml') || extname(file).includes('.yml')) {
        files.push(file);
      };
    }
  }

  return files;
}

/**
 * parse json file to typescript
 * @param {any} samples json file
 * @param {string} name main interface type name
 * @param {boolean} ts generate typescript file
 * @param {boolean} opt optional properties
 * @return {string} serialized typescript or typescript types file
 */
const generator = async (samples: string[], name: string, ts: boolean, opt: boolean): Promise<string> => {
  // target language
  const targetLanguage = jsonInputForTargetLanguage('ts');
  await targetLanguage.addSource({
    name: name,
    samples: samples,
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
