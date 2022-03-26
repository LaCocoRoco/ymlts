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
