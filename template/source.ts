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
