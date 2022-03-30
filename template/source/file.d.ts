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
