#!/usr/bin/env node

const fs = require('fs');

const FEATURE_MODEL = 'Xenova/all-MiniLM-L6-v2';

/**
 * @typedef {number[]} vector
 */

/**
 * Encodes an array of strings into an array of vectors.
 * @param {string[]} input - An array of strings to be encoded.
 * @param {string} [model] - An optional embedding model for the encoding.
 * @returns {vector[]} - The resulting array of vectors after encoding.
 */
const encode = async (input, model = FEATURE_MODEL) => {
    const transformers = await import('@huggingface/transformers');
    const { pipeline } = transformers;
    const extractor = await pipeline('feature-extraction', model, { quantized: true, dtype: 'q8' });

    const vectors = [];
    for (let index = 0; index < input.length; ++index) {
        const sentence = input[index];
        const output = await extractor([sentence], { pooling: 'mean', normalize: true });
        const vector = output[0].data;
        vectors.push(vector);
    }

    return vectors;
}


/**
 * Calculates cosine similarity of two vectors.
 * @param {vector} p - First vector.
 * @param {vector} q - Second vector.
 * @returns {number} Similarity (0 for none, 1 for exact).
 */
const sim = (p, q) => {
    let product = 0;
    let mA = 0;
    let mB = 0;
    for (let i = 0; i < p.length; i++) {
        product += p[i] * q[i];
        mA += p[i] * p[i];
        mB += q[i] * q[i];
    }
    return product / (Math.sqrt(mA) * Math.sqrt(mB));
}

/**
 * Searches for vectors that are similar to the given query.
 * @param {vector[]} vectors - An array of vectors to be searched.
 * @param {string} query - The text for which similarity is to be searched.
 * @param {number} [top_k] - Optional, returns top-k matches.
 * @returns {number[]} - Array of matching vector indexes.
 */
const search = async (vectors, query, top_k = 3) => {
    const refs = await encode([query]);
    const ref = refs.shift();
    const scores = vectors.map((vector, index) => {
        const similarity = sim(vector, ref);
        return { index, similarity };
    });
    return scores.sort((p, q) => q.similarity - p.similarity).slice(0, top_k);
}


(async () => {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage: text-search document query');
        process.exit(-1);
    }
    const filename = args[0];
    const query = args[1];

    const document = fs.readFileSync(filename, 'utf-8');
    const sentences = document.split('\n')
        .map(line => line.trim())
        .filter(line => line.trim().length > 0);

    console.log(`Encoding (${sentences.length} sentences). Please wait...`);
    const start = Date.now();
    const vectors = await encode(sentences);
    const elapsed = Date.now() - start;
    console.log('Finished encoding in', elapsed, 'ms');
    console.log();

    console.log('Searching for', query);
    const matches = await search(vectors, query);
    console.log();

    matches.map(match => {
        const { index, similarity } = match;
        const sentence = sentences[index];
        const score = Math.round(similarity * 100);
        console.log(`Line #${index + 1} (${score}%): ${sentence}`);
    });
})();
