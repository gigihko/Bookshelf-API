// Import dependencies
const Hapi = require('@hapi/hapi');
const { nanoid } = require('nanoid');

// In-memory database
const books = [];

// Initialize Hapi server
const init = async () => {
    const server = Hapi.server({
        port: 9000,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    // Add a new book
    server.route({
        method: 'POST',
        path: '/books',
        handler: (request, h) => {
            const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;

            if (!name) {
                return h.response({ status: 'fail', message: 'Gagal menambahkan buku. Mohon isi nama buku' }).code(400);
            }
            if (readPage > pageCount) {
                return h.response({ status: 'fail', message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount' }).code(400);
            }

            const id = nanoid(16);
            const insertedAt = new Date().toISOString();
            const updatedAt = insertedAt;
            const finished = pageCount === readPage;

            const newBook = { id, name, year, author, summary, publisher, pageCount, readPage, finished, reading: Boolean(reading), insertedAt, updatedAt };
            books.push(newBook);

            return h.response({ status: 'success', message: 'Buku berhasil ditambahkan', data: { bookId: id } }).code(201).type('application/json');
        },
    });

    // Get all books
    server.route({
        method: 'GET',
        path: '/books',
        handler: (request, h) => {
            const { name, reading, finished } = request.query;
            let filteredBooks = books;

            if (name) {
                filteredBooks = filteredBooks.filter(book => book.name.toLowerCase().includes(name.toLowerCase()));
            }
            if (reading !== undefined) {
                filteredBooks = filteredBooks.filter(book => book.reading === (reading === '1'));
            }
            if (finished !== undefined) {
                filteredBooks = filteredBooks.filter(book => book.finished === (finished === '1'));
            }

            const bookList = filteredBooks.map(({ id, name, publisher }) => ({ id, name, publisher }));
            return h.response({ status: 'success', data: { books: bookList } }).type('application/json');
        },
    });

    // Get book by ID
    server.route({
        method: 'GET',
        path: '/books/{bookId}',
        handler: (request, h) => {
            const book = books.find(b => b.id === request.params.bookId);
            if (!book) {
                return h.response({ status: 'fail', message: 'Buku tidak ditemukan' }).code(404).type('application/json');
            }
            return h.response({ status: 'success', data: { book } }).type('application/json');
        },
    });

    // Update book
    server.route({
        method: 'PUT',
        path: '/books/{bookId}',
        handler: (request, h) => {
            const { name, year, author, summary, publisher, pageCount, readPage, reading } = request.payload;
            const bookIndex = books.findIndex(b => b.id === request.params.bookId);
            
            if (bookIndex === -1) {
                return h.response({ status: 'fail', message: 'Gagal memperbarui buku. Id tidak ditemukan' }).code(404).type('application/json');
            }
            if (!name) {
                return h.response({ status: 'fail', message: 'Gagal memperbarui buku. Mohon isi nama buku' }).code(400).type('application/json');
            }
            if (readPage > pageCount) {
                return h.response({ status: 'fail', message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount' }).code(400).type('application/json');
            }

            books[bookIndex] = { ...books[bookIndex], name, year, author, summary, publisher, pageCount, readPage, reading: Boolean(reading), finished: pageCount === readPage, updatedAt: new Date().toISOString() };
            return h.response({ status: 'success', message: 'Buku berhasil diperbarui' }).type('application/json');
        },
    });

    // Delete book
    server.route({
        method: 'DELETE',
        path: '/books/{bookId}',
        handler: (request, h) => {
            const bookIndex = books.findIndex(b => b.id === request.params.bookId);
            if (bookIndex === -1) {
                return h.response({ status: 'fail', message: 'Buku gagal dihapus. Id tidak ditemukan' }).code(404).type('application/json');
            }
            books.splice(bookIndex, 1);
            return h.response({ status: 'success', message: 'Buku berhasil dihapus' }).type('application/json');
        },
    });

    // Start server
    await server.start();
    console.log(`Server running on ${server.info.uri}`);
};

init();
