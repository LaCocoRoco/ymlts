# YAML to Typescript Generator
<a href="https://www.npmjs.com/package/ymlts">
  <img alt="npm" src="https://img.shields.io/npm/v/ymlts?style=for-the-badge">
</a>
<a href="https://github.com/LaCocoRoco/ymlts/blob/master/LICENSE">
  <img alt="GitHub" src="https://img.shields.io/github/license/lacocoroco/ymlts.svg?style=for-the-badge" />
</a>
<a href="https://github.com/LaCocoRoco/ymlts">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/lacocoroco/ymlts?style=for-the-badge">
</a>

Command Line Interface to generate Typescript from YAML File.
Combines and simplifies [quicktype](https://github.com/quicktype/quicktype) and [js-yaml](https://github.com/nodeca/js-yaml) package.

# General
Typing file extension for source and target files are optional.

# Install & Usage Local 
```
Install:  npm i -D ymlts

Usage  :  npx ymlts source [target] [flags]
```

# Install & Usage Global
```
Install:  npm i -g ymlts

Usage  :  ymlts source [target] [flags]
```

# Help 
```
  usage : ymlts source [target] [flags]

  source: source file or folder to .yaml or .yml
  target: target file or folder to .d.ts or .ts file
  flags : -t  generate .ts instead of .d.ts
          -o  make all properties optional
          -m  merge all files into one
          -s  silent mode
          -h  show help message
```

# CLI - Example File
```
  Example Environment
  cwd:    /source
  files:  /file.yaml
```
```
  usage:  ymlts file

  source: /source/file.yaml
  target: /source/file.d.ts
```
```
  usage:  ymlts /usr/file -t

  source: /usr/file.yaml
  target: /usr/file.ts
```
```
  usage:  ymlts file target

  source: /source/file.yaml
  target: /source/target.d.ts
```
```
  usage:  ymlts resource/file /usr/target

  source: /source/resource/file.yaml
  target: /usr/target.d.ts
```

# CLI - Example Folder
```
  Example Environment
  cwd:    /source
  files:  /file.yaml
          /subfolder/file.yaml
```
```
  usage:  ymlts source

  source: /source/file.yaml
          /source/subfolder/file.yaml         
  target: /source/file.d.ts
          /source/subfolder/file.d.ts
```
```
  usage:  ymlts /usr

  source: /usr/file.yaml
          /usr/subfolder/file.yaml         
  target: /usr/file.d.ts
          /usr/subfolder/file.d.ts
```
```
  usage:  ymlts source target -t

  source: /source/file.yaml
          /source/subfolder/file.yaml         
  target: /target/file.ts
          /target/subfolder/file.ts
```
```
  usage:  ymlts source target/file -m

  source: /source/file.yaml
          /source/subfolder/file.yaml         
  target: /target/file.d.ts
```
# Example - Input & Output
```yaml
// source.yaml

description:
  title: Average Temperature
  units: Degrees Fahrenheit
data:
  temp:
    value: 50.00
    anomaly: 1.00
```
```typescript
// target.ts

export interface Target {
    description: Description;
    data:        Data;
}

export interface Data {
    temp: Temp;
}

export interface Temp {
    value:   number;
    anomaly: number;
}

export interface Description {
    title:      string;
    units:      string;
}

```
```typescript
// target.d.ts

interface Target {
    description: Description;
    data:        Data;
}

interface Data {
    temp: Temp;
}

interface Temp {
    value:   number;
    anomaly: number;
}

interface Description {
    title:      string;
    units:      string;
}
```

# Issues
Quicktype merges matching types.
```yaml
// source.yaml

description:
  title: Description Title
  name: Descritpion Name
book:
  title: Book Title
  name: Book Name
```
```typescript
// target.d.ts

interface Source {
    description: Book;
    book:        Book;
}

interface Book {
    title: string;
    name:  string;
}
```