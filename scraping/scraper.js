const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const HACKATHON_URL = 'https://dorahacks.io/hackathon/hederahackafrica/buidl';
const LOGIN_URL = 'https://dorahacks.io/login';
const BUIDL_BASE_URL = 'https://dorahacks.io/buidl/';
const COOKIES_PATH = path.join(__dirname, 'cookies.json');
const DATA_DIR = path.join(__dirname, 'data');
const MY_BUIDL_ID = '33512'; // Build à exclure (le vôtre)

// Fonction de délai compatible avec toutes les versions de Puppeteer
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Créer le dossier data s'il n'existe pas
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Erreur lors de la création du dossier data:', error);
  }
}

// Sauvegarder les cookies pour réutilisation
async function saveCookies(page) {
  const cookies = await page.cookies();
  await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log('✓ Cookies sauvegardés');
}

// Charger les cookies existants
async function loadCookies(page) {
  try {
    const cookiesString = await fs.readFile(COOKIES_PATH, 'utf-8');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    console.log('✓ Cookies chargés');
    return true;
  } catch (error) {
    console.log('⚠ Aucun cookie trouvé, connexion requise');
    return false;
  }
}

// Attendre la connexion manuelle avec code email
async function waitForManualLogin(page) {
  console.log('\n🔐 PROCESSUS DE CONNEXION:');
  console.log('   1. Entrez votre email dans le champ');
  console.log('   2. Cliquez sur "Get Code"');
  console.log('   3. Consultez votre email pour récupérer le code');
  console.log('   4. Entrez le code reçu');
  console.log('   5. Validez la connexion\n');
  console.log('⏳ En attente de la connexion...\n');

  // Attendre que l'URL change (signe que la connexion a réussi)
  await page.waitForFunction(
    () => !window.location.href.includes('/login'),
    { timeout: 600000 } // 10 minutes max (le temps de recevoir et entrer le code)
  );

  console.log('✓ Connexion détectée!');

  // Petite pause pour s'assurer que la session est établie
  await sleep(2000);

  await saveCookies(page);
}

// Connexion semi-automatique avec code email
async function autoLoginWithCode(page, email) {
  console.log('🔐 Connexion semi-automatique avec code email...');

  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 90000 }); // Increased timeout
  await sleep(3000); // Increased sleep

  try {
    // Trouver et remplir le champ email
    const emailSelector = 'input[type="email"], input[placeholder*="email" i], input[name*="email" i]';
    await page.waitForSelector(emailSelector, { timeout: 10000 });
    await page.type(emailSelector, email);
    console.log('✓ Email entré:', email);

    // Attendre un peu pour que le bouton soit activé
    await sleep(1000);

    // Trouver et cliquer sur le bouton "Get Code"
    const getCodeButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn =>
        btn.textContent.toLowerCase().includes('get') &&
        btn.textContent.toLowerCase().includes('code')
      );
    });

    if (getCodeButton) {
      await getCodeButton.click();
      console.log('✓ Bouton "Get Code" cliqué');
    } else {
      console.log('⚠ Bouton "Get Code" non trouvé, cliquez manuellement');
    }

    console.log('\n📧 Veuillez:');
    console.log('   1. Consulter votre email');
    console.log('   2. Copier le code reçu');
    console.log('   3. Entrer le code dans le champ qui apparaît');
    console.log('   4. Valider\n');

    // Attendre que la connexion soit complétée
    await page.waitForFunction(
      () => !window.location.href.includes('/login'),
      { timeout: 600000 } // 10 minutes max
    );

    console.log('✓ Connexion réussie!');
    await sleep(2000);
    await saveCookies(page);

  } catch (error) {
    console.error('⚠ Erreur lors de la connexion automatique:', error.message);
    console.log('Passage en mode manuel...');
    await waitForManualLogin(page);
  }
}

// Récupérer les IDs des builds dans la catégorie "DLT for Operations"
async function getBuildIds(page) {
  console.log('\n📋 Récupération des builds "DLT for Operations"...');

  await page.goto(HACKATHON_URL, {
    waitUntil: 'networkidle2',
    timeout: 90000 // Increased timeout
  });

  // Attendre que les projets se chargent
  await sleep(5000); // Increased sleep

  // Chercher et cliquer sur le filtre/catégorie "DLT for Operations" s'il existe
  try {
    const categoryClicked = await page.evaluate(() => {
      // Chercher tous les éléments qui pourraient être des filtres de catégorie
      const elements = Array.from(document.querySelectorAll('button, a, div[role="button"], span'));

      for (const el of elements) {
        const text = el.innerText || el.textContent || '';
        if (text.toLowerCase().includes('dlt') && text.toLowerCase().includes('operation')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (categoryClicked) {
      console.log('✓ Filtre "DLT for Operations" activé');
      await sleep(2000); // Attendre que les résultats se rechargent
    } else {
      console.log('⚠ Filtre "DLT for Operations" non trouvé, recherche dans tous les builds...');
    }
  } catch (error) {
    console.log('⚠ Impossible d\'activer le filtre, recherche manuelle...');
  }

  // Cliquer sur "View More" / "Load More" jusqu'à charger tous les builds
  console.log('🔄 Chargement de tous les builds...');
  let clickCount = 0;
  while (clickCount < 25) { // Fixed 50 clicks as requested
    // Scroll pour que le bouton soit visible
    await autoScroll(page);
    await sleep(2000); // Increased sleep after scroll

    // Chercher et cliquer sur le bouton "View More" / "Load More"
    let clicked = false;
    try {
      // Prioritize the specific "View More" button selector
      const viewMoreSelector = 'button.dh-button[theme="ink-line"][size="sm"]';
      await page.waitForSelector(viewMoreSelector, { visible: true, timeout: 3000 });
      const buttonText = await page.evaluate(selector => document.querySelector(selector)?.innerText, viewMoreSelector);

      if (buttonText && buttonText.includes('View More')) {
        await page.click(viewMoreSelector);
        clicked = true;
      } else {
        // Fallback to a broader search if the specific button isn't found or doesn't have the right text
        // This fallback will try to find any visible button-like element with "View More" text
        const fallbackSelector = 'button:not([class*="absolute"]), a[role="button"]:not([class*="absolute"]), div[role="button"]:not([class*="absolute"])';
        const buttons = await page.$$(fallbackSelector);
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.innerText, btn);
          if (text && text.toLowerCase().includes('view more')) {
            await btn.click();
            clicked = true;
            break;
          }
        }
      }
    } catch (error) {
      // console.log(`Debug: View More button not found or not clickable: ${error.message}`);
      clicked = false;
    }

    if (clicked) {
      clickCount++;
      console.log(`   ✓ "View More" cliqué (${clickCount})`);
      await sleep(5000); // Attendre que les nouveaux builds se chargent
    } else {
      console.log('   ⚠ "View More" button not found, stopping clicks.');
      break; // Stop if button is not found
    }

  }

  if (clickCount > 0) {
    console.log(`✓ Tous les builds chargés après ${clickCount} clics`);
  }

  // Scroll final pour être sûr
  await autoScroll(page);
  await sleep(1000);

  // Extraire tous les liens de builds de la catégorie "DLT for Operations"
  const buildIds = await page.evaluate(() => {
    const ids = [];

    // Chercher tous les éléments de projet/build
    const projectCards = document.querySelectorAll('[class*="project"], [class*="buidl"], [class*="card"]');

    projectCards.forEach(card => {
      // Vérifier si le projet appartient à la catégorie "DLT for Operations"
      const text = card.innerText || card.textContent || '';
      const isDLTforOperations =
        (text.toLowerCase().includes('dlt') && text.toLowerCase().includes('operation')) ||
        text.toLowerCase().includes('dlt for operation') ||
        text.toLowerCase().includes('dlts for operation');

      // Si c'est dans la bonne catégorie, extraire l'ID
      if (isDLTforOperations) {
        const links = card.querySelectorAll('a[href*="/buidl/"]');
        links.forEach(link => {
          const href = link.href;
          const match = href.match(/\/buidl\/(\d+)/);
          if (match && match) {
            const id = match; // Extract the ID as a string
            if (id && !ids.includes(id)) {
              ids.push(id);
            }
          }
        });
      }
    });

    // Si aucun build trouvé avec le filtre de catégorie dans les cards,
    // chercher tous les builds et on filtrera après
    if (ids.length === 0) {
      const allLinks = document.querySelectorAll('a[href*="/buidl/"]');
      allLinks.forEach(link => {
        const href = link.href;
        const match = href.match(/\/buidl\/(\d+)/);
        if (match && match) {
          const id = match; // Extract the ID as a string
          if (id && !ids.includes(id)) {
            ids.push(id);
          }
        }
      });
    }

    return ids;
  });

  console.log(`✓ ${buildIds.length} builds trouvés`);
  return buildIds;
}

// Scraper les détails d'un build spécifique
async function scrapeBuildDetails(page, buildId) {
  const buildUrl = `${BUIDL_BASE_URL}${buildId}`;

  try {
    console.log(`   → Scraping build ${buildId}...`);

    await page.goto(buildUrl, {
      waitUntil: 'networkidle2',
      timeout: 90000 // Increased timeout
    });

    await sleep(3000); // Increased sleep

    // Extraire toutes les informations du build
    const buildData = await page.evaluate(() => {
      const data = {
        id: window.location.pathname.split('/').pop(),
        url: window.location.href
      };

      // Titre
      const titleEl = document.querySelector('h1, [class*="title"]');
      data.title = titleEl?.innerText?.trim() || '';

      // Description / Tagline
      const taglineEl = document.querySelector('[class*="tagline"], [class*="subtitle"]');
      data.tagline = taglineEl?.innerText?.trim() || '';

      // Description complète
      const descriptionEl = document.querySelector('[class*="description"], [class*="content"] p, article');
      data.description = descriptionEl?.innerText?.trim() || '';

      // Team / Auteur
      const teamEl = document.querySelector('[class*="team"], [class*="author"], [class*="creator"]');
      data.team = teamEl?.innerText?.trim() || '';

      // Tags / Catégories
      const tags = [];
      document.querySelectorAll('[class*="tag"], [class*="category"], [class*="label"], [class*="track"]').forEach(tag => {
        const text = tag.innerText?.trim();
        if (text && !tags.includes(text)) {
          tags.push(text);
        }
      });
      data.tags = tags;

      // Catégorie spécifique (Track)
      data.category = '';
      const fullText = document.body.innerText.toLowerCase();
      if (fullText.includes('dlt') && fullText.includes('operation')) {
        data.category = 'DLT for Operations';
      }

      // Chercher aussi dans les tags
      tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if ((tagLower.includes('dlt') && tagLower.includes('operation')) ||
            tagLower.includes('dlt for operation')) {
          data.category = tag; // Utiliser le nom exact de la catégorie
        }
      });

      // Technologies mentionnées (réutilisation de fullText déjà déclaré)
      const techKeywords = ['hedera', 'hashgraph', 'hcs', 'hts', 'smart contract', 'blockchain', 'dlt'];
      data.technologies = [];
      techKeywords.forEach(tech => {
        if (fullText.includes(tech)) {
          data.technologies.push(tech);
        }
      });

      // Liens (GitHub, demo, etc.)
      data.links = {
        github: '',
        demo: '',
        website: '',
        others: []
      };

      document.querySelectorAll('a[href]').forEach(link => {
        const href = link.href;
        const text = link.innerText?.toLowerCase() || '';

        if (href.includes('github.com')) {
          data.links.github = href;
        } else if (text.includes('demo') || text.includes('live')) {
          data.links.demo = href;
        } else if (text.includes('website') || text.includes('site')) {
          data.links.website = href;
        }
      });

      // Votes / Stats
      const votesEl = document.querySelector('[class*="vote"], [class*="like"]');
      data.votes = votesEl?.innerText?.trim() || '0';

      // Date de création
      const dateEl = document.querySelector('[class*="date"], time');
      data.date = dateEl?.innerText?.trim() || dateEl?.getAttribute('datetime') || '';

      return data;
    });

    buildData.extractedAt = new Date().toISOString();
    buildData.success = true;

    return buildData;

  } catch (error) {
    console.error(`   ✗ Erreur sur build ${buildId}:`, error.message);
    return {
      id: buildId,
      url: buildUrl,
      success: false,
      error: error.message,
      extractedAt: new Date().toISOString()
    };
  }
}

// Scraper tous les builds et écrire directement dans un fichier
async function scrapeAllBuilds(page, buildIds, filePath) {
  const total = buildIds.length;
  let firstWrite = true;

  console.log(`\n📊 Scraping de ${total} builds et écriture dans ${filePath}...\n`);

  // Commencer le fichier JSON comme un tableau
  await fs.writeFile(filePath, '[\n');

  for (let i = 0; i < buildIds.length; i++) {
    const buildId = buildIds[i];
    const progress = `[${i + 1}/${total}]`;

    console.log(`${progress} Build ${buildId}`);

    const buildData = await scrapeBuildDetails(page, buildId[1]);

    // Ajouter une virgule avant chaque objet sauf le premier
    if (!firstWrite) {
      await fs.appendFile(filePath, ',\n');
    } else {
      firstWrite = false;
    }
    await fs.appendFile(filePath, JSON.stringify(buildData, null, 2));

    // Petite pause entre chaque build pour ne pas surcharger le serveur
    await sleep(2500); // Increased sleep
  }

  // Fermer le tableau JSON
  await fs.appendFile(filePath, '\n]');

  console.log(`\n✓ ${total} builds scrapés et sauvegardés dans ${filePath}`);
  return filePath; // Retourne le chemin du fichier où les données ont été écrites
}

// Intercepter les requêtes réseau pour récupérer les données de l'API
async function interceptAPIRequests(page) {
  const apiData = [];

  page.on('response', async (response) => {
    const url = response.url();

    // Intercepter les requêtes vers l'API DoraHacks
    if (url.includes('api') || url.includes('graphql')) {
      try {
        const contentType = response.headers()['content-type'];
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();

          // Chercher les données de projets dans la réponse
          if (data.data || data.projects || data.buidls) {
            console.log('📡 Données API interceptées:', url);
            apiData.push({
              url,
              data,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        // Ignore les erreurs de parsing JSON
      }
    }
  });

  return apiData;
}

// Auto-scroll pour charger tout le contenu
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage du scraper DoraHacks Hedera Hack Africa\n');

  await ensureDataDir();

  const browser = await puppeteer.launch({
    headless: false, // Mode visible pour connexion manuelle
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport: null // Utilise la taille complète de la fenêtre
  });

  const page = await browser.newPage();

  // Configurer l'user agent pour simuler un vrai navigateur
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Maximiser la fenêtre pour avoir toute la page visible

  try {
    // Tenter de charger les cookies existants
    const hasCookies = await loadCookies(page);

    // Si pas de cookies ou si login requis
    if (!hasCookies) {
      const loginMode = process.env.LOGIN_MODE || 'manual';
      const email = process.env.DORAHACKS_EMAIL;

      if (loginMode === 'auto' && email) {
        // Mode semi-automatique: remplit l'email et clique sur "Get Code"
        await autoLoginWithCode(page, email);
      } else {
        // Mode manuel complet
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
        await waitForManualLogin(page);
      }
    }

    // Activer l'interception des requêtes API
    interceptAPIRequests(page);

    // Étape 1: Récupérer la liste des builds
    let buildIds = await getBuildIds(page);

    // Étape 2: Filtrer pour exclure votre build
    const initialCount = buildIds.length;
    buildIds = buildIds.filter(id => id !== MY_BUIDL_ID);

    if (buildIds.length < initialCount) {
      console.log(`⚠ Build ${MY_BUIDL_ID} (le vôtre) exclu de l'analyse`);
    }

    console.log(`📊 ${buildIds.length} builds à scraper\n`);

    // Étape 3: Scraper tous les builds et les écrire directement dans un fichier temporaire
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempAllBuildsPath = path.join(DATA_DIR, `temp-all-builds-${timestamp}.json`);
    await scrapeAllBuilds(page, buildIds, tempAllBuildsPath);

    // Lire le fichier temporaire pour le filtrage
    const allBuildsRaw = await fs.readFile(tempAllBuildsPath, 'utf-8');
    const allBuilds = JSON.parse(allBuildsRaw);

    // Étape 4: Filtrer pour ne garder que ceux de la catégorie "DLT for Operations"
    const buildsInCategory = allBuilds.filter(build => {
      if (!build.success) return true; // Garder les erreurs pour debug

      const category = (build.category || '').toLowerCase();
      const tags = (build.tags || []).map(t => t.toLowerCase()).join(' ');
      const description = (build.description || '').toLowerCase();
      const title = (build.title || '').toLowerCase();

      const isDLTforOps =
        (category.includes('dlt') && category.includes('operation')) ||
        (tags.includes('dlt') && tags.includes('operation')) ||
        description.includes('dlt for operation') ||
        title.includes('dlt for operation');

      return isDLTforOps;
    });

    console.log(`\n🔍 Filtrage: ${buildsInCategory.length}/${allBuilds.length} builds dans "DLT for Operations"`);

    // Sauvegarder les données brutes (tous les builds scrapés)
    const finalAllBuildsPath = path.join(DATA_DIR, `builds-all-${timestamp}.json`);
    await fs.rename(tempAllBuildsPath, finalAllBuildsPath); // Renommer le fichier temporaire
    console.log(`✓ Tous les builds sauvegardés: ${finalAllBuildsPath}`);

    // Sauvegarder uniquement ceux de la catégorie "DLT for Operations"
    const rawDataPath = path.join(DATA_DIR, `builds-raw-${timestamp}.json`);
    await fs.writeFile(rawDataPath, JSON.stringify(buildsInCategory, null, 2));
    console.log(`✓ Builds "DLT for Operations" sauvegardés: ${rawDataPath}`);

    // Sauvegarder aussi la liste des IDs pour référence
    const idsPath = path.join(DATA_DIR, `build-ids-${timestamp}.json`);
    await fs.writeFile(idsPath, JSON.stringify({
      category: 'DLT for Operations',
      totalScraped: allBuilds.length,
      inCategory: buildsInCategory.length,
      excluded: [MY_BUIDL_ID],
      ids: buildIds,
      timestamp
    }, null, 2));

    // Statistiques
    const successCount = buildsInCategory.filter(b => b.success).length;
    const failureCount = buildsInCategory.filter(b => !b.success).length;

    console.log('\n📈 Statistiques:');
    console.log(`   Total builds scrapés: ${allBuilds.length}`);
    console.log(`   Builds "DLT for Operations": ${buildsInCategory.length}`);
    console.log(`   ✓ Succès: ${successCount}`);
    if (failureCount > 0) {
      console.log(`   ✗ Échecs: ${failureCount}`);
    }
    console.log(`   ⚠ Exclu: 1 (votre build #${MY_BUIDL_ID})`);

    console.log('\n✅ Scraping terminé avec succès!');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    throw error;
  } finally {
    // Garder le navigateur ouvert quelques secondes pour debug
    await sleep(2000);
    await browser.close();
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getBuildIds, scrapeBuildDetails, scrapeAllBuilds, interceptAPIRequests };