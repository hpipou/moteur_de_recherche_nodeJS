const webSiteList = require("./listeWebSite")
const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql');
require('dotenv').config();

// Configuration de la connexion à la base de données
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
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
scrapeWebsites();
