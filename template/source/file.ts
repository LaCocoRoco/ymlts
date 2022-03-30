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
