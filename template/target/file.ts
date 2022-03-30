export interface File {
    description?: Description;
    book?:        Book;
    house?:       House;
}

export interface Book {
    title: string;
    name:  string;
}

export interface Description {
    header: string;
    text:   string;
}

export interface House {
    door:   string;
    number: number;
    setup:  Setup;
}

export interface Setup {
    power: string;
}
