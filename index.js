const webSiteList = require("./listeWebSite")
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql');
require('dotenv').config();

const app = express();
const port = 3000; // Vous pouvez modifier le port selon vos besoins

// Configuration de la connexion à la base de données
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Middleware pour prendre en charge les requêtes JSON
app.use(express.json());

// Route POST pour rechercher les titres correspondant aux lettres fournies
app.post('/search', async (req, res) => {
  const letters = req.body.letters;
  const query = `SELECT title FROM websites WHERE title LIKE '%${letters}%'`;

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la recherche:', error);
      res.status(500).json({ error: 'Une erreur s\'est produite lors de la recherche.' });
    } else {
      const titles = results.map(result => result.title);
      res.json({ titles });
    }
  });
});

// Fonction pour effectuer le web scraping d'un site web
async function scrapeWebsite(website) {
  try {
    const response = await axios.get(website);
    const $ = cheerio.load(response.data);

    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content');

    return { title, description };
  } catch (error) {
    console.error(`Erreur lors du web scraping de ${website}`);
    return null;
  }
}

// Fonction pour insérer les données scrapées dans la base de données
function insertData(websiteData) {
  if (websiteData === null) {
    return;
  }

  const { title, description } = websiteData;
  const query = 'INSERT INTO websites (title, description) VALUES (?, ?)';
  connection.query(query, [title, description], (error) => {
    if (error) {
      console.error('Une erreur s est produite dans la BDD');
    }
  });
}

// Fonction principale pour le scrapping de la liste des sites web
async function scrapeWebsites() {

  for (const website of webSiteList) {
    const websiteData = await scrapeWebsite(website);
    insertData(websiteData);
  }

  // Fermeture de la connexion à la base de données
  connection.end();
}

// Exécution de la fonction principale
//scrapeWebsites();

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Le serveur est en cours d'exécution sur le port ${port}`);
});
