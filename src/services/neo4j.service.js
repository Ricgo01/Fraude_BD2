const neo4j = require('neo4j-driver')

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
)

/**
 * Normalizes Neo4j properties (e.g. converting BigInt to JS Number safely)
 */
function normalizeNeo4jProperties(obj) {
    if (!obj) return obj;
    if (neo4j.isInt(obj)) {
        return obj.toNumber();
    }
    if (Array.isArray(obj)) {
        return obj.map(item => normalizeNeo4jProperties(item));
    }
    if (typeof obj === 'object') {
        const result = {};
        for (const key in obj) {
            result[key] = normalizeNeo4jProperties(obj[key]);
        }
        return result;
    }
    return obj;
}

module.exports = driver
module.exports.normalizeNeo4jProperties = normalizeNeo4jProperties