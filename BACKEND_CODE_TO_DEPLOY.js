/*
 * 🚀 LM BANK RECRUITMENT BACKEND - V8 INTELLIGENT (OCR + RANKING + SPECIALIZATION)
 * ===============================================================
 * NEW: Specialization Field Matching (+30 points)
 * 
 * ⚠️ IMPORTANT: YOU MUST ENABLE "Drive API" IN APPS SCRIPT SERVICES!
 * 1. Click "+" next to "Services" on the left sidebar.
 * 2. Select "Drive API" and click "Add".
 * 3. Without this, the OCR (Text Extraction) will FAIL.
 */

function getMyDatabase() {
    // ✅ Fixed: Using openById() instead of getActiveSpreadsheet() for Web App deployments
    var SPREADSHEET_ID = "1EogVYQi260Lf4Ed4jh8Q_nMCcnuTCI0pXozr_RY_Ywc";
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INTELLIGENT OCR & PARSING ENGINE
// ══════════════════════════════════════════════════════════════════════════════

// Extract Text from PDF using Google Drive OCR
function extractTextFromPDF(fileId) {
    try {
        var blob = DriveApp.getFileById(fileId).getBlob();
        var resource = {
            title: "Temp_OCR_" + new Date().getTime(),
            mimeType: blob.getContentType()
        };

        // ⚠️ REQUIRES "Drive API" SERVICE ENABLED
        var file = Drive.Files.create(resource, blob, { ocr: true });
        var doc = DocumentApp.openById(file.id);
        var text = doc.getBody().getText();
        Drive.Files.remove(file.id);

        return text;
    } catch (e) {
        return "OCR Failed: " + e.message + " (Did you enable Drive API?)";
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. SIMILARITY & SCORING ALGORITHM
// ══════════════════════════════════════════════════════════════════════════════

function getLevelScore(levelStr) {
    if (!levelStr) return 0;
    var s = levelStr.toLowerCase();
    if (s.includes("doctor")) return 10;
    if (s.includes("bac+5") || s.includes("master") || s.includes("ingénieur")) return 8;
    if (s.includes("bac+3") || s.includes("licence")) return 6;
    if (s.includes("bac+2") || s.includes("technicien")) return 4;
    return 2;
}

// ─── FORMULE DE CALCUL DU DEGRÉ DE SIMILARITÉ ──────────────────────────────────
// Score = Σ (Wi × Si) / Σ Wi × 100
// Basé uniquement sur les données du formulaire (PAS d'OCR)
// ────────────────────────────────────────────────────────────────────────────────

function calculateSimilarity(candidate, job) {
    // ═══════════════════════════════════════════════════════════════════════════
    // DÉFINITION DES POIDS (Wi) - Total = 100%
    // ═══════════════════════════════════════════════════════════════════════════
    var POIDS = {
        specialite: 0.35,    // 35% - Le plus important
        ville: 0.20,         // 20%
        experience: 0.20,    // 20%
        niveau: 0.15,        // 15%
        contrat: 0.10        // 10%
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CALCUL DES SCORES INDIVIDUELS (Si) - Chacun entre 0 et 1
    // ═══════════════════════════════════════════════════════════════════════════

    var scores = {};

    // ─── 1. SPÉCIALITÉ (35%) ─────────────────────────────────────────────────────
    var jobTitle = (job.title || "").toLowerCase();
    var jobDesc = (job.desc || "").toLowerCase();
    var cvSpecialite = (candidate.specialite || "").toLowerCase();

    var specKeywords = {
        "informatique": ["développeur", "developer", "ingénieur", "data", "tech", "digital", "bancaire", "applications"],
        "finance": ["finance", "analyste", "crédit", "risque", "trésorier", "bancaire", "financier"],
        "comptabilité": ["comptable", "audit", "contrôle", "gestion"],
        "marketing": ["marketing", "digital", "produit", "communication", "chef de produit"],
        "rh": ["rh", "ressources", "recrutement", "formation"],
        "juridique": ["juriste", "conformité", "droit", "réglementaire", "contentieux"],
        "commerce": ["commercial", "client", "conseiller", "vente", "clientèle", "recouvrement"],
        "gestion": ["directeur", "responsable", "manager", "chef", "opérations", "agence"]
    };

    scores.specialite = 0;
    if (cvSpecialite && specKeywords[cvSpecialite]) {
        var keywords = specKeywords[cvSpecialite];
        var matchFound = keywords.some(function (k) {
            return jobTitle.indexOf(k) > -1 || jobDesc.indexOf(k) > -1;
        });
        scores.specialite = matchFound ? 1 : 0;
    }

    // ─── 2. VILLE (20%) ──────────────────────────────────────────────────────────
    var jobCity = (job.location || "").toLowerCase().trim();
    var candCity = (candidate.ville || "").toLowerCase().trim();

    // Villes principales du Maroc avec proximité
    var cityGroups = {
        "casablanca": ["casablanca", "casa", "mohammedia"],
        "rabat": ["rabat", "salé", "témara", "kenitra"],
        "marrakech": ["marrakech"],
        "tanger": ["tanger", "tétouan"],
        "fès": ["fès", "fez", "meknès"],
        "agadir": ["agadir"],
        "oujda": ["oujda", "nador"]
    };

    scores.ville = 0;
    if (jobCity === candCity) {
        scores.ville = 1; // Match exact
    } else {
        // Vérifier si dans le même groupe régional
        for (var region in cityGroups) {
            var cities = cityGroups[region];
            if (cities.indexOf(jobCity) > -1 && cities.indexOf(candCity) > -1) {
                scores.ville = 0.7; // Même région
                break;
            }
        }
    }

    // ─── 3. EXPÉRIENCE (20%) ─────────────────────────────────────────────────────
    var candExp = parseInt(candidate.experience) || 0;
    var jobExpStr = (job.exp || "").toLowerCase();

    // Extraire l'expérience requise
    var jobExpRequired = 0;
    if (jobExpStr.indexOf("5+") > -1 || jobExpStr.indexOf("5 ans") > -1) jobExpRequired = 5;
    else if (jobExpStr.indexOf("3-5") > -1) jobExpRequired = 4;
    else if (jobExpStr.indexOf("2-4") > -1) jobExpRequired = 3;
    else if (jobExpStr.indexOf("1-3") > -1) jobExpRequired = 2;
    else if (jobExpStr.indexOf("0-1") > -1) jobExpRequired = 1;

    if (jobExpRequired === 0) {
        scores.experience = 1; // Pas d'exigence
    } else {
        // Ratio avec bonus si surqualifié (max 1)
        scores.experience = Math.min(candExp / jobExpRequired, 1);
    }

    // ─── 4. NIVEAU D'ÉTUDES (15%) ────────────────────────────────────────────────
    var levelValues = {
        "doctorat": 10, "phd": 10,
        "bac+5": 8, "master": 8, "ingénieur": 8,
        "bac+4": 7,
        "bac+3": 6, "licence": 6,
        "bac+2": 4, "technicien": 4, "dut": 4, "bts": 4,
        "bac": 2
    };

    function getNiveauValue(str) {
        if (!str) return 0;
        var s = str.toLowerCase();
        for (var key in levelValues) {
            if (s.indexOf(key) > -1) return levelValues[key];
        }
        return 2;
    }

    var candNiveau = getNiveauValue(candidate.niveau);
    var jobNiveau = getNiveauValue(job.level);

    if (jobNiveau === 0) {
        scores.niveau = 1;
    } else {
        scores.niveau = Math.min(candNiveau / jobNiveau, 1);
    }

    // ─── 5. TYPE DE CONTRAT (10%) ────────────────────────────────────────────────
    var candContrat = (candidate.contrat || "").toLowerCase();
    var jobContrat = (job.contract || "").toLowerCase();

    if (!jobContrat || jobContrat === candContrat) {
        scores.contrat = 1;
    } else if (candContrat === "cdi" && jobContrat === "cdd") {
        scores.contrat = 0.5; // CDI peut accepter CDD
    } else {
        scores.contrat = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CALCUL DU SCORE FINAL: Score = Σ (Wi × Si) × 100
    // ═══════════════════════════════════════════════════════════════════════════

    var scoreFinal = 0;
    scoreFinal += POIDS.specialite * scores.specialite;
    scoreFinal += POIDS.ville * scores.ville;
    scoreFinal += POIDS.experience * scores.experience;
    scoreFinal += POIDS.niveau * scores.niveau;
    scoreFinal += POIDS.contrat * scores.contrat;

    // Convertir en pourcentage (0-100)
    var scorePercent = Math.round(scoreFinal * 100);

    // Ajouter micro-variance pour éviter les scores identiques (0-3%)
    scorePercent += Math.floor(Math.random() * 4);

    // Plafonner à 100
    if (scorePercent > 100) scorePercent = 100;

    return scorePercent;
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. MAIN LOGIC (Handle POST)
// ══════════════════════════════════════════════════════════════════════════════

function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        var action = data.action;
        var ss = getMyDatabase();

        // ─── DELETE OFFER ACTION ────────────────────────────────────────────────────
        if (action === 'delete_offer') {
            var offerSheet = ss.getSheetByName("Offres");
            if (!offerSheet) {
                return ContentService.createTextOutput(JSON.stringify({
                    "result": "error", "message": "Sheet 'Offres' not found"
                })).setMimeType(ContentService.MimeType.JSON);
            }

            var offerId = data.id;
            var dataRange = offerSheet.getDataRange();
            var values = dataRange.getValues();

            for (var i = 1; i < values.length; i++) { // Start from 1 to skip header
                if (values[i][0] == offerId) {
                    offerSheet.deleteRow(i + 1); // +1 because array is 0-indexed
                    return ContentService.createTextOutput(JSON.stringify({
                        "result": "success", "message": "Offer deleted"
                    })).setMimeType(ContentService.MimeType.JSON);
                }
            }

            return ContentService.createTextOutput(JSON.stringify({
                "result": "error", "message": "Offer not found"
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // ─── ADD OFFER ACTION ───────────────────────────────────────────────────────
        if (action === 'add_offer') {
            var offerSheet = ss.getSheetByName("Offres");
            if (!offerSheet) {
                offerSheet = ss.insertSheet("Offres");
                offerSheet.appendRow(["ID", "Date", "Titre", "Ville", "Contrat", "Niveau", "Experience", "Description"]);
            }

            var newId = "OFF_" + new Date().getTime();
            offerSheet.appendRow([
                newId,
                new Date().toLocaleDateString('fr-FR'),
                data.titre,
                data.ville,
                data.contrat,
                data.niveau_requis,
                data.experience_requise,
                data.description
            ]);

            return ContentService.createTextOutput(JSON.stringify({
                "result": "success", "offerId": newId
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // ─── FILE UPLOAD (for candidate/spontaneous) ────────────────────────────────
        var folderName = "CV_Uploads_V8";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

        var decoded = Utilities.base64Decode(data.cvBase64);
        var blob = Utilities.newBlob(decoded, data.mimeType, data.cvFileName);
        var file = folder.createFile(blob);
        var fileUrl = file.getUrl();
        var fileId = file.getId();

        // ─── OCR EXTRACTION ───────────────────────────────────────────────────────
        var ocrText = extractTextFromPDF(fileId);

        // Prepare Candidate Object
        var candidate = {
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            phone: data.phone,
            ville: data.ville,
            niveau: data.niveau,
            specialite: data.specialite, // New Field
            experience: data.experience,
            contrat: data.contrat,
            ocrText: ocrText
        };

        // ─── HANDLE APPLICATIONS ──────────────────────────────────────────────────

        // Get All Open Jobs for Matching
        var offerSheet = ss.getSheetByName("Offres");
        var jobs = [];
        if (offerSheet && offerSheet.getLastRow() > 1) {
            var offerData = offerSheet.getRange(2, 1, offerSheet.getLastRow() - 1, 8).getDisplayValues();
            jobs = offerData.map(function (r) {
                return {
                    id: r[0], date: r[1], title: r[2], location: r[3],
                    contract: r[4], level: r[5], exp: r[6], desc: r[7]
                };
            });
        }

        var matchResult = { score: 0, targetJob: "Aucune" };

        if (action === 'candidate') {
            // Specific Application: Match against THIS job (Case Insensitive)
            var targetJob = jobs.find(function (j) {
                return j.title.toLowerCase().trim() === data.poste.toLowerCase().trim();
            });

            if (targetJob) {
                var score = calculateSimilarity(candidate, targetJob);
                matchResult = { score: score, targetJob: data.poste };
            } else {
                matchResult = { score: 0, targetJob: data.poste + " (Offre Non Trouvée)" };
            }

        } else if (action === 'spontaneous_application') {
            // Spontaneous: Find BEST Match among ALL jobs
            var bestScore = -1;
            var bestJob = "Candidature Générale";

            jobs.forEach(function (job) {
                var s = calculateSimilarity(candidate, job);
                if (s > bestScore) {
                    bestScore = s;
                    bestJob = job.title;
                }
            });
            score = bestScore > 0 ? bestScore : 0; // Baseline
            matchResult = { score: score, targetJob: "Recommandé: " + bestJob };
        }

        // ─── SAVE TO DATABASE ─────────────────────────────────────────────────────
        var masterSheet = ss.getSheetByName("All_Candidats");
        var correctHeaders = [
            "Date", "Nom", "Prénom", "Email", "Téléphone", "Ville",
            "Niveau", "Expérience", "Contrat", "Poste/Cible",
            "Score (%)", "Status IA", "CV Link", "OCR Extract (Snippet)"
        ];

        if (!masterSheet) {
            masterSheet = ss.insertSheet("All_Candidats");
            masterSheet.appendRow(correctHeaders);
        } else {
            // Verify headers are correct - if row 1 is empty or has wrong headers, fix it
            var firstRow = masterSheet.getRange(1, 1, 1, 14).getValues()[0];
            if (!firstRow[0] || firstRow[0] !== "Date" || firstRow.length < 14 || !firstRow[10]) {
                // Clear row 1 and set correct headers
                masterSheet.getRange(1, 1, 1, 14).setValues([correctHeaders]);
            }
        }

        masterSheet.appendRow([
            new Date(),
            data.nom,
            data.prenom || "",
            data.email,
            data.phone || "",
            data.ville || "",
            data.niveau || "",
            data.experience || "",
            data.contrat || "",
            matchResult.targetJob,
            matchResult.score + "%",  // THE RANKING METRIC
            "Analysé",
            fileUrl,
            ocrText.substring(0, 500) // Preview text
        ]);

        return ContentService.createTextOutput(JSON.stringify({
            "result": "success",
            "score": matchResult.score,
            "recommendation": matchResult.targetJob
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            "result": "error",
            "message": error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. GET REQUESTS (Data Retrieval)
// ══════════════════════════════════════════════════════════════════════════════

function doGet(e) {
    var ss = getMyDatabase();
    var action = e.parameter.action;

    if (action == 'getOffers') {
        var sh = ss.getSheetByName("Offres");
        if (!sh || sh.getLastRow() <= 1) {
            return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
        }
        var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 8).getDisplayValues();
        var res = rows.map(function (r) {
            return { id: r[0], date: r[1], title: r[2], location: r[3], contract: r[4], level: r[5], exp: r[6], desc: r[7] };
        });
        return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);

    } else if (action == 'getCandidates') {
        var sh = ss.getSheetByName("All_Candidats");
        if (!sh || sh.getLastRow() <= 1) {
            return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
        }
        var dataRange = sh.getDataRange();
        var values = dataRange.getValues();
        var rows = values.slice(1);
        rows = rows.filter(function (r) { return r[0] !== "" && r[0] !== null; });
        var res = rows.map(function (r) {
            return {
                date: r[0] || "",
                nom: r[1] || "",
                prenom: r[2] || "",
                email: r[3] || "",
                phone: r[4] || "",
                ville: r[5] || "",
                niveau: r[6] || "",
                exp: r[7] || "",
                contrat: r[8] || "",
                job: r[9] || "",
                score: parseInt(r[10]) || 0,
                status: r[11] || "",
                cv: r[12] || "",
                ocr: r[13] || ""
            };
        });
        res.sort(function (a, b) { return b.score - a.score; });
        return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);

    } else {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. 🚀 SEED TEST DATA - RUN THIS FROM APPS SCRIPT EDITOR!
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// 5. 🚀 SEED TEST DATA PRO - GÉNÉRATION INTELLIGENTE ET COHÉRENTE
// ══════════════════════════════════════════════════════════════════════════════

function seedTestData() {
    var ss = getMyDatabase();

    // 1. Nettoyage
    var offerSheet = ss.getSheetByName("Offres");
    if (offerSheet) offerSheet.clear();
    else offerSheet = ss.insertSheet("Offres");

    var candidateSheet = ss.getSheetByName("All_Candidats");
    if (candidateSheet) candidateSheet.clear();
    else candidateSheet = ss.insertSheet("All_Candidats");

    // 2. Création des Offres (Standards et Précises)
    offerSheet.appendRow(["ID", "Date", "Titre", "Ville", "Contrat", "Niveau", "Experience", "Description"]);
    offerSheet.getRange(1, 1, 1, 8).setBackground("#2c3e50").setFontColor("#ffffff").setFontWeight("bold");

    var jobsData = [
        { id: "OFF_01", title: "Directeur d'Agence", city: "Casablanca", contract: "CDI", level: "Bac+5", exp: "5+ ans", desc: "Pilotage commercial et management de l'équipe agence. Responsable des objectifs et de la satisfaction client." },
        { id: "OFF_02", title: "Responsable de Caisse", city: "Rabat", contract: "CDI", level: "Bac+3", exp: "3-5 ans", desc: "Supervision des opérations de caisse, gestion des fonds et encadrement des guichetiers." },
        { id: "OFF_03", title: "Chargé de Clientèle Particuliers", city: "Marrakech", contract: "CDI", level: "Bac+3", exp: "1-3 ans", desc: "Accueil, conseil et gestion du portefeuille clients particuliers. Vente de produits bancaires." },
        { id: "OFF_04", title: "Chargé de Clientèle Professionnels", city: "Casablanca", contract: "CDI", level: "Bac+5", exp: "3-5 ans", desc: "Gestion et développement d'un portefeuille de clients professionnels et TPE." },
        { id: "OFF_05", title: "Chargé d'Affaires Entreprises", city: "Casablanca", contract: "CDI", level: "Bac+5", exp: "5+ ans", desc: "Accompagnement des PME/PMI, montage de dossiers de crédit et financement." },
        { id: "OFF_06", title: "Chargé de Compte", city: "Tanger", contract: "CDI", level: "Bac+3", exp: "2-4 ans", desc: "Suivi et gestion des comptes clients, traitement des réclamations et opérations courantes." },
        { id: "OFF_07", title: "Conseiller Clientèle", city: "Fès", contract: "CDI", level: "Bac+2", exp: "1-3 ans", desc: "Accueil physique et téléphonique, orientation des clients et promotion des services." },
        { id: "OFF_08", title: "Guichetier Payeur", city: "Agadir", contract: "CDD", level: "Bac+2", exp: "0-1 an", desc: "Opérations de guichet : retraits, versements, virements et change." },
        { id: "OFF_09", title: "Analyste Crédit", city: "Casablanca", contract: "CDI", level: "Bac+5", exp: "3-5 ans", desc: "Analyse des dossiers de crédit, évaluation des risques et recommandations d'octroi." },
        { id: "OFF_10", title: "Chargé de Recouvrement", city: "Oujda", contract: "CDD", level: "Bac+2", exp: "1-3 ans", desc: "Relance téléphonique et gestion des créances impayées. Négociation avec les débiteurs." }
    ];

    jobsData.forEach(function (j) {
        offerSheet.appendRow([j.id, "30/12/2024", j.title, j.city, j.contract, j.level, j.exp, j.desc]);
    });

    // 3. Création des Candidats (Profils Variés pour Démo)
    candidateSheet.appendRow(["Date", "Nom", "Prénom", "Email", "Téléphone", "Ville", "Niveau", "Expérience", "Contrat", "Poste/Cible", "Score (%)", "Status IA", "CV Link", "OCR Extract"]);
    candidateSheet.getRange(1, 1, 1, 14).setBackground("#2c3e50").setFontColor("#ffffff").setFontWeight("bold");

    // Définition des profils candidats à générer
    var candidatesData = [
        // --- TOP PROFILS (MATCH ~90-100%) ---
        { nom: "El Amrani", prenom: "Youssef", city: "Casablanca", level: "Bac+5", exp: "7 ans", contract: "CDI", spec: "gestion", targetJobId: "OFF_01", cv: "cv_youssef_dir.pdf" }, // Directeur d'Agence
        { nom: "Benani", prenom: "Sara", city: "Rabat", level: "Bac+3", exp: "4 ans", contract: "CDI", spec: "finance", targetJobId: "OFF_02", cv: "cv_sara_caisse.pdf" }, // Responsable de Caisse
        { nom: "Chraibi", prenom: "Omar", city: "Marrakech", level: "Bac+3", exp: "2 ans", contract: "CDI", spec: "commerce", targetJobId: "OFF_03", cv: "cv_omar_client.pdf" }, // Chargé Clientèle Particuliers

        // --- BONS PROFILS (MATCH ~70-85%) ---
        { nom: "Guedira", prenom: "Mehdi", city: "Casablanca", level: "Bac+5", exp: "4 ans", contract: "CDI", spec: "commerce", targetJobId: "OFF_04", cv: "cv_mehdi_pro.pdf" }, // Chargé Clientèle Professionnels
        { nom: "Tazi", prenom: "Leila", city: "Casablanca", level: "Bac+5", exp: "6 ans", contract: "CDI", spec: "finance", targetJobId: "OFF_05", cv: "cv_leila_affaires.pdf" }, // Chargé d'Affaires
        { nom: "Alaoui", prenom: "Karim", city: "Tanger", level: "Bac+3", exp: "3 ans", contract: "CDI", spec: "commerce", targetJobId: "OFF_06", cv: "cv_karim_compte.pdf" }, // Chargé de Compte

        // --- PROFILS MOYENS (MATCH ~50-65%) ---
        { nom: "Fassi", prenom: "Amine", city: "Fès", level: "Bac+2", exp: "2 ans", contract: "CDI", spec: "commerce", targetJobId: "OFF_07", cv: "cv_amine_conseil.pdf" }, // Conseiller Clientèle
        { nom: "Berrada", prenom: "Sofia", city: "Agadir", level: "Bac+2", exp: "0 ans", contract: "CDD", spec: "commerce", targetJobId: "OFF_08", cv: "cv_sofia_guichet.pdf" }, // Guichetier

        // --- PROFILS SPÉCIALISÉS ---
        { nom: "Idrissi", prenom: "Hamza", city: "Casablanca", level: "Bac+5", exp: "4 ans", contract: "CDI", spec: "finance", targetJobId: "OFF_09", cv: "cv_hamza_credit.pdf" }, // Analyste Crédit
        { nom: "Mernissi", prenom: "Salma", city: "Oujda", level: "Bac+2", exp: "2 ans", contract: "CDD", spec: "commerce", targetJobId: "OFF_10", cv: "cv_salma_recouv.pdf" }, // Chargé Recouvrement

        // --- PROFILS NON COMPATIBLES (MATCH <30%) ---
        { nom: "Zouaki", prenom: "Nabil", city: "Meknès", level: "Bac", exp: "10 ans", contract: "CDI", spec: "logistique", targetJobId: "OFF_01", cv: "cv_nabil_log.pdf" }, // Logistique postule Directeur
        { nom: "Hakam", prenom: "Mouna", city: "Kénitra", level: "Bac+2", exp: "2 ans", contract: "Stage", spec: "rh", targetJobId: "OFF_05", cv: "cv_mouna_rh.pdf" }, // RH postule Chargé d'Affaires

        // --- DIVERS POUR STATISTIQUES ---
        { nom: "Rami", prenom: "Samir", city: "Casablanca", level: "Bac+5", exp: "5 ans", contract: "CDI", spec: "gestion", targetJobId: "OFF_01", cv: "cv_samir_gest.pdf" },
        { nom: "Sefiani", prenom: "Hiba", city: "Rabat", level: "Bac+3", exp: "3 ans", contract: "CDI", spec: "finance", targetJobId: "OFF_02", cv: "cv_hiba_fin.pdf" },
        { nom: "Benjelloun", prenom: "Othman", city: "Marrakech", level: "Bac+3", exp: "1 an", contract: "CDI", spec: "commerce", targetJobId: "OFF_03", cv: "cv_othman_com.pdf" }
    ];

    candidatesData.forEach(function (c) {
        // Trouver l'offre cible
        var targetJob = jobsData.find(j => j.id === c.targetJobId);

        // Préparer objet candidat pour le calcul
        var candidateObj = {
            specialite: c.spec,
            ville: c.city,
            experience: c.exp,
            niveau: c.level,
            contrat: c.contract
        };

        // Préparer objet job pour le calcul
        var jobObj = {
            title: targetJob.title,
            desc: targetJob.desc,
            location: targetJob.city,
            exp: targetJob.exp,
            contract: targetJob.contract,
            level: targetJob.level
        };

        // 🔥 CALCUL DYNAMIQUE DU SCORE RÉEL 🔥
        var realScore = calculateSimilarity(candidateObj, jobObj);

        // Formater l'expérience pour l'affichage (chiffre uniquement pour CSV propre)
        candidateSheet.appendRow([
            "30/12/2024",
            c.nom,
            c.prenom,
            c.prenom.toLowerCase() + "." + c.nom.toLowerCase() + "@email.com",
            "0600000000",
            c.city,
            c.level,
            c.exp,
            c.contract,
            targetJob.title, // Colonne Poste/Cible
            realScore + "%", // Le score calculé par l'algo
            "Analysé",
            "https://fake-cv-link.com/" + c.cv,
            "Contenu extrait automatiquement..."
        ]);
    });

    // Auto-resize
    offerSheet.autoResizeColumns(1, 8);
    candidateSheet.autoResizeColumns(1, 14);

    Logger.log("✅ SEED PRO TERMINÉ : " + candidatesData.length + " candidats générés avec des scores calculés par l'algorithme.");
    return "SUCCÈS : Données PRO générées !";
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. 🧹 CLEAR ALL DATA (For Testing)
// ══════════════════════════════════════════════════════════════════════════════

function clearAllData() {
    var ss = getMyDatabase();

    var offerSheet = ss.getSheetByName("Offres");
    if (offerSheet) offerSheet.clear();

    var candidateSheet = ss.getSheetByName("All_Candidats");
    if (candidateSheet) candidateSheet.clear();

    Logger.log("🧹 All data cleared!");
    return "All data cleared!";
}
