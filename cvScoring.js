function evaluateCandidate(candidate, criteria) {
    const totalWeight = criteria.reduce(
        (sum, c) => sum + c.weight, 0
    );

    if (totalWeight !== 100) {
        throw new Error('La somme des poids doit être égale à 100%.');
    }

    let totalScore = 0;
    let results = [];

    for (const criterion of criteria) {
        const score = candidate.scores?.[criterion.name];

        if (typeof score !== 'number' || score < 0 || score > 100) {
            throw new Error(
                `Score invalide ou manquant : ${criterion.name}`
            );
        }

        const weightedScore = score * criterion.weight / 100;
        const passed = score >= criterion.minimum;

        totalScore += weightedScore;

        results.push({
            criterion: criterion.name,
            score,
            weight: criterion.weight,
            minimum: criterion.minimum,
            passed,
            weightedScore: Number(weightedScore.toFixed(2))
        });
    }

    return {
        candidate: candidate.name,
        totalScore: Number(totalScore.toFixed(2)),
        passedAllMinimums: results.every(r => r.passed),
        results
    };
}

function rankCandidates(candidates, criteria) {
    return candidates
        .map(candidate => evaluateCandidate(candidate, criteria))
        .sort((a, b) => {
            if (a.passedAllMinimums !== b.passedAllMinimums) {
                return Number(b.passedAllMinimums) -
                       Number(a.passedAllMinimums);
            }
            return b.totalScore - a.totalScore;
        });
}

module.exports = { evaluateCandidate, rankCandidates };
