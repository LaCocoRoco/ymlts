import { join } from 'path';
import { getFiles, getYamlJsonString, getYamlFiles, generator } from '../src/ymlts';

describe('yaml generator test', () => {
  const cwd = process.cwd();
  const template = join(cwd, 'template');
  const source = join(template, 'source');
  const target = join(template, 'target');

  test('source yaml file path equals template', () => {
    const files = getYamlFiles(source);

    const expected = [
      join(source, 'file.yaml'),
      join(source, 'subfolder/file.yaml'),
    ];

    expect(files).toEqual(expected);
  });

  test('source and target file path equals template', () => {
    const files = getFiles('template/source', 'template/target', cwd, false);

    const expected = {
      merge: target + '.d.ts',
      source: [
        join(source, 'file.yaml'),
        join(source, 'subfolder/file.yaml'),
      ],
      target: [
        join(target, 'file.d.ts'),
        join(target, 'subfolder/file.d.ts'),
      ],
    };

    expect(files).toEqual(expected);
  });

  test('yaml type file equals template', async () => {
    const path = join(source, 'file.yaml');
    const sample = getYamlJsonString(path);
    const types = await generator([sample], 'file', false, false);
    const actual = types.replace(/\s|\n/g, '');

    const expected = `
      interface File {
          description: Description;
          book:        Book;
      }
      
      interface Book {
          title: string;
          name:  string;
      }
      
      interface Description {
          header: string;
          text:   string;
      }
    `.replace(/\s|\n/g, '');

    expect(actual).toEqual(expected);
  });

  test('yaml typescript file equals template', async () => {
    const path = join(source, 'file.yaml');
    const sample = getYamlJsonString(path);
    const types = await generator([sample], 'file', true, false);
    const actual = types.replace(/\s|\n/g, '');

    const expected = `
      export interface File {
          description: Description;
          book:        Book;
      }
      
      export interface Book {
          title: string;
          name:  string;
      }
      
      export interface Description {
          header: string;
          text:   string;
      }
    `.replace(/\s|\n/g, '');

    expect(actual).toEqual(expected);
  });
});
