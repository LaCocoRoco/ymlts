interface File {
    house: House;
}

interface House {
    door:   string;
    number: number;
    setup:  Setup;
}

interface Setup {
    power: string;
}
