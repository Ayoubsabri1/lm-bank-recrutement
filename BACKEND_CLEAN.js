/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏦 LM BANK RECRUITMENT BACKEND - CLEAN VERSION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Features:
 * ✅ Auto-create sheets with correct headers
 * ✅ Specialization matching (+30 points)
 * ✅ Location matching (+20 points)  
 * ✅ Experience & Level bonus (+10 each)
 * ✅ OCR keyword matching
 * 
 * ⚠️ IMPORTANT: Enable "Drive API" in Services!
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════════════════════

var SPREADSHEET_ID = "1EogVYQi260Lf4Ed4jh8Q_nMCcnuTCI0pXozr_RY_Ywc";

function getDatabase() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET MANAGEMENT - Auto-create with correct headers
// ═══════════════════════════════════════════════════════════════════════════════

var OFFERS_HEADERS = ["ID", "Date", "Titre", "Ville", "Contrat", "Niveau", "Experience", "Description"];
var CANDIDATES_HEADERS = ["Date", "Nom", "Prénom", "Email", "Téléphone", "Ville", "Niveau", "Expérience", "Contrat", "Poste/Cible", "Score (%)", "Status IA", "CV Link", "OCR Extract"];

function getOrCreateSheet(ss, sheetName, headers) {
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(headers);
        // Format header row
        sheet.getRange(1, 1, 1, headers.length).setBackground("#1a5276").setFontColor("white").setFontWeight("bold");
        sheet.setFrozenRows(1);
    } else {
        // Verify headers exist
        var firstCell = sheet.getRange(1, 1).getValue();
        if (!firstCell || firstCell !== headers[0]) {
            // Fix headers
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setBackground("#1a5276").setFontColor("white").setFontWeight("bold");
        }
    }

    return sheet;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OCR ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function extractTextFromPDF(fileId) {
    try {
        var blob = DriveApp.getFileById(fileId).getBlob();
        var resource = {
            title: "TempOCR_" + Date.now(),
            mimeType: blob.getContentType()
        };
        var file = Drive.Files.create(resource, blob, { ocr: true });
        var doc = DocumentApp.openById(file.id);
        var text = doc.getBody().getText();
        Drive.Files.remove(file.id);
        return text;
    } catch (e) {
        return "OCR Failed: " + e.message;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE - With Specialization Matching
// ═══════════════════════════════════════════════════════════════════════════════

var SPEC_KEYWORDS = {
    "informatique": ["développeur", "developer", "ingénieur", "système", "réseau", "it", "data", "full stack", "java", "python", "tech", "cloud", "devops"],
    "finance": ["finance", "analyste", "bancaire", "crédit", "risque", "audit", "comptable", "trésorerie"],
    "comptabilité": ["comptable", "comptabilité", "audit", "financier", "trésorerie", "fiscal"],
    "marketing": ["marketing", "communication", "digital", "brand", "média", "social", "community"],
    "rh": ["rh", "ressources humaines", "recrutement", "talent", "personnel", "paie", "formation"],
    "juridique": ["juriste", "droit", "légal", "conformité", "contentieux", "avocat", "compliance"],
    "commerce": ["commercial", "vente", "business", "sales", "client", "compte", "b2b"],
    "gestion": ["gestion", "manager", "directeur", "chef", "responsable", "projet", "coordination"],
    "logistique": ["logistique", "supply", "achat", "transport", "stock", "approvisionnement"]
};

function getLevelScore(levelStr) {
    if (!levelStr) return 0;
    var s = levelStr.toLowerCase();
    if (s.indexOf("doctorat") > -1) return 10;
    if (s.indexOf("bac+5") > -1 || s.indexOf("master") > -1 || s.indexOf("ingénieur") > -1) return 8;
    if (s.indexOf("bac+3") > -1 || s.indexOf("licence") > -1) return 6;
    if (s.indexOf("bac+2") > -1 || s.indexOf("technicien") > -1) return 4;
    return 2;
}

function calculateScore(candidate, job) {
    var score = 0;
    var maxScore = 100;

    var jobTitle = (job.title || "").toLowerCase();
    var jobDesc = (job.desc || "").toLowerCase();
    var jobCity = (job.location || "").toLowerCase().trim();

    var candSpec = (candidate.specialite || "").toLowerCase();
    var candCity = (candidate.ville || "").toLowerCase().trim();
    var candExp = parseInt(candidate.experience) || 0;
    var candLevel = candidate.niveau || "";
    var ocrText = (candidate.ocrText || "").toLowerCase();

    // ─── 1. SPECIALIZATION MATCH (+30 points) ───
    if (candSpec && SPEC_KEYWORDS[candSpec]) {
        var keywords = SPEC_KEYWORDS[candSpec];
        for (var i = 0; i < keywords.length; i++) {
            if (jobTitle.indexOf(keywords[i]) > -1 || jobDesc.indexOf(keywords[i]) > -1) {
                score += 30;
                break;
            }
        }
    }

    // ─── 2. LOCATION MATCH (+20 points) ───
    if (jobCity && candCity) {
        if (jobCity === candCity) {
            score += 20;
        } else if (jobCity.indexOf(candCity) > -1 || candCity.indexOf(jobCity) > -1) {
            score += 15;
        } else if ((candCity === "casa" && jobCity === "casablanca") ||
            (candCity === "casablanca" && jobCity === "casa")) {
            score += 20;
        }
    }

    // ─── 3. EXPERIENCE BONUS (+10 points) ───
    if (candExp > 0) {
        score += 10;
    }

    // ─── 4. LEVEL BONUS (+10 points) ───
    if (getLevelScore(candLevel) >= 6) {
        score += 10;
    }

    // ─── 5. OCR KEYWORD MATCH (+5 per keyword, max 20) ───
    if (ocrText && ocrText.length > 50) {
        var titleWords = jobTitle.split(/\s+/).filter(function (w) { return w.length > 3; });
        var ocrBonus = 0;
        for (var j = 0; j < titleWords.length; j++) {
            if (ocrText.indexOf(titleWords[j]) > -1) {
                ocrBonus += 5;
            }
        }
        score += Math.min(ocrBonus, 20);
    }

    // Cap at 100 and add small variance to prevent ties
    score = Math.min(score, maxScore);
    score += Math.floor(Math.random() * 5);

    return Math.min(score, 99);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN POST HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        var action = data.action;
        var ss = getDatabase();

        // ─── DELETE OFFER ───
        if (action === 'delete_offer') {
            var offerSheet = getOrCreateSheet(ss, "Offres", OFFERS_HEADERS);
            var values = offerSheet.getDataRange().getValues();
            for (var i = 1; i < values.length; i++) {
                if (values[i][0] == data.id) {
                    offerSheet.deleteRow(i + 1);
                    return jsonResponse({ result: "success", message: "Offer deleted" });
                }
            }
            return jsonResponse({ result: "error", message: "Offer not found" });
        }

        // ─── ADD OFFER ───
        if (action === 'add_offer') {
            var offerSheet = getOrCreateSheet(ss, "Offres", OFFERS_HEADERS);
            var newId = "OFF_" + Date.now();
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
            return jsonResponse({ result: "success", offerId: newId });
        }

        // ─── CANDIDATE APPLICATION ───
        if (action === 'candidate' || action === 'spontaneous_application') {
            // Upload CV
            var folder = getOrCreateFolder("CV_Uploads_LMBank");
            var decoded = Utilities.base64Decode(data.cvBase64);
            var blob = Utilities.newBlob(decoded, data.mimeType, data.cvFileName);
            var file = folder.createFile(blob);
            var fileUrl = file.getUrl();
            var fileId = file.getId();

            // OCR
            var ocrText = extractTextFromPDF(fileId);

            // Build candidate object
            var candidate = {
                nom: data.nom,
                prenom: data.prenom,
                email: data.email,
                phone: data.phone,
                ville: data.ville,
                niveau: data.niveau,
                experience: data.experience,
                contrat: data.contrat,
                specialite: data.specialite,
                ocrText: ocrText
            };

            // Get all job offers
            var offerSheet = getOrCreateSheet(ss, "Offres", OFFERS_HEADERS);
            var jobs = [];
            if (offerSheet.getLastRow() > 1) {
                var offerData = offerSheet.getRange(2, 1, offerSheet.getLastRow() - 1, 8).getValues();
                jobs = offerData.map(function (r) {
                    return {
                        id: r[0], date: r[1], title: r[2], location: r[3],
                        contract: r[4], level: r[5], exp: r[6], desc: r[7]
                    };
                });
            }

            // Calculate match
            var matchResult = { score: 0, targetJob: "Aucune offre" };

            if (action === 'candidate') {
                // Specific job application
                var targetJob = null;
                for (var k = 0; k < jobs.length; k++) {
                    if (jobs[k].title.toLowerCase().trim() === data.poste.toLowerCase().trim()) {
                        targetJob = jobs[k];
                        break;
                    }
                }

                if (targetJob) {
                    matchResult = {
                        score: calculateScore(candidate, targetJob),
                        targetJob: data.poste
                    };
                } else {
                    matchResult = { score: 0, targetJob: data.poste + " (Non trouvée)" };
                }
            } else {
                // Spontaneous - find best match
                var bestScore = 0;
                var bestJob = "Candidature Générale";

                for (var m = 0; m < jobs.length; m++) {
                    var s = calculateScore(candidate, jobs[m]);
                    if (s > bestScore) {
                        bestScore = s;
                        bestJob = jobs[m].title;
                    }
                }

                matchResult = {
                    score: bestScore,
                    targetJob: "Recommandé: " + bestJob
                };
            }

            // Save to database
            var candidateSheet = getOrCreateSheet(ss, "All_Candidats", CANDIDATES_HEADERS);
            candidateSheet.appendRow([
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
                matchResult.score + "%",
                "Analysé",
                fileUrl,
                ocrText.substring(0, 500)
            ]);

            return jsonResponse({
                result: "success",
                score: matchResult.score,
                recommendation: matchResult.targetJob
            });
        }

        return jsonResponse({ result: "error", message: "Unknown action" });

    } catch (error) {
        return jsonResponse({ result: "error", message: error.toString() });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

function doGet(e) {
    var ss = getDatabase();
    var action = e.parameter.action;

    if (action === 'getOffers') {
        var sheet = getOrCreateSheet(ss, "Offres", OFFERS_HEADERS);
        if (sheet.getLastRow() <= 1) {
            return jsonResponse([]);
        }
        var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
        var result = rows.map(function (r) {
            return {
                id: r[0], date: r[1], title: r[2], location: r[3],
                contract: r[4], level: r[5], exp: r[6], desc: r[7]
            };
        });
        return jsonResponse(result);
    }

    if (action === 'getCandidates') {
        var sheet = getOrCreateSheet(ss, "All_Candidats", CANDIDATES_HEADERS);
        if (sheet.getLastRow() <= 1) {
            return jsonResponse([]);
        }
        var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
        var result = rows.filter(function (r) { return r[0]; }).map(function (r) {
            return {
                date: r[0], nom: r[1], prenom: r[2], email: r[3],
                phone: r[4], ville: r[5], niveau: r[6], exp: r[7],
                contrat: r[8], job: r[9], score: parseInt(r[10]) || 0,
                status: r[11], cv: r[12], ocr: r[13]
            };
        });
        result.sort(function (a, b) { return b.score - a.score; });
        return jsonResponse(result);
    }

    return jsonResponse([]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(folderName) {
    var folders = DriveApp.getFoldersByName(folderName);
    return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}
