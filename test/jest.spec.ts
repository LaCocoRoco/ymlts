import { join } from 'path';
import { getFiles, getYamlFiles, Files, getFilesTypes } from '../src/ymlts';

describe('test yaml generator', () => {
  const cwd = process.cwd();
  const template = join(cwd, 'template');
  const source = join(template, 'source');
  const target = join(template, 'target');

  test('test data equals template file struct', () => {
    const files = getYamlFiles(source);

    const expected = [
      join(source, 'file.yaml'),
      join(source, 'subfolder/file.yaml'),
    ];

    expect(files).toEqual(expected);
  });

  test('test data equals one to one template file struct', () => {
    const files = getFiles(source, target, cwd, false, false);

    const expected: Files[] = [
      {
        source: [join(source, 'file.yaml')],
        target: join(target, 'file.d.ts'),
      }, {
        source: [join(source, 'subfolder/file.yaml')],
        target: join(target, 'subfolder/file.d.ts'),
      },
    ];

    expect(files).toEqual(expected);
  });

  test('test data equals merged template file struct', () => {
    const files = getFiles(source, target, cwd, false, true);

    const expected: Files[] = [
      {
        source: [
          join(source, 'file.yaml'),
          join(source, 'subfolder/file.yaml'),
        ],
        target: join(template, 'target.d.ts'),
      },
    ];

    expect(files).toEqual(expected);
  });

  test('test data equals one to one template typescript types', async () => {
    const files: Files = {
      source: [join(source, 'file.yaml')],
      target: join(target, 'file.d.ts'),
    };

    const types = await getFilesTypes(files, false, true);

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
    `;

    expect(types.replace(/\s|\n/g, ''))
        .toEqual(expected.replace(/\s|\n/g, ''));
  });

  test('test data equals merged template typescript types', async () => {
    const files: Files = {
      source: [
        join(source, 'file.yaml'),
        join(source, 'subfolder/file.yaml'),
      ],
      target: join(target, 'file.d.ts'),
    };

    const types = await getFilesTypes(files, false, true);

    const expected = `
      interface File {
          description?: Description;
          book?: Book;
          house?: House;
      }
      
      interface Book {
          title: string;
          name: string;
      }
      
      interface Description {
          header: string;
          text: string;
      }
      
      interface House {
          door: string;
          number: number;
          setup: Setup;
      }
      
      interface Setup {
          power: string;
      }  
    `;

    expect(types.replace(/\s|\n/g, ''))
        .toEqual(expected.replace(/\s|\n/g, ''));
  });
});
