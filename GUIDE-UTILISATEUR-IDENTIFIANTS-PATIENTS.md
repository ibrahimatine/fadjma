# Guide Utilisateur : Système d'Identifiants Patients

## 🏥 Pour les Patients

### Cas 1 : Vous avez reçu un identifiant de votre médecin

**Qu'est-ce qu'un identifiant patient ?**
- C'est un code unique au format `PAT-AAAAMMJJ-XXXX` (ex: `PAT-20241201-A7B9`)
- Votre médecin l'a généré pour vous créer un profil médical
- Il vous donne accès immédiat à votre dossier médical complet

**Comment utiliser votre identifiant :**

1. **Allez sur la page de liaison**
   - URL : `/link-patient`
   - Ou cliquez "J'ai un identifiant patient" depuis la page de connexion/inscription

2. **Étape 1 : Vérification de l'identifiant**
   - Saisissez votre identifiant patient (ex: `PAT-20241201-A7B9`)
   - Le système vérifie et affiche vos informations personnelles
   - Vérifiez que les informations correspondent bien à votre identité

3. **Étape 2 : Création de votre compte**
   - Choisissez votre adresse email (qui servira d'identifiant de connexion)
   - Créez un mot de passe sécurisé (minimum 6 caractères)
   - Ajoutez éventuellement votre numéro de téléphone

4. **Finalisation**
   - Votre compte est créé et automatiquement lié à votre dossier médical
   - Vous pouvez maintenant vous connecter avec votre email/mot de passe
   - Votre médecin a automatiquement accès à votre dossier

**Avantages de cette méthode :**
- ✅ Accès immédiat à votre dossier médical existant
- ✅ Pas de demande d'accès à faire
- ✅ Votre médecin peut continuer à mettre à jour votre dossier
- ✅ Historique médical déjà présent

### Cas 2 : Vous n'avez pas d'identifiant patient

**Création d'un compte classique :**

1. **Allez sur la page d'inscription**
   - URL : `/register`
   - Choisissez "Créer un nouveau compte patient"

2. **Remplissez vos informations**
   - Informations personnelles (nom, prénom, email, mot de passe)
   - Informations médicales (date de naissance, genre)

3. **Accès aux dossiers médicaux**
   - Vous devrez demander l'accès à vos médecins
   - Chaque médecin doit approuver votre demande d'accès
   - Processus plus long mais sécurisé

## 👨‍⚕️ Pour les Médecins

### Créer un profil patient avec identifiant

1. **Connexion au dashboard médecin**
   - Connectez-vous avec votre compte médecin
   - Accédez au dashboard principal

2. **Créer un nouveau profil patient**
   - Cliquez sur "Nouveau dossier"
   - Sélectionnez "Créer un profil patient" (nouvelle option)

3. **Remplir les informations patient**
   - Nom, prénom (obligatoires)
   - Date de naissance, genre
   - Téléphone, adresse
   - Contact d'urgence
   - Numéro de sécurité sociale

4. **Génération de l'identifiant**
   - Le système génère automatiquement un identifiant unique
   - Format : `PAT-AAAAMMJJ-XXXX`
   - L'identifiant est affiché avec des options de copie/masquage

5. **Transmission au patient**
   - Communiquez l'identifiant au patient (verbal, SMS, email sécurisé)
   - Expliquez la procédure de liaison de compte
   - Le patient peut créer son compte quand il le souhaite

6. **Accès automatique**
   - Vous avez automatiquement accès en écriture au dossier du patient
   - Vous pouvez commencer à créer des dossiers médicaux
   - L'accès persiste même après que le patient ait lié son compte

### Gestion des profils non réclamés

**Voir vos profils créés :**
- Dashboard → Section "Patients non réclamés"
- Liste avec identifiants et statut de liaison
- Possibilité de rechercher par nom ou identifiant

**Suivi des liaisons :**
- Notification quand un patient lie son identifiant
- Changement automatique du statut "non réclamé" → "réclamé"
- Maintien de l'accès médecin au dossier

## 🔐 Sécurité et Contrôles

### Pour les Patients

**Protection de l'identifiant :**
- L'identifiant est personnel et confidentiel
- Ne le partagez qu'avec des personnes de confiance
- Il ne peut être utilisé qu'une seule fois
- Rate limiting : 5 tentatives de vérification par 15 minutes

**Validation des données :**
- Vérifiez toujours vos informations personnelles avant de confirmer
- En cas d'erreur, contactez votre médecin
- Vous pouvez créer un compte classique en attendant

### Pour les Médecins

**Permissions et accès :**
- Seuls les médecins authentifiés peuvent créer des profils
- Accès automatique en écriture au dossier créé
- Audit complet de toutes les actions

**Bonnes pratiques :**
- Transmettez l'identifiant de manière sécurisée
- Vérifiez l'identité du patient avant création
- Gardez une trace des identifiants transmis
- Informez le patient du processus de liaison

## 🔄 Flux de Connexion Détaillé

### Navigation depuis les pages d'authentification

**Page de Connexion (`/login`) :**
- Connexion normale pour comptes existants
- Lien "Lier mon identifiant" pour nouveaux patients avec identifiant
- Lien "Créer un compte" pour inscription classique

**Page d'Inscription (`/register`) :**
- Banner visible "Votre médecin vous a créé un profil ?"
- Button principal "J'ai un identifiant patient"
- Séparateur "OU"
- Formulaire d'inscription classique en dessous

**Page de Liaison (`/link-patient`) :**
- Processus en 2 étapes
- Liens vers connexion et inscription classique
- Aide contextuelle pour les erreurs

## ❗ Résolution de Problèmes

### Erreurs Courantes

**"Identifiant patient introuvable"**
- Vérifiez le format : `PAT-AAAAMMJJ-XXXX`
- Vérifiez la saisie (majuscules/minuscules)
- Contactez votre médecin pour confirmer l'identifiant
- L'identifiant expire après 1 an s'il n'est pas utilisé

**"Cet identifiant a déjà été utilisé"**
- L'identifiant a déjà été lié à un compte
- Vous avez peut-être déjà créé votre compte
- Essayez de vous connecter normalement
- Contactez votre médecin en cas de doute

**"Trop de tentatives"**
- Rate limiting actif (5 tentatives/15 minutes)
- Attendez 15 minutes avant de réessayer
- Vérifiez l'identifiant entre temps

**"Adresse email déjà utilisée"**
- Cette email est déjà associée à un autre compte
- Utilisez une autre adresse email
- Ou connectez-vous si c'est votre compte existant

### Support

**Pour les Patients :**
- Contactez votre médecin pour les problèmes d'identifiant
- Support technique FadjMa pour les problèmes techniques
- Possibilité de créer un compte classique en attendant

**Pour les Médecins :**
- Documentation technique dans `PATIENT-IDENTIFIER-IMPLEMENTATION.md`
- Support technique pour problèmes système
- Formation sur les bonnes pratiques de sécurité

## 📱 Intégration Future

**Améliorations prévues :**
- Génération de QR codes pour faciliter la transmission d'identifiants
- Notifications SMS/email automatiques
- Application mobile avec scan de QR code
- Intégration avec systèmes hospitaliers existants

**Conformité :**
- Respect du RGPD/HIPAA
- Audit complet des accès
- Chiffrement des données sensibles
- Sauvegarde sécurisée des identifiants