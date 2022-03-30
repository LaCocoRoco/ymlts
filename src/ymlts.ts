import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import { load, JSON_SCHEMA } from 'js-yaml';
import { readdirSync, promises, existsSync, lstatSync, readFileSync, writeFileSync } from 'fs';
import { extname, isAbsolute, join, parse } from 'path';

// source and target files
export interface Files {
  merge: string;
  source: string[];
  target: string[];
}

/**
 * get yaml json string
 * @param {string} path path to yaml file
 * @return {string} yaml json string
 */
export const getYamlJsonString = (path: string): string => {
  const yaml = readFileSync(path, 'utf8');
  const json = load(yaml, { schema: JSON_SCHEMA, json: true });
  return JSON.stringify(json);
};

/**
 * get yaml files from folder
 * @param {string} path folder path
 * @return {string[]} yaml file path array
 */
export const getYamlFiles = (path: string): string[] => {
  // file path array
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
};

/**
 * get source and target files
 * @param {string} source path to source
 * @param {string} target path to target
 * @param {string} cwd current working directory
 * @param {boolean} typescript generate .ts instead of .d.ts
 * @return {Files} source and target files
 */
export const getFiles = (
    source: string,
    target: string,
    cwd: string,
    typescript: boolean,
): Files | null => {
  // source files
  const sourcePath = isAbsolute(source) ? source : join(cwd, source);
  const sourceYaml = sourcePath.concat('.yaml');
  const sourceYml = sourcePath.concat('.yml');
  const sourceIsDir = existsSync(sourcePath) && lstatSync(sourcePath).isDirectory();
  const sourceIsYaml = existsSync(sourceYaml);
  const sourceIsYml = existsSync(sourceYml);
  const sourceFile = sourceIsYaml ? sourceYaml : sourceIsYml ? sourceYml : '';
  const sourceFiles = sourceIsDir ? getYamlFiles(sourcePath) : [sourceFile];

  // no files found
  if (!source || !sourceFiles.length) return null;

  // target files
  const targetPath = isAbsolute(target) ? target : join(cwd, target);
  const targetFiles = sourceFiles.map((file) => {
    const refactor = file.replace(sourcePath, targetPath);
    return refactor.replace(/\.yml|\.yaml/g, typescript ? '.ts' : '.d.ts');
  });

  // target file for merge
  const mergeFile = targetPath.concat(typescript ? '.ts' : '.d.ts');

  return {
    merge: mergeFile,
    source: sourceFiles,
    target: targetFiles,
  };
};

/**
 * types generator for json files
 * @param {string[]} samples json samples
 * @param {string} name main interface type name
 * @param {boolean} typescript generate .ts instead of .d.ts
 * @param {boolean} optional make all properties optional
 * @return {string} json types
 */
export const generator = async (
    samples: string[],
    name: string,
    typescript: boolean,
    optional: boolean,
): Promise<string> => {
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
    allPropertiesOptional: optional ? true : false,
    rendererOptions: {
      'just-types': 'true',
    },
  });

  // return types
  const types = lines.join('\n');
  return typescript ? types : types.replace(/export /g, '');
};

/**
 * build type files
 * @param {Files} files source and target files
 * @param {boolean} typescript generate .ts instead of .d.ts
 * @param {boolean} optional make all properties optional
 * @param {boolean} silent disable status message
 */
export const buildTypeFiles = async (
    files: Files,
    typescript: boolean,
    optional: boolean,
    silent: boolean,
): Promise<void> => {
  for (let i = 0; i < files.source.length; i++) {
    // get yaml sample
    const samples = [getYamlJsonString(files.source[i])];

    // print status
    if (!silent) console.log('source:\t', files.source[i]);
    if (!silent) console.log('target:\t', files.target[i]);

    // json to types
    const name = parse(files.target[i].replace(/\.d\.ts|\.ts/g, '')).name;
    const types = await generator(samples, name, typescript, optional);

    // write file
    await promises.mkdir(parse(files.merge).dir, { recursive: true });
    writeFileSync(files.target[i], types);
  }
};

/**
 * build type files and merge into one
 * @param {Files} files source and target files
 * @param {boolean} typescript generate .ts instead of .d.ts
 * @param {boolean} optional make all properties optional
 * @param {boolean} silent disable status message
 */
export const buildTypeFilesAndMerge = async (
    files: Files,
    typescript: boolean,
    optional: boolean,
    silent: boolean,
): Promise<void> => {
  // merge types into one file
  const samples: string[] = [];

  for (let i = 0; i < files.source.length; i++) {
    // get yaml sample
    samples.push(getYamlJsonString(files.source[i]));

    // print status
    if (!silent) console.log('source:\t', files.source[i]);
  }

  // print status
  if (!silent) console.log('target:\t', files.merge);

  // json to typescript
  const name = parse(files.merge.replace(/\.d\.ts|\.ts/g, '')).name;
  const types = await generator(samples, name, typescript, optional);

  // write file
  await promises.mkdir(parse(files.merge).dir, { recursive: true });
  writeFileSync(files.merge, types);
};
