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
