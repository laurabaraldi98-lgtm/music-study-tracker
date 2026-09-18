function calculateTrendSlope(months) {
    const validMonths = months.filter(
        month => month.accuracy != null && !month.isPartial
    );

    if (validMonths.length < 2) {
        return null;
    }

    const points = validMonths.map((month, index) => ({
        x: index,
        y: month.accuracy
    }));

    const count = points.length;

    const sumX = points.reduce(
        (sum, point) => sum + point.x,
        0
    );

    const sumY = points.reduce(
        (sum, point) => sum + point.y,
        0
    );

    const sumXY = points.reduce(
        (sum, point) => sum + point.x * point.y,
        0
    );

    const sumXX = points.reduce(
        (sum, point) => sum + point.x * point.x,
        0
    );

    const denominator =
        count * sumXX -
        sumX * sumX;

    const slope =
        (
            count * sumXY -
            sumX * sumY
        ) / denominator;

    return Number(slope.toFixed(1));
}

function calculatePracticeInsights({ months, categories }) {
    let best;
    let improvement;

    if (categories.length === 0) {
        best = {
            categories: [],
            accuracy: null
        };

        improvement = {
            categories: [],
            accuracy: null,
            allEqual: false
        };
    } else {
        const accuracies = categories.map(
            category => category.accuracy
        );

        const bestAccuracy = Math.max(...accuracies);
        const worstAccuracy = Math.min(...accuracies);

        const bestCategories = categories
            .filter(category => category.accuracy === bestAccuracy)
            .map(category => category.name);

        const worstCategories = categories
            .filter(category => category.accuracy === worstAccuracy)
            .map(category => category.name);

        best = {
            categories: bestCategories,
            accuracy: bestAccuracy
        };

        improvement = {
            categories: worstCategories,
            accuracy: worstAccuracy,
            allEqual: bestAccuracy === worstAccuracy
        };
    }

    const slope = calculateTrendSlope(months);

    let direction;

    if (slope == null) {
        direction = "insufficient";
    } else if (slope > 0) {
        direction = "up";
    } else if (slope < 0) {
        direction = "down";
    } else {
        direction = "stable";
    }

    return {
        best,
        improvement,
        trend: {
            direction,
            slope
        }
    };
}

module.exports = {
    calculateTrendSlope,
    calculatePracticeInsights
};