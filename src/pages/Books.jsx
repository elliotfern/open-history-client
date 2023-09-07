import { useEffect, useState, useContext } from "react";
import service from "../services/service.config";
import { Card, Button, Modal, Form, Row, Col } from "react-bootstrap";
import { AuthContext } from '../context/auth.context'
import SearchBooks from "../components/SearchBooks";

import { uploadImageService } from "../services/upload.services";


function Books() {
    const { activeUserId, userDetails } = useContext(AuthContext);

    // -creamos dos estados para mantener la lista de libros, un estado para las busquedas y otro para tener siempre la lista completa de libros
    const [books, setBooks] = useState([]); //listado original
    const [allBooks, setAllBooks] = useState([]); // busquedas

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState({});
    const [newBook, setNewBook] = useState({
        bookTitle: "",
        bookAuthor: "",
        topic: "history", // Valor predeterminado
    });

    if (typeof userDetails !== 'undefined' && userDetails !== null) {
        const userRole = userDetails.role
        console.log("user role", userDetails.role)
    }

    const fetchBooks = async () => {
        try {
            const response = await service.get("/book");
            setBooks(response.data);
            setAllBooks(response.data); // Actualiza la lista completa de libros
        } catch (error) {
            console.error("Error al obtener libros:", error);
        }
    };


    // below state will hold the image URL from cloudinary. This will come from the backend.
    const [imageUrl, setImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false); // for a loading animation effect

    // below function should be the only function invoked when the file type input changes => onChange={handleFileUpload}
    const handleFileUpload = async (event, bookId) => {
        // console.log("The file to be uploaded is: ", e.target.files[0]);

        if (!event.target.files[0]) {
            // to prevent accidentally clicking the choose file button and not selecting a file
            return;
        }

        setIsUploading(true); // to start the loading animation

        const uploadData = new FormData(); // images and other files need to be sent to the backend in a FormData
        uploadData.append("image", event.target.files[0]);
        //                   |
        //     this name needs to match the name used in the middleware => uploader.single("image")

        try {
            const response = await uploadImageService(uploadData, bookId);
            // or below line if not using services
            // const response = await axios.post(`${process.env.REACT_APP_SERVER_URL}/upload`, uploadData)

            setImageUrl(response.data.imageUrl);
            //                          |
            //     this is how the backend sends the image to the frontend => res.json({ imageUrl: req.file.path });

            setIsUploading(false); // to stop the loading animation
        } catch (error) {
            navigate("/error");
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleAddModalClose = () => {
        setShowAddModal(false);
    };

    const handleEditModalClose = () => {
        setShowEditModal(false);
    };

    const handleShowAddModal = () => {
        setShowAddModal(true);
    };

    const handleShowEditModal = (book) => {
        setSelectedBook(book);
        setShowEditModal(true);
    };

    const handleAddBook = async () => {
        try {
            await service.post("/book", newBook);
            fetchBooks();
            setShowAddModal(false);
            setNewBook({ bookTitle: "", bookAuthor: "", topic: "history" });
        } catch (error) {
            console.error("Error al agregar libro:", error);
        }
    };

    const handleEditBook = async () => {
        try {
            await service.put(`/book/${selectedBook._id}`, selectedBook);
            fetchBooks();
            setShowEditModal(false);
        } catch (error) {
            console.error("Error al editar libro:", error);
        }
    };

    const handleDeleteBook = async (bookId) => {
        try {
            await service.delete(`/book/${bookId}`);
            fetchBooks();
        } catch (error) {
            console.error("Error al borrar libro:", error);
        }
    };

    return (
        <div>
            <h2>The books of the Open History community</h2>

            <SearchBooks books={books} setBooks={setBooks} allBooks={allBooks} />


            {activeUserId && (
                <Button variant="primary" onClick={handleShowAddModal}>Agregar Libro</Button>
            )}

            <Modal show={showAddModal} onHide={handleAddModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Agregar Libro</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="bookTitle">
                            <Form.Label>Título</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Título del libro"
                                value={newBook.bookTitle}
                                onChange={(e) =>
                                    setNewBook({ ...newBook, bookTitle: e.target.value })
                                }
                            />
                        </Form.Group>
                        <Form.Group controlId="bookAuthor">
                            <Form.Label>Autor</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Autor del libro"
                                value={newBook.bookAuthor}
                                onChange={(e) =>
                                    setNewBook({ ...newBook, bookAuthor: e.target.value })
                                }
                            />
                        </Form.Group>
                        <Form.Group controlId="topic">
                            <Form.Label>Tema</Form.Label>
                            <Form.Control
                                as="select"
                                value={newBook.topic}
                                onChange={(e) =>
                                    setNewBook({ ...newBook, topic: e.target.value })
                                }
                            >
                                <option value="history">Historia</option>
                                <option value="geography">Geografía</option>
                                <option value="biography">Biografía</option>
                                <option value="fiction">Ficción</option>
                            </Form.Control>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleAddModalClose}>
                        Cerrar
                    </Button>
                    <Button variant="primary" onClick={handleAddBook}>
                        Agregar
                    </Button>
                </Modal.Footer>
            </Modal>

            <Row xs={1} md={2} lg={4}> {/* Define el número de columnas por fila */}
                {books.map((book) => (
                    <Col key={book._id}>

                        <Card style={{ marginBottom: "20px" }}>
                            {/* Agrega la imagen de la portada del libro */}
                            <Card.Img className="bookPhoto"
                                variant="top"
                                src={book.imageBook || "https://media.elliotfern.com/img/book_default.png"}
                                alt={`Portada de ${book.bookTitle}`}
                            />
                            <Card.Body>
                                <Card.Title>{book.bookTitle}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">
                                    {book.bookAuthor}
                                </Card.Subtitle>

                                <Card.Subtitle className="mb-2 text-muted">
                                    Libro propuesto por usuario: {book.userCreatorId.fullName ? book.userCreatorId.fullName : book.userCreatorId.username}

                                </Card.Subtitle>

                                <Card.Text>Tema: {book.topic}</Card.Text>
                                {/* Verifica que userRole existe antes de evaluar la condición */}
                                {(typeof userDetails !== 'undefined' && userDetails !== null) && (

                                    (book.userCreatorId._id === activeUserId || userDetails.role === "admin") && (
                                        <>
                                            <Button
                                                variant="primary"
                                                onClick={() => handleShowEditModal(book)}
                                            >
                                                Editar
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => handleDeleteBook(book._id)}
                                            >
                                                Borrar
                                            </Button>
                                        </>
                                    )

                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal show={showEditModal} onHide={handleEditModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Libro</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="bookTitle">
                            <Form.Label>Título</Form.Label>
                            <Form.Control
                                type="text"
                                value={selectedBook.bookTitle}
                                onChange={(e) =>
                                    setSelectedBook({
                                        ...selectedBook,
                                        bookTitle: e.target.value,
                                    })
                                }
                            />
                        </Form.Group>
                        <Form.Group controlId="bookAuthor">
                            <Form.Label>Autor</Form.Label>
                            <Form.Control
                                type="text"
                                value={selectedBook.bookAuthor}
                                onChange={(e) =>
                                    setSelectedBook({
                                        ...selectedBook,
                                        bookAuthor: e.target.value,
                                    })
                                }
                            />
                        </Form.Group>
                        <Form.Group controlId="topic">
                            <Form.Label>Tema</Form.Label>
                            <Form.Control
                                as="select"
                                value={selectedBook.topic}
                                onChange={(e) =>
                                    setSelectedBook({
                                        ...selectedBook,
                                        topic: e.target.value,
                                    })
                                }
                            >
                                <option value="history">Historia</option>
                                <option value="geography">Geografía</option>
                                <option value="biography">Biografía</option>
                                <option value="fiction">Ficción</option>
                            </Form.Control>
                        </Form.Group>

                        <div>
                            <label>Image: </label>
                            <input
                                type="file"
                                name="image"
                                onChange={(e) =>
                                    handleFileUpload({
                                        ...selectedBook,
                                        _id: selectedBook._id,
                                    })
                                }
                                disabled={isUploading}
                            />
                            {/* below disabled prevents the user from attempting another upload while one is already happening */}
                        </div>;

                        {/* to render a loading message or spinner while uploading the picture */}
                        {isUploading ? <h3>... uploading image</h3> : null}

                        {/* below line will render a preview of the image from cloudinary */}
                        {imageUrl ? (<div><img src={imageUrl} alt="img" width={200} /></div>) : null}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleEditModalClose}>
                        Cerrar
                    </Button>
                    <Button variant="primary" onClick={handleEditBook}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Books;