#!/usr/bin/env node

import yargs from 'yargs';
import { getFiles, getFilesTypes, writeFileToTarget } from './ymlts';

/**
 * yaml to types command line interface
 */
const cli = async () => {
  const argv = await yargs(process.argv.slice(2)).boolean(['t', 'h', 'o', 's', 'm']).argv;
  const argv0 = argv._[0] as string;
  const argv1 = argv._[1] as string;
  const source = argv0 ? argv0.replace(/\.yaml|\.yml/g, '') : '';
  const target = argv1 ? argv1.replace(/\.d\.ts|\.ts/g, '') : source;
  const typescript = argv.t as boolean;
  const help = argv.h as boolean;
  const silent = argv.s as boolean;
  const optional = argv.o as boolean;
  const merge = argv.m as boolean;
  const cwd = process.cwd();

  if (!help) {
    // get source and target files
    const files = getFiles(source, target, cwd, typescript, merge);

    if (files) {
      // build files
      for (const file of files) {
        // get types from source
        const types = await getFilesTypes(file, optional, silent);

        // write files to target
        writeFileToTarget(file.target, types, silent);
      }
    }

    else {
      // print files not found error
      console.log('error: no files found');
    }
  }

  else {
    // print help message
    console.log(`  usage : ymlts source [target] [flags]
    
      source: source file or folder to .yaml or .yml
      target: target file or folder to .d.ts or .ts file
      flags : -t  generate .ts instead of .d.ts
              -o  make all properties optional
              -m  merge all files into one
              -s  silent mode
              -h  show help message`,
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
