#!/usr/bin/env ts-node

import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import { load, JSON_SCHEMA } from 'js-yaml';
import { readdirSync, promises, existsSync, lstatSync, readFileSync, writeFileSync } from 'fs';
import { extname, isAbsolute, join, parse } from 'path';
import yargs from 'yargs/yargs';

interface Files {
  merge: string;
  source: string[];
  target: string[];
}

/**
 * 
 * @param {string} source 
 * @param {string} target 
 * @param {string} cwd current working directory
 * @param {boolean} ts generate .ts instead of .d.ts
 * @returns {Files} 
 */
const getFiles = (source: string, target: string, cwd: string, ts: boolean): Files | null => {
  // source files
  const sourcePath = isAbsolute(source) ? source : join(cwd, source);
  const sourceYaml = sourcePath.concat('.yaml');
  const sourceYml = sourcePath.concat('.yml');
  const sourceIsDir = existsSync(sourcePath) && lstatSync(sourcePath).isDirectory();
  const sourceIsYaml = existsSync(sourceYaml);
  const sourceIsYml = existsSync(sourceYml);
  const sourceFile = sourceIsYaml ? sourceYaml : sourceIsYml ? sourceYml : '';
  const sourceFiles = sourceIsDir ? getYamlFilesFromFolder(sourcePath) : [sourceFile];

  // no files found
  if (!source || !sourceFiles.length) return null;

  // target files
  const targetPath = isAbsolute(target) ? target : join(cwd, target);
  const targetFiles = sourceFiles.map(file => {
    let refactor = file.replace(sourcePath, targetPath);
    return refactor.replace(/\.yml|\.yaml/g, ts ? '.ts' : '.d.ts');
  });

  // target file for merge
  const mergeFile = targetPath.concat(ts ? '.ts' : '.d.ts');

  return {
    merge: mergeFile,
    source: sourceFiles,
    target: targetFiles
  };
}

/**
 * get yaml files from folder
 * @param {string} path folder path
 * @returns {string[]} path array of yaml files
 */
const getYamlFilesFromFolder = (path: string): string[] => {
  let files: string[] = [];

  if (existsSync(path)) {
    // get files from path
    const content = readdirSync(path);
    for (let i = 0; i < content.length; i++) {
      const file = join(path, content[i]);

      // recursive call if path is directory
      if (lstatSync(file).isDirectory()) {
        files = files.concat(getYamlFilesFromFolder(file));
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
 * parse json file to types
 * @param {string[]} samples json sample files
 * @param {string} name main interface type name
 * @param {boolean} opt make all properties optional
 * @return {string} serialized types string
 */
const generator = async (samples: string[], name: string, opt: boolean): Promise<string> => {
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

  // return types as string
  return lines.join('\n');
};

/**
 * build type files
 * @param {Files} files files path collection
 * @param {boolean} ts generate .ts instead of .d.ts
 * @param {boolean} opt make all properties optional
 * @param {boolean} silent disable status message
 */
const buildTypeFiles = async (files: Files, ts: boolean, opt: boolean, silent: boolean) => {
  for (let i = 0; i < files.source.length; i++) {
    // yaml to json samples
    const yaml = readFileSync(files.source[i], 'utf8');
    const json = load(yaml, { schema: JSON_SCHEMA, json: true });
    const samples = [JSON.stringify(json)];

    // print status
    if (!silent) console.log('source:\t', files.source[i]);
    if (!silent) console.log('target:\t', files.target[i]);

    // json to types
    const name = parse(files.target[i].replace(/\.d\.ts|\.ts/g, '')).name;
    const types = await generator(samples, name, opt);

    // write file
    const dir = parse(files.target[i]).dir;
    await promises.mkdir(dir, { recursive: true });
    writeFileSync(files.target[i], ts ? types : types.replace(/export /g, ''));
  }
}

/**
 * build type files and merge into one
 * @param {Files} files files path collection
 * @param {boolean} ts generate .ts instead of .d.ts
 * @param {boolean} opt make all properties optional
 * @param {boolean} silent disable status message
 */
const buildTypeFilesAndMerge = async (files: Files, ts: boolean, opt: boolean, silent: boolean) => {
  // merge types into one file
  let samples: string[] = [];

  for (let i = 0; i < files.source.length; i++) {
    // print status
    if (!silent) console.log('source:\t', files.source[i]);

    // yaml to json samples
    const yaml = readFileSync(files.source[i], 'utf8');
    const json = load(yaml, { schema: JSON_SCHEMA, json: true });
    samples.push(JSON.stringify(json));
  }

  // print status
  if (!silent) console.log('target:\t', files.merge);

  // json to typescript
  const name = parse(files.merge.replace(/\.d\.ts|\.ts/g, '')).name;
  const types = await generator(samples, name, opt);

  // write file
  const dir = parse(files.merge).dir;
  await promises.mkdir(dir, { recursive: true });
  //writeFileSync(files.merge, typescript);
  writeFileSync(files.merge, ts ? types : types.replace(/export /g, ''));
}

/**
 * yaml to typescript cli
 */
const cli = async () => {
  const argv = await yargs(process.argv.slice(2)).boolean(['t', 'h', 'o', 's', 'm']).argv;
  const argv0 = argv._[0] as string;
  const argv1 = argv._[1] as string;
  const source = argv0 ? argv0.replace(/\.yaml|\.yml/g, '') : '';
  const target = argv1 ? argv1.replace(/\.d\.ts|\.ts/g, '') : source;
  const ts = argv.t as boolean;
  const help = argv.h as boolean;
  const silent = argv.s as boolean;
  const opt = argv.o as boolean;
  const merge = argv.m as boolean;
  const cwd = process.cwd();

  if (!help) {
    // get files to generate types
    const files = getFiles(source, target, cwd, ts);

    if (files) {
      if (!merge) {
        // build type files
        await buildTypeFiles(files, ts, opt, silent)
      } else {
        // build type files and merge
        await buildTypeFilesAndMerge(files, ts, opt, silent);
      }
    } else {
      // print files not found error
      console.log("error: no files found");
    }
  } else {
    // print help message
    console.log(`  usage : ymlts source [target] [flags]
    
      source: source file or folder to .yaml or .yml
      target: target file or folder to .d.ts or .ts file
      flags : -t  generate .ts instead of .d.ts
              -o  make all properties optional
              -m  merge all files into one
              -s  silent mode
              -h  show help message`
    );
  }
};

/**
 * process error handler
 * @param {Error} error process error
 */
const error = (error: Error) => {
  console.log('error: ', error.message);
};

/**
 * main process
 */
const main = async () => {
  await cli();
};

// execute process
main().catch(error);
