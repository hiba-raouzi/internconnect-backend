const { extractPdfText } = require('./cvExtractor');

function normalize(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[’']/g, ' ')
        .replace(/[^a-z0-9+#. ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function analyzeCV(filePath, candidateName, criteria) {
    const text = await extractPdfText(filePath);
    const normalizedText = normalize(text);

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    if (totalWeight !== 100) {
        throw new Error('La somme des poids doit être égale à 100%.');
    }

    const results = criteria.map(criterion => {
        const keywords = criterion.keywords || [];

        const matched = keywords.filter(keyword =>
            normalizedText.includes(normalize(keyword))
        );

        const score = keywords.length
            ? Math.round(matched.length / keywords.length * 100)
            : 0;

        return {
            criterion: criterion.name,
            category: criterion.category || 'Non précisée',
            score,
            weight: criterion.weight,
            minimum: criterion.minimum,
            matchedKeywords: matched,
            missingKeywords: keywords.filter(k => !matched.includes(k)),
            passed: score >= criterion.minimum
        };
    });

    const totalScore = results.reduce(
        (sum, result) => sum + result.score * result.weight / 100,
        0
    );

    return {
        candidate: candidateName,
        totalScore: Number(totalScore.toFixed(2)),
        passedAllMinimums: results.every(r => r.passed),
        results
    };
}

async function rankCVs(candidates, criteria) {
    const results = [];

    for (const candidate of candidates) {
        results.push(
            await analyzeCV(candidate.filePath, candidate.name, criteria)
        );
    }

    return results.sort((a, b) =>
        Number(b.passedAllMinimums) - Number(a.passedAllMinimums)
        || b.totalScore - a.totalScore
    );
}

module.exports = { analyzeCV, rankCVs };
