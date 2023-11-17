const express = require('express');
const session = require('express-session');
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

// Função para verificar se o usuário está autenticado
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

// Rota de autenticação
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Autenticação bem-sucedida, faça o que for necessário aqui

        // Armazenar o e-mail do usuário na sessão
        req.session.user = {
            uid: user.uid,
            email: user.email,
            // Outras informações do usuário conforme necessário
        };

        // Armazenar o e-mail do usuário em um cookie
        res.cookie('user_email', user.email, { maxAge: 900000, httpOnly: true });

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.send('Erro ao fazer login');
    }
});

// Rota protegida que requer autenticação
app.get('/', checkAuth, (req, res) => {
    const user = req.session.user;

    res.send(`
        <h1>Dashboard</h1>
        <p>Bem-vindo, ${user.email}!</p>
        <a href="/logout">Logout</a>
    `);
});

// Rota de logout
app.get('/logout', (req, res) => {
    // Limpar a sessão e o cookie, e redirecionar para a página de login
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.clearCookie('user_email');
        res.redirect('/login');
    });
});

// Exemplo de rota protegida que usa checkAuth
app.get('/carrinho', checkAuth, (req, res) => {
    // Manipular o carrinho de compras usando a sessão
    const carrinho = req.session.carrinho || [];
    res.send(`
        <h1>Carrinho de Compras</h1>
        <p>Itens no carrinho: ${carrinho.length}</p>
    `);
});

// Porta em que o servidor será executado
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
