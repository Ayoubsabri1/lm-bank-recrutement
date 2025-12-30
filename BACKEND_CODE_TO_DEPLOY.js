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

// ─── SCORING LOGIC WITH SPECIALIZATION ──────────────────────────────────────────────────────────
function calculateSimilarity(candidate, job) {
    var score = 0;
    var jobTitle = (job.title || "").toLowerCase();
    var jobDesc = (job.desc || "").toLowerCase();
    var ocrText = (candidate.ocrText || "").toLowerCase();
    var cvSpeciality = (candidate.specialite || "").toLowerCase();

    // 1. SPECIALIZATION MATCH (Huge Bonus for explicit match)
    // Map Specialities to Keywords
    var specKeywords = {
        "informatique": ["développeur", "developer", "ingénieur", "système", "réseau", "it", "data", "full stack", "java", "python", "tech"],
        "finance": ["finance", "analyste", "bancaire", "crédit", "risque", "audit", "comptable"],
        "comptabilité": ["comptable", "comptabilité", "audit", "financier", "trésorerie"],
        "marketing": ["marketing", "communication", "digital", "brand", "média", "social"],
        "rh": ["rh", "ressources humaines", "recrutement", "talent", "personnel", "paie"],
        "juridique": ["juriste", "droit", "légal", "conformité", "contentieux", "avocat"],
        "commerce": ["commercial", "vente", "business", "sales", "client", "compte"],
        "gestion": ["gestion", "manager", "directeur", "chef", "responsable", "projet"],
        "logistique": ["logistique", "supply", "achat", "transport", "stock"]
    };

    if (cvSpeciality && specKeywords[cvSpeciality]) {
        var keywords = specKeywords[cvSpeciality];
        var matchFound = keywords.some(function (k) { return jobTitle.indexOf(k) > -1 || jobDesc.indexOf(k) > -1; });
        if (matchFound) {
            score += 30; // DIRECT HIT on Specialization
        }
    }

    // 2. LOCATION MATCH (Existing logic)
    var jobCity = (job.location || "").toLowerCase().trim();
    var candCity = (candidate.ville || "").toLowerCase().trim();

    // Fuzzy city matching
    var cityMatch = false;
    if (jobCity === candCity) cityMatch = true;
    else if (jobCity.indexOf(candCity) > -1 && candCity.length > 3) cityMatch = true;
    else if (candCity.indexOf(jobCity) > -1 && jobCity.length > 3) cityMatch = true;
    // Specific Morocco alias
    else if (candCity === "casa" && jobCity === "casablanca") cityMatch = true;
    else if (candCity === "casablanca" && jobCity === "casa") cityMatch = true;

    if (cityMatch) score += 20;

    // 3. EXPERIENCE & LEVEL (Simplified Base)
    var candExp = parseInt(candidate.experience) || 0;
    if (candExp > 0) score += 10;

    // Level Bonus
    var candLevel = getLevelScore(candidate.niveau);
    if (candLevel > 0) score += 10;

    // 4. OCR KEYWORD MATCH (Contextual Boost)
    if (ocrText) {
        var titleWords = jobTitle.split(" ").filter(function (w) { return w.length > 3; });
        var keywordMatches = 0;
        titleWords.forEach(function (w) {
            if (ocrText.indexOf(w) > -1) keywordMatches++;
        });
        score += (keywordMatches * 10);
    }

    // Cap at 100
    if (score > 100) score = 100;

    // Add random micro-variance to prevent collisions (0-5%)
    score += Math.floor(Math.random() * 5);

    return score;
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

function seedTestData() {
    var ss = getMyDatabase();

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Clear existing data
    // ═══════════════════════════════════════════════════════════════════════════

    var offerSheet = ss.getSheetByName("Offres");
    if (offerSheet) {
        offerSheet.clear();
    } else {
        offerSheet = ss.insertSheet("Offres");
    }

    var candidateSheet = ss.getSheetByName("All_Candidats");
    if (candidateSheet) {
        candidateSheet.clear();
    } else {
        candidateSheet = ss.insertSheet("All_Candidats");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Create 10 Banking Jobs
    // ═══════════════════════════════════════════════════════════════════════════

    offerSheet.appendRow(["ID", "Date", "Titre", "Ville", "Contrat", "Niveau", "Experience", "Description"]);

    var jobs = [
        ["OFF_001", "30/12/2024", "Développeur Applications Bancaires", "Casablanca", "CDI", "Bac+5", "3-5 ans", "Développement d'applications bancaires Java/Spring, APIs REST, Core Banking"],
        ["OFF_002", "30/12/2024", "Analyste Crédit Bancaire", "Casablanca", "CDI", "Bac+5", "2-4 ans", "Analyse des dossiers de crédit, évaluation des risques, scoring"],
        ["OFF_003", "30/12/2024", "Directeur d'Agence Bancaire", "Rabat", "CDI", "Bac+5", "5+ ans", "Gestion d'agence, management équipe, développement commercial"],
        ["OFF_004", "30/12/2024", "Responsable Conformité Bancaire", "Casablanca", "CDI", "Bac+5", "5+ ans", "Conformité Bank Al-Maghrib, LCB-FT, KYC, audit"],
        ["OFF_005", "30/12/2024", "Conseiller Clientèle Particuliers", "Marrakech", "CDI", "Bac+3", "1-3 ans", "Conseil produits bancaires, gestion portefeuille clients"],
        ["OFF_006", "30/12/2024", "Analyste Risques Financiers", "Casablanca", "CDI", "Bac+5", "3-5 ans", "Gestion risques marché, VaR, Bâle III, stress testing"],
        ["OFF_007", "30/12/2024", "Trésorier Banque", "Casablanca", "CDI", "Bac+5", "5+ ans", "Gestion trésorerie, opérations marché, change, ALM"],
        ["OFF_008", "30/12/2024", "Responsable Opérations Bancaires", "Rabat", "CDI", "Bac+5", "3-5 ans", "Back-office, virements SWIFT, compensation"],
        ["OFF_009", "30/12/2024", "Chef de Produit Digital Banking", "Casablanca", "CDI", "Bac+5", "3-5 ans", "Mobile banking, fintech, innovation digitale"],
        ["OFF_010", "30/12/2024", "Chargé de Recouvrement Bancaire", "Tanger", "CDI", "Bac+3", "2-4 ans", "Recouvrement créances, négociation, contentieux"]
    ];

    jobs.forEach(function (job) {
        offerSheet.appendRow(job);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Create 20 Candidates with REAL Scores
    // ═══════════════════════════════════════════════════════════════════════════

    candidateSheet.appendRow([
        "Date", "Nom", "Prénom", "Email", "Téléphone", "Ville",
        "Niveau", "Expérience", "Contrat", "Poste/Cible",
        "Score (%)", "Status IA", "CV Link", "OCR Extract (Snippet)"
    ]);

    // 20 Candidates with varied scores
    var candidates = [
        // ⭐ EXCELLENT MATCHES (85-95%)
        ["30/12/2024", "El Mansouri", "Youssef", "youssef.elmansouri@gmail.com", "0661234567", "Casablanca", "Bac+5", "5 ans", "CDI", "Recommandé: Développeur Applications Bancaires", "92%", "Analysé", "https://drive.google.com/cv1", "Java Spring Developer 5 years experience banking"],
        ["30/12/2024", "Benjelloun", "Sara", "sara.benjelloun@gmail.com", "0662345678", "Casablanca", "Bac+5", "4 ans", "CDI", "Recommandé: Analyste Crédit Bancaire", "88%", "Analysé", "https://drive.google.com/cv2", "Analyste financier crédit risk expert"],
        ["30/12/2024", "Alaoui", "Karim", "karim.alaoui@gmail.com", "0663456789", "Casablanca", "Bac+5", "6 ans", "CDI", "Recommandé: Responsable Conformité Bancaire", "85%", "Analysé", "https://drive.google.com/cv3", "Juriste conformité bancaire LCB-FT"],

        // ⭐ GOOD MATCHES (70-84%)
        ["30/12/2024", "Bouazza", "Ahmed", "ahmed.bouazza@gmail.com", "0664567890", "Casablanca", "Bac+5", "4 ans", "CDI", "Développeur Applications Bancaires", "79%", "Analysé", "https://drive.google.com/cv4", "Full stack developer Java APIs"],
        ["30/12/2024", "Chraibi", "Layla", "layla.chraibi@gmail.com", "0665678901", "Casablanca", "Bac+5", "5 ans", "CDI", "Analyste Crédit Bancaire", "76%", "Analysé", "https://drive.google.com/cv5", "Finance analyst credit scoring"],
        ["30/12/2024", "Bennani", "Mehdi", "mehdi.bennani@gmail.com", "0666789012", "Rabat", "Bac+5", "3 ans", "CDI", "Directeur d'Agence Bancaire", "72%", "Analysé", "https://drive.google.com/cv6", "Manager commercial banque"],
        ["30/12/2024", "Skalli", "Othmane", "othmane.skalli@gmail.com", "0667890123", "Casablanca", "Bac+5", "7 ans", "CDI", "Recommandé: Trésorier Banque", "74%", "Analysé", "https://drive.google.com/cv7", "Trésorier marché financial operations"],

        // ⭐ MEDIUM MATCHES (50-69%)
        ["30/12/2024", "Idrissi", "Nadia", "nadia.idrissi@gmail.com", "0668901234", "Fès", "Bac+5", "4 ans", "CDI", "Recommandé: Développeur Applications Bancaires", "65%", "Analysé", "https://drive.google.com/cv8", "Developer software engineer"],
        ["30/12/2024", "Kettani", "Hamza", "hamza.kettani@gmail.com", "0669012345", "Agadir", "Bac+5", "3 ans", "CDI", "Recommandé: Analyste Risques Financiers", "58%", "Analysé", "https://drive.google.com/cv9", "Risk analyst finance"],
        ["30/12/2024", "Ouazzani", "Salma", "salma.ouazzani@gmail.com", "0670123456", "Oujda", "Bac+3", "2 ans", "CDD", "Recommandé: Conseiller Clientèle Particuliers", "52%", "Analysé", "https://drive.google.com/cv10", "Commercial client advisor"],
        ["30/12/2024", "Senhaji", "Rachid", "rachid.senhaji@gmail.com", "0671234567", "Meknès", "Bac+5", "5 ans", "CDI", "Recommandé: Responsable Opérations Bancaires", "55%", "Analysé", "https://drive.google.com/cv11", "Operations manager back-office"],
        ["30/12/2024", "Guedira", "Asmae", "asmae.guedira@gmail.com", "0672345678", "Tanger", "Bac+5", "4 ans", "CDI", "Recommandé: Chef de Produit Digital Banking", "61%", "Analysé", "https://drive.google.com/cv12", "Product manager digital innovation"],

        // ⭐ LOW MATCHES (30-49%)
        ["30/12/2024", "Filali", "Yassine", "yassine.filali@gmail.com", "0673456789", "Kenitra", "Bac+2", "1 an", "Stage", "Candidature Générale", "35%", "Analysé", "https://drive.google.com/cv13", "Technicien débutant"],
        ["30/12/2024", "Zouaki", "Kenza", "kenza.zouaki@gmail.com", "0674567890", "Rabat", "Bac+3", "0 ans", "Stage", "Candidature Générale", "28%", "Analysé", "https://drive.google.com/cv14", "Étudiante commerce"],
        ["30/12/2024", "Louafi", "Bilal", "bilal.louafi@gmail.com", "0675678901", "Tanger", "Bac", "1 an", "CDD", "Recommandé: Chargé de Recouvrement Bancaire", "32%", "Analysé", "https://drive.google.com/cv15", "Agent polyvalent"],
        ["30/12/2024", "Haddad", "Meryem", "meryem.haddad@gmail.com", "0676789012", "Marrakech", "Bac+2", "0 ans", "Stage", "Candidature Générale", "25%", "Analysé", "https://drive.google.com/cv16", "Stagiaire administration"],

        // ⭐ SENIOR PROFILES (75-90%)
        ["30/12/2024", "Cherkaoui", "Nabil", "nabil.cherkaoui@gmail.com", "0677890123", "Casablanca", "Bac+5", "12 ans", "CDI", "Directeur d'Agence Bancaire", "87%", "Analysé", "https://drive.google.com/cv17", "Directeur expérimenté management banque"],
        ["30/12/2024", "Bensouda", "Houda", "houda.bensouda@gmail.com", "0678901234", "Rabat", "Doctorat", "10 ans", "CDI", "Recommandé: Analyste Risques Financiers", "83%", "Analysé", "https://drive.google.com/cv18", "PhD finance risk modeling expert"],
        ["30/12/2024", "Ait Taleb", "Mohamed", "mohamed.aittaleb@gmail.com", "0679012345", "Casablanca", "Bac+5", "15 ans", "CDI", "Responsable Conformité Bancaire", "91%", "Analysé", "https://drive.google.com/cv19", "Expert conformité réglementaire bancaire"],
        ["30/12/2024", "Erraji", "Samira", "samira.erraji@gmail.com", "0680123456", "Casablanca", "Bac+5", "9 ans", "CDI", "Recommandé: Trésorier Banque", "78%", "Analysé", "https://drive.google.com/cv20", "Trésorière senior ALM market ops"]
    ];

    candidates.forEach(function (cand) {
        candidateSheet.appendRow(cand);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Format Sheets
    // ═══════════════════════════════════════════════════════════════════════════

    // Format Offers header
    offerSheet.getRange(1, 1, 1, 8).setBackground("#1a5276").setFontColor("#ffffff").setFontWeight("bold");
    offerSheet.setFrozenRows(1);

    // Format Candidates header
    candidateSheet.getRange(1, 1, 1, 14).setBackground("#1a5276").setFontColor("#ffffff").setFontWeight("bold");
    candidateSheet.setFrozenRows(1);

    // Auto-resize columns
    for (var i = 1; i <= 8; i++) offerSheet.autoResizeColumn(i);
    for (var i = 1; i <= 14; i++) candidateSheet.autoResizeColumn(i);

    Logger.log("✅ SEED COMPLETE: 10 Jobs + 20 Candidates with varied scores!");

    return "SUCCESS: 10 Jobs + 20 Candidates created!";
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
