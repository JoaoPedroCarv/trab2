const express = require('express');
const session = require('express-session');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { auth, db } = require('./firebaseConnection');
const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { doc, getDoc, setDoc } = require('firebase/firestore');
const { toast } = require('react-toastify');

const app = express();

app.use(cookieParser());
app.use(
    session({
        secret: 'minhachave',
        resave: false,
        saveUninitialized: true,
    })
);

app.use(bodyParser.urlencoded({ extended: true }));

function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Rota de login
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }

                form {
                    width: 300px;
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                label {
                    display: block;
                    margin-bottom: 8px;
                }

                input {
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 16px;
                    box-sizing: border-box;
                }

                button {
                    background-color: #4caf50;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                button:hover {
                    background-color: #45a049;
                }
            </style>
        </head>
        <body>
            <form method="post" action="/login">
                <h1>Login</h1>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>

                <label for="senha">Senha:</label>
                <input type="password" id="senha" name="senha" required>

                <button type="submit">Login</button>
            </form>
        </body>
        </html>
    `);
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        req.session.user = {
            uid: user.uid,
            email: user.email,
        };

        res.cookie('user_email', user.email, { maxAge: 900000, httpOnly: true });

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.send('Erro ao fazer login');
    }
});

app.get('/', checkAuth, async (req, res) => {
    let pesquisaPais = req.query.pesquisaPais || '';

    let paises = [];
    if (pesquisaPais) {
        try {
            const response = await axios.get(`https://restcountries.com/v3.1/name/${pesquisaPais}`);
            paises = response.data;
        } catch (error) {
            console.error('Erro ao buscar países na API:', error.message);
        }
    }

    // Template de resposta HTML
    const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Lista de Países</title>
        </head>
        <body>
            <h1>Lista de Países</h1>
            <form action="/" method="GET">
                <label for="pesquisaPais">Pesquisar Países:</label>
                <input type="text" id="pesquisaPais" name="pesquisaPais" value="${pesquisaPais}">
                <button type="submit">Pesquisar</button>
            </form>
            <ul>
                ${paises.map(pais => `<li>${pais.name.common} - ${pais.population} <a href="/adicionar/${pais.cca2}">Adicionar ao carrinho</a></li>`).join('')}
            </ul>
            <a href="/carrinho">Ver Carrinho</a>
            <br>
            <a href="/perfil">Voltar para perfil</a>
        </body>
        </html>
    `;

    res.send(htmlResponse);
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.clearCookie('user_email');
        res.redirect('/login');
    });
});

app.get('/carrinho', checkAuth, (req, res) => {
    const carrinho = req.session.carrinho || [];
    res.send(`
    < h1 > Carrinho de Compras</h1 >
        <p>Itens no carrinho: ${carrinho.length}</p>
`);
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} `);
});
