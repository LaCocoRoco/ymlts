export interface File {
    house: House;
}

export interface House {
    door:   string;
    number: number;
    setup:  Setup;
}

export interface Setup {
    power: string;
}
