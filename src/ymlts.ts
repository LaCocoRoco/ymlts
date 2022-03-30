import { InputData, jsonInputForTargetLanguage, quicktype } from 'quicktype-core';
import { load, JSON_SCHEMA } from 'js-yaml';
import { readdirSync, promises, existsSync, lstatSync, readFileSync, writeFileSync } from 'fs';
import { extname, isAbsolute, join, parse } from 'path';

export interface Files {
  source: string[];
  target: string;
}

/**
 * get yaml json string
 * @param {string} path yaml file path
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
 * @return {string[]} yaml files from folder
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
 * @param {boolean} merge merge all source to one target
 * @return {Files} source and target files
 */
export const getFiles = (
    source: string,
    target: string,
    cwd: string,
    typescript: boolean,
    merge: boolean,
): Files[] => {
  // files collection
  const files: Files[] = [];

  // source files
  const sourcePath = isAbsolute(source) ? source : join(cwd, source);
  const sourceYaml = sourcePath.concat('.yaml');
  const sourceYml = sourcePath.concat('.yml');
  const sourceIsDir = existsSync(sourcePath) && lstatSync(sourcePath).isDirectory();
  const sourceIsYaml = existsSync(sourceYaml);
  const sourceIsYml = existsSync(sourceYml);
  const sourceFile = sourceIsYaml ? sourceYaml : sourceIsYml ? sourceYml : '';
  const sourceFiles = sourceIsDir ? getYamlFiles(sourcePath) : sourceFile ? [sourceFile] : [];

  // target files
  const targetPath = isAbsolute(target) ? target : join(cwd, target);

  // source available
  if (sourceFiles.length) {
    if (merge) {
      // merge all files
      const targetFile = targetPath.concat(typescript ? '.ts' : '.d.ts');

      files.push({
        source: sourceFiles,
        target: targetFile,
      });
    }
    else {
      for (const sourceFile of sourceFiles) {
        // one to one relation
        const targetFile = sourceFile.replace(sourcePath, targetPath)
            .replace(/\.yml|\.yaml/g, typescript ? '.ts' : '.d.ts');

        files.push({
          source: [sourceFile],
          target: targetFile,
        });
      }
    }
  }

  return files;
};

/**
 * types generator for json files
 * @param {string[]} samples json samples
 * @param {string} name main interface type name
 * @param {boolean} optional make all properties optional
 * @return {string} json types
 */
export const generator = async (
    samples: string[],
    name: string,
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
  return lines.join('\n');
};

/**
 * get files types
 * @param {Files} files source and target files
 * @param {boolean} optional make all properties optional
 * @param {boolean} silent disable status message
 * @return {string} files types
 */
export const getFilesTypes = async (
    files: Files,
    optional: boolean,
    silent: boolean,
): Promise<string> => {
  // merge types into one file
  const samples: string[] = [];

  for (let i = 0; i < files.source.length; i++) {
    // get yaml sample
    const sample = getYamlJsonString(files.source[i]);

    // add sample
    samples.push(sample);

    // print status
    if (!silent) console.log('source:\t', files.source[i]);
  }

  // json to types
  const name = parse(files.target.replace(/\.d\.ts|\.ts/g, '')).name;
  const types = await generator(samples, name, optional);

  // target file is typescript
  const typescript = !files.target.includes('.d.ts');
  return typescript ? types : types.replace(/export /g, '');
};

/**
 * write type files to target path
 * @param {string} target target path
 * @param {string} types source types
 * @param {boolean} silent disable status message
 */
export const writeFileToTarget = async (target: string, types: string, silent: boolean) => {
  // print status
  if (!silent) console.log('target:\t', target);

  // write file
  await promises.mkdir(parse(target).dir, { recursive: true });
  writeFileSync(target, types);
};
