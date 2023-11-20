const express = require('express');
const session = require('express-session');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { auth } = require('./firebaseConnection');
const { signInWithEmailAndPassword } = require('firebase/auth');

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

app.use((req, res, next) => {
    if (!req.session.visitados) {
        req.session.visitados = [];
    }
    next();
});

function checkAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

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
    const userEmail = req.cookies.user_email;

    if (pesquisaPais) {
        try {
            const response = await axios.get(`https://restcountries.com/v3.1/name/${pesquisaPais}`);
            paises = response.data;
        } catch (error) {
            console.error('Fudeo:', error.message);
        }
    }

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lista de Países</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            h1 {
                color: #333;
            }
            form {
                margin-bottom: 20px;
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
            ul {
                list-style: none;
                padding: 0;
            }
            li {
                margin-bottom: 10px;
            }
            a {
                text-decoration: none;
                color: #007bff;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div>
            <h1>Buscar Países</h1>
            <h5>Bem Vindo(a) ${userEmail}!</h5>
            <form action="/" method="GET">
                <label for="pesquisaPais">Pesquisar Países:</label>
                <input type="text" id="pesquisaPais" name="pesquisaPais" value="${pesquisaPais}">
                <button type="submit">Pesquisar</button>
            </form>
            <ul>
                ${paises.map(
        (pais) =>
            `<li>${pais.name.common} <a href="/adicionar/${pais.cca2}">Adicionar a visitados</a></li>`
    ).join('')}
            </ul>
            <a href="/visitados">Ver Visitados</a>
        </div>
    </body>
    </html>
`);
});

app.get('/adicionar/:id', async (req, res) => {
    const paisId = req.params.id;

    if (!req.session.visitados.includes(paisId)) {
        try {
            const response = await axios.get(`https://restcountries.com/v3.1/alpha/${paisId}`);
            const paisDetalhes = response.data;

            req.session.visitados.push({
                id: paisId,
                detalhes: paisDetalhes,
            });

            console.log('Sessão visitados:', req.session.visitados);

            res.redirect('/');
        } catch (error) {
            console.error('Fudeo:', error.message);
            res.send('Deu erro :(');
        }
    } else {
        res.redirect('/');
    }
});

app.get('/visitados', checkAuth, async (req, res) => {
    const visitados = req.session.visitados || [];

    if (visitados.length === 0) {
        res.send(`Nenhum país visitado ainda.`);
    }
    else {

        try {
            const detalhesVisitados = await Promise.all(
                visitados.map(async (visitado) => {
                    try {
                        if (
                            visitado &&
                            visitado.detalhes &&
                            visitado.detalhes.length > 0 &&
                            visitado.detalhes[0].name &&
                            visitado.detalhes[0].flags &&
                            visitado.detalhes[0].flags.svg
                        ) {
                            const nomeComum = visitado.detalhes[0].name.common || '';

                            return {
                                nomeComum,
                                bandeira: visitado.detalhes[0].flags.svg,
                            };
                        } else {
                            return null;
                        }
                    } catch (error) {
                        console.error('Fudeo:', error.message);
                        return null;
                    }
                })
            );

            const paisesValidos = detalhesVisitados.filter((pais) => pais !== null);

            const htmlResponse = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Países Visitados</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }
                    h1 {
                        color: #333;
                    }
                    .pais-list-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        height: 80vh; 
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                        margin: 0; 
                    }
                    li {
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                    }
                    img {
                        width: 30px; 
                        height: auto;
                        margin-right: 10px;
                    }
                    a {
                        text-decoration: none;
                        color: #007bff;
                        margin-bottom: 10px;
                        display: block;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <h1>Países Visitados</h1>
                <div class="pais-list-container">
                    <ul>
                        ${paisesValidos
                    .map(
                        (pais) =>
                            `<li><img src="${pais.bandeira}" alt="Bandeira">${pais.nomeComum}</li>`
                    )
                    .join('')}
                    </ul>
                </div>
                <a href="/">Voltar</a>
            </body>
            </html>
        `;

            res.send(htmlResponse);
        } catch (error) {
            console.error('Fudeo:', error.message);
            res.send('Deu erro caboco');
        }
    }
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

app.listen(3000, () => {
    console.log(`Rodando`);
});
