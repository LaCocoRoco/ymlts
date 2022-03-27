# YAML to Typescript Generator
<a href="https://www.npmjs.com/package/ymlts">
  <img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/lacocoroco/ymlts?style=for-the-badge">
</a>
<a href="https://github.com/LaCocoRoco/ymlts/blob/master/LICENSE">
  <img alt="GitHub" src="https://img.shields.io/github/license/lacocoroco/ymlts.svg?style=for-the-badge" />
</a>
<a href="https://github.com/LaCocoRoco/ymlts">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/lacocoroco/ymlts?style=for-the-badge">
</a>

Command Line Interface to generate Typescript from YAML File.
Combines and simplifies the popular [quicktype](https://github.com/quicktype/quicktype) and [js-yaml](https://github.com/nodeca/js-yaml) package.

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

  source: source file path to .yaml or .yml
  target: target file path to .d.ts or .ts file
  flags : -t  generate .ts instead of .d.ts
          -o  make all properties optional
          -s  silent mode
          -h  show help message
```

# Example - Command Line Interface
```
  cwd:    /root/repo/src
```
```
  ymlts file

  source: /root/repo/src/file.yaml
  target: /root/repo/src/file.d.ts
```
```
  ymlts /usr/file -t

  source: /usr/file.yaml
  target: /usr/file.ts
```
```
  ymlts fileYAML fileTS

  source: /root/repo/src/fileYAML.yaml
  target: /root/repo/src/fileTS.d.ts
```
```
  ymlts template/fileYAML /usr/fileTS.d.ts -t

  source: /root/repo/src/template/fileYAML.yaml
  target: /usr/fileTS.ts
```

# Example - Input & Output
```yaml
// input.yaml

description:
  title: Average Temperature
  units: Degrees Fahrenheit
  basePeriod: 1901-2000
data:
  temp:
    value: 50.34
    anomaly: -1.68
```
```typescript
// output.ts

export interface Source {
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
    basePeriod: string;
}

```
```typescript
// output.d.ts

interface Source {
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
    basePeriod: string;
}
```

# Issues
Quicktype merges matching types.
```yaml
//input.yaml

description:
  title: Description Title
  name: Descritpion Name
book:
  title: Book Title
  name: Book Name
```
```typescript
// output.d.ts

interface Source {
    description: Book;
    book:        Book;
}

interface Book {
    title: string;
    name:  string;
}
```