const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Service Merkle Tree pour batch anchoring sur Hedera
 * Permet d'ancrer plusieurs hashs en un seul message HCS
 */
class MerkleTreeService {
  constructor() {
    this.hashAlgorithm = 'sha256';
  }

  /**
   * Hash une donnée avec SHA-256
   */
  hash(data) {
    const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return crypto.createHash(this.hashAlgorithm).update(stringData).digest('hex');
  }

  /**
   * Combine deux hashs pour créer un hash parent
   */
  combineHashes(left, right) {
    // Toujours ordonner les hashs pour un résultat déterministe
    const sortedHashes = [left, right].sort();
    return this.hash(sortedHashes[0] + sortedHashes[1]);
  }

  /**
   * Construit un Merkle Tree à partir d'une liste de hashs
   * Retourne la racine et l'arbre complet
   */
  buildTree(leaves) {
    if (!leaves || leaves.length === 0) {
      throw new Error('Cannot build Merkle Tree from empty leaves');
    }

    // Niveau 0: les feuilles (leaf nodes)
    let currentLevel = leaves.map(leaf => {
      // Si c'est déjà un hash, l'utiliser tel quel
      // Sinon, hasher la donnée
      return typeof leaf === 'string' && leaf.length === 64 ? leaf : this.hash(leaf);
    });

    const tree = [currentLevel];

    // Construire l'arbre niveau par niveau jusqu'à la racine
    while (currentLevel.length > 1) {
      const nextLevel = [];

      // Combiner les paires de hashs
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // Dupliquer si impair

        const parent = this.combineHashes(left, right);
        nextLevel.push(parent);
      }

      currentLevel = nextLevel;
      tree.push(nextLevel);
    }

    // La racine est le seul élément du dernier niveau
    const root = currentLevel[0];

    logger.debug('Merkle Tree built', {
      leavesCount: leaves.length,
      treeHeight: tree.length,
      root: root.substring(0, 16) + '...'
    });

    return {
      root,
      tree,
      leaves: tree[0], // Les feuilles hashées
      height: tree.length
    };
  }

  /**
   * Génère une preuve de Merkle (Merkle Proof) pour une feuille
   * Permet de prouver qu'un élément fait partie du batch sans révéler les autres
   */
  generateProof(tree, leafIndex) {
    if (!tree || !tree.tree || tree.tree.length === 0) {
      throw new Error('Invalid Merkle Tree');
    }

    if (leafIndex < 0 || leafIndex >= tree.tree[0].length) {
      throw new Error('Leaf index out of bounds');
    }

    const proof = [];
    let currentIndex = leafIndex;

    // Parcourir l'arbre niveau par niveau
    for (let level = 0; level < tree.height - 1; level++) {
      const currentLevelNodes = tree.tree[level];
      const isRightNode = currentIndex % 2 === 1;

      // Trouver le sibling (frère) du nœud actuel
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < currentLevelNodes.length) {
        proof.push({
          hash: currentLevelNodes[siblingIndex],
          position: isRightNode ? 'left' : 'right'
        });
      }

      // Monter au niveau parent
      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  /**
   * Vérifie une preuve de Merkle
   * Confirme qu'un leaf fait partie de l'arbre avec le root donné
   */
  verifyProof(leafHash, proof, root) {
    try {
      let computedHash = leafHash;

      // Reconstruire le hash en remontant l'arbre
      for (const proofElement of proof) {
        if (proofElement.position === 'left') {
          computedHash = this.combineHashes(proofElement.hash, computedHash);
        } else {
          computedHash = this.combineHashes(computedHash, proofElement.hash);
        }
      }

      const isValid = computedHash === root;

      logger.debug('Merkle Proof verification', {
        isValid,
        computedRoot: computedHash.substring(0, 16) + '...',
        expectedRoot: root.substring(0, 16) + '...'
      });

      return isValid;

    } catch (error) {
      logger.error('Merkle Proof verification error:', error);
      return false;
    }
  }

  /**
   * Crée un batch de données avec Merkle Tree
   * Retourne tout ce qui est nécessaire pour l'anchoring et la vérification
   */
  createBatch(items) {
    if (!items || items.length === 0) {
      throw new Error('Cannot create batch from empty items');
    }

    // Construire le tree
    const tree = this.buildTree(items);

    // Créer les preuves pour chaque item
    const proofs = items.map((_, index) =>
      this.generateProof(tree, index)
    );

    // Métadonnées du batch
    const batchMetadata = {
      batchId: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      merkleRoot: tree.root,
      treeHeight: tree.height
    };

    return {
      metadata: batchMetadata,
      merkleRoot: tree.root,
      tree: tree,
      leaves: tree.leaves,
      proofs: proofs,
      items: items.map((item, index) => ({
        index,
        data: item,
        hash: tree.leaves[index],
        proof: proofs[index]
      }))
    };
  }

  /**
   * Vérifie qu'un item fait partie d'un batch
   */
  verifyItemInBatch(itemHash, proof, merkleRoot) {
    return this.verifyProof(itemHash, proof, merkleRoot);
  }

  /**
   * Calcule les économies potentielles du batching
   */
  calculateSavings(itemCount, avgItemSize) {
    // Sans batching: itemCount messages
    const withoutBatching = {
      messagesCount: itemCount,
      totalSize: itemCount * avgItemSize,
      estimatedCost: itemCount * 0.0001 // 0.0001 HBAR par message
    };

    // Avec batching: 1 message avec le root + métadonnées
    const batchMessageSize = 500; // Root + métadonnées ≈ 500 bytes
    const withBatching = {
      messagesCount: 1,
      totalSize: batchMessageSize,
      estimatedCost: 0.0001 // Un seul message
    };

    const savings = {
      messagesSaved: withoutBatching.messagesCount - withBatching.messagesCount,
      sizeSaved: withoutBatching.totalSize - withBatching.totalSize,
      costSaved: withoutBatching.estimatedCost - withBatching.estimatedCost,
      savingsPercent: ((1 - withBatching.estimatedCost / withoutBatching.estimatedCost) * 100).toFixed(1)
    };

    return {
      withoutBatching,
      withBatching,
      savings
    };
  }

  /**
   * Optimise la taille d'un batch selon les contraintes Hedera
   */
  getOptimalBatchSize() {
    // HCS message max: 1024 bytes pour le memo
    // Objectif: maximiser le nombre d'items par batch
    // Considérations:
    // - 1 root: 64 chars (32 bytes)
    // - Métadonnées: ~200 bytes
    // - Marge de sécurité: 20%

    return {
      recommended: 50, // 50 items par batch
      min: 10,
      max: 100,
      reasoning: 'Optimal balance between cost savings and processing time'
    };
  }
}

module.exports = new MerkleTreeService();
