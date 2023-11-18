app.get('/', checkAuth, (req, res) => {
    const user = req.session.user;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard</title>
            <style>
                body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }

                h1, p {
                    text-align: center;
                    margin-bottom: 20px;
                }

                input[type="text"] {
                    width: 300px;
                    padding: 8px;
                    box-sizing: border-box;
                }

                #search-form {
                    margin-top: 20px;
                }

                #search-results {
                    margin-top: 20px;
                    text-align: center;
                }

                a {
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Dashboard</h1>
            <p>Bem-vindo, ${user.email}!</p>
            
            <form id="search-form" onsubmit="event.preventDefault(); searchCountries()">
                <label for="search">Pesquisar:</label>
                <input type="text" id="search" name="search" placeholder="Digite aqui...">
                <button type="submit">Pesquisar</button>
            </form>

            <div id="search-results"></div>

            <a href="/logout">Logout</a>

            <script>
                async function searchCountries() {
                    const searchTerm = document.getElementById('search').value;
                    const resultsContainer = document.getElementById('search-results');
                    
                    try {
                        const response = await fetch(\`https://restcountries.com/v3.1/name/\${searchTerm}\`);
                        const countries = await response.json();

                        resultsContainer.innerHTML = '<h2>Resultados da Pesquisa</h2>';
                        
                        if (countries.length > 0) {
                            countries.forEach(country => {
                                resultsContainer.innerHTML += \`<p>\${country.name.common}</p>\`;
                            });
                        } else {
                            resultsContainer.innerHTML += '<p>Nenhum país encontrado.</p>';
                        }
                    } catch (error) {
                        console.error(error);
                        resultsContainer.innerHTML = '<p>Fodeu</p>';
                    }
                }
            </script>
        </body>
        </html>
    `);
});