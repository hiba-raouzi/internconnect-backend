const express = require('express');
const path = require('path');
const fs = require('fs');

const { extractPdfText } = require('./cvExtractor');
const { rankCandidates } = require('./cvScoring');
const { rankCVs } = require('./cvAnalyzer');

const router = express.Router();

// Classement avec scores fournis
router.post('/test-scoring', (req, res) => {
    try {
        const { candidates, criteria } = req.body;

        if (!Array.isArray(candidates) || !Array.isArray(criteria)) {
            return res.status(400).json({
                message: 'Candidates et criteria doivent être des tableaux'
            });
        }

        const results = rankCandidates(candidates, criteria);

        res.json({
            message: 'Classement effectué',
            results
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Analyse automatique des CV PDF
router.post('/analyze', async (req, res) => {
    try {
        const { candidates, criteria } = req.body;

        if (!Array.isArray(candidates) || !Array.isArray(criteria)) {
            return res.status(400).json({
                message: 'Candidates et criteria doivent être des tableaux'
            });
        }

        if (candidates.length === 0 || criteria.length === 0) {
            return res.status(400).json({
                message: 'Ajoutez au moins un candidat et un critère'
            });
        }

        const safeCandidates = candidates.map(candidate => {
            if (
                !candidate.name ||
                !candidate.filename ||
                path.basename(candidate.filename) !== candidate.filename ||
                !candidate.filename.toLowerCase().endsWith('.pdf')
            ) {
                throw new Error('Nom ou fichier PDF invalide');
            }

            const filePath = path.join(
                __dirname,
                'cv-examples',
                candidate.filename
            );

            if (!fs.existsSync(filePath)) {
                throw new Error('CV introuvable : ' + candidate.filename);
            }

            return {
                name: candidate.name,
                filePath
            };
        });

        const results = await rankCVs(safeCandidates, criteria);

        res.json({
            message: 'Analyse automatique terminée',
            totalCandidates: results.length,
            results
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
