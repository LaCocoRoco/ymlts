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
