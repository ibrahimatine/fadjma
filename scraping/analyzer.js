const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const MY_BUIDL_ID = '33512'; // Votre build (déjà exclu du scraping)

// Trouver le fichier de données le plus récent
async function findLatestDataFile(pattern = 'builds-raw') {
  const files = await fs.readdir(DATA_DIR);
  const matchingFiles = files
    .filter(f => f.includes(pattern) && f.endsWith('.json'))
    .sort()
    .reverse();

  if (matchingFiles.length === 0) {
    throw new Error(`Aucun fichier trouvé avec le pattern "${pattern}". Avez-vous lancé le scraper d'abord ?`);
  }

  return path.join(DATA_DIR, matchingFiles[0]);
}

// Charger les données des builds
async function loadBuilds(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  const builds = JSON.parse(data);

  // Filtrer uniquement les builds réussis
  return builds.filter(b => b.success === true);
}

// Filtrer les builds qui sont bien dans "DLT for Operations"
// Note: Le scraper fait déjà ce filtrage, mais on double-check ici
async function filterDLTBuilds(builds) {
  return builds.filter(build => {
    // Vérifier la catégorie explicite
    const category = (build.category || '').toLowerCase();
    if (category.includes('dlt') && category.includes('operation')) {
      return true;
    }

    // Vérifier les tags
    const tags = (build.tags || []).map(t => t.toLowerCase()).join(' ');
    if (tags.includes('dlt') && tags.includes('operation')) {
      return true;
    }

    // Vérifier le contenu (moins fiable mais utile si la catégorie n'est pas extraite)
    const searchText = `
      ${build.title || ''}
      ${build.tagline || ''}
      ${build.description || ''}
      ${(build.technologies || []).join(' ')}
    `.toLowerCase();

    const dltsKeywords = [
      'dlt for operation',
      'dlts for operation',
      'distributed ledger',
      'hedera',
      'hashgraph',
      'blockchain',
      'smart contract',
      'hcs',
      'hts'
    ];

    return dltsKeywords.some(keyword => searchText.includes(keyword.toLowerCase()));
  });
}

// Analyser les caractéristiques des builds
function analyzeBuilds(builds) {
  const analysis = {
    totalBuilds: builds.length,
    categories: {},
    technologies: {},
    withGithub: 0,
    withDemo: 0,
    withWebsite: 0
  };

  builds.forEach(build => {
    // Analyser les tags/catégories
    if (build.tags && Array.isArray(build.tags)) {
      build.tags.forEach(tag => {
        analysis.categories[tag] = (analysis.categories[tag] || 0) + 1;
      });
    }

    // Analyser les technologies détectées
    if (build.technologies && Array.isArray(build.technologies)) {
      build.technologies.forEach(tech => {
        analysis.technologies[tech] = (analysis.technologies[tech] || 0) + 1;
      });
    }

    // Analyser les technologies mentionnées dans le texte
    const techKeywords = [
      'hedera', 'hashgraph', 'hcs', 'hts', 'smart contract',
      'react', 'node', 'python', 'rust', 'solidity',
      'ai', 'ml', 'machine learning', 'api', 'web3',
      'nft', 'token', 'defi', 'dao', 'dlt', 'blockchain'
    ];

    const text = `${build.title} ${build.tagline} ${build.description}`.toLowerCase();
    techKeywords.forEach(tech => {
      if (text.includes(tech.toLowerCase())) {
        analysis.technologies[tech] = (analysis.technologies[tech] || 0) + 1;
      }
    });

    // Analyser les liens
    if (build.links) {
      if (build.links.github) analysis.withGithub++;
      if (build.links.demo) analysis.withDemo++;
      if (build.links.website) analysis.withWebsite++;
    }
  });

  return analysis;
}

// Comparer avec votre projet
function compareWithYourProject(dltsBuilds) {
  const yourProjectFeatures = {
    name: 'Votre Projet DLT (Build #33512)',
    features: [
      'Hedera Hashgraph',
      'Smart Contracts',
      'Consensus Service (HCS)',
      'Token Service (HTS)',
      'Mirror Node',
      'API Integration',
      'Distributed Operations',
      'DLT',
      'Blockchain'
    ],
    category: 'DLTs for operation'
  };

  const similarities = [];

  dltsBuilds.forEach(build => {
    const text = `
      ${build.title}
      ${build.tagline}
      ${build.description}
      ${(build.technologies || []).join(' ')}
    `.toLowerCase();

    const matchingFeatures = yourProjectFeatures.features.filter(feature =>
      text.includes(feature.toLowerCase())
    );

    const similarityScore = (matchingFeatures.length / yourProjectFeatures.features.length) * 100;

    if (matchingFeatures.length > 0) {
      similarities.push({
        id: build.id,
        project: build.title,
        tagline: build.tagline,
        matchingFeatures,
        similarityScore: similarityScore.toFixed(2),
        description: build.description?.substring(0, 200),
        url: build.url,
        technologies: build.technologies || [],
        links: build.links || {}
      });
    }
  });

  // Trier par score de similarité
  similarities.sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    yourProject: yourProjectFeatures,
    topCompetitors: similarities.slice(0, 10),
    totalSimilarProjects: similarities.length,
    allSimilarProjects: similarities
  };
}

// Générer un rapport détaillé
async function generateReport(allBuilds, dltsBuilds, comparison) {
  const analysis = analyzeBuilds(dltsBuilds);

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalBuilds: allBuilds.length,
      dltsBuilds: dltsBuilds.length,
      dltsPercentage: ((dltsBuilds.length / allBuilds.length) * 100).toFixed(2),
      excludedBuild: MY_BUIDL_ID
    },
    analysis,
    comparison,
    recommendations: generateRecommendations(comparison, analysis)
  };

  // Sauvegarder le rapport
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(DATA_DIR, `competitive-analysis-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  return { report, reportPath };
}

// Générer des recommandations basées sur l'analyse
function generateRecommendations(comparison, analysis) {
  const recommendations = [];

  // Top technologies utilisées
  const topTechs = Object.entries(analysis.technologies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tech]) => tech);

  recommendations.push({
    type: 'Technologies populaires',
    message: `Les technologies les plus utilisées par vos compétiteurs: ${topTechs.join(', ')}`,
    action: 'Considérez intégrer ou mettre en avant ces technologies dans votre projet'
  });

  // Niveau de compétition
  const competitionLevel = comparison.totalSimilarProjects;
  if (competitionLevel > 5) {
    recommendations.push({
      type: 'Différenciation',
      message: `${competitionLevel} projets similaires détectés`,
      action: 'Identifiez vos points uniques de différenciation pour vous démarquer'
    });
  }

  // Top catégories
  const topCategories = Object.entries(analysis.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  recommendations.push({
    type: 'Catégories tendances',
    message: `Catégories populaires: ${topCategories.join(', ')}`,
    action: 'Assurez-vous que votre projet est bien positionné dans ces catégories'
  });

  return recommendations;
}

// Afficher un résumé dans la console
function displaySummary(report) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ANALYSE COMPARATIVE - HEDERA HACK AFRICA');
  console.log('='.repeat(80));

  console.log('\n📈 STATISTIQUES GLOBALES:');
  console.log(`   Total de builds analysés: ${report.metadata.totalBuilds}`);
  console.log(`   Builds DLT/Blockchain: ${report.metadata.dltsBuilds} (${report.metadata.dltsPercentage}%)`);
  console.log(`   Votre build exclu: #${report.metadata.excludedBuild}`);

  console.log('\n🔝 TOP 5 TECHNOLOGIES:');
  const topTechs = Object.entries(report.analysis.technologies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topTechs.length > 0) {
    topTechs.forEach(([tech, count], index) => {
      console.log(`   ${index + 1}. ${tech}: ${count} builds`);
    });
  } else {
    console.log('   Aucune technologie détectée');
  }

  console.log('\n🏆 TOP COMPÉTITEURS (Similarité avec votre projet):');
  if (report.comparison.topCompetitors.length > 0) {
    report.comparison.topCompetitors.slice(0, 5).forEach((comp, index) => {
      console.log(`\n   ${index + 1}. ${comp.project} (Build #${comp.id})`);
      console.log(`      Score de similarité: ${comp.similarityScore}%`);
      console.log(`      Features communes: ${comp.matchingFeatures.join(', ')}`);
      if (comp.tagline) {
        console.log(`      Tagline: ${comp.tagline}`);
      }
      console.log(`      URL: ${comp.url}`);
      if (comp.links.github) {
        console.log(`      GitHub: ${comp.links.github}`);
      }
    });
  } else {
    console.log('   Aucun compétiteur similaire trouvé');
  }

  console.log('\n💡 RECOMMANDATIONS:');
  report.recommendations.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.type}`);
    console.log(`      ${rec.message}`);
    console.log(`      → ${rec.action}`);
  });

  console.log('\n' + '='.repeat(80));
}

// Fonction principale
async function main() {
  console.log('🔍 Démarrage de l\'analyse comparative...\n');

  try {
    // Charger les données scrapées
    const dataFile = await findLatestDataFile('builds-raw');
    console.log(`📂 Chargement: ${path.basename(dataFile)}`);

    const builds = await loadBuilds(dataFile);
    console.log(`✓ ${builds.length} builds chargés (succès uniquement)`);

    // Filtrer les builds DLT
    console.log('\n🔎 Filtrage des builds DLT/Blockchain...');
    const dltsBuilds = await filterDLTBuilds(builds);
    console.log(`✓ ${dltsBuilds.length} builds DLT trouvés`);

    // Comparer avec votre projet
    console.log('\n⚖️  Comparaison avec votre projet (Build #33512)...');
    const comparison = compareWithYourProject(dltsBuilds);
    console.log(`✓ ${comparison.totalSimilarProjects} builds similaires identifiés`);

    // Générer le rapport
    console.log('\n📝 Génération du rapport...');
    const { report, reportPath } = await generateReport(builds, dltsBuilds, comparison);
    console.log(`✓ Rapport sauvegardé: ${reportPath}`);

    // Sauvegarder aussi les builds DLT filtrés
    const dltsPath = path.join(DATA_DIR, `dlts-builds-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(dltsPath, JSON.stringify(dltsBuilds, null, 2));
    console.log(`✓ Builds DLT sauvegardés: ${dltsPath}`);

    // Afficher le résumé
    displaySummary(report);

    console.log('\n✅ Analyse terminée avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  loadBuilds,
  filterDLTBuilds,
  analyzeBuilds,
  compareWithYourProject,
  generateReport
};
