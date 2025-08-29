require('dotenv').config();

const { fetchMarkets } = require('./fetch');
const Airtable = require('airtable');
const https = require('https');
const http = require('http');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

async function fetchMetadata(url) {
    if (!url || url === 'N/A' || url === '') return null;
    
    return new Promise((resolve) => {
        const client = url.startsWith('https:') ? https : http;
        const req = client.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.setTimeout(10000);
    });
}

async function fetchResolutionReason(marketId, resolverAddress, resolutionSources, title) {
    try {
        if (!resolutionSources || resolutionSources.length === 0) {
            console.log(`No resolution sources for market ${marketId}`);
            return null;
        }

        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const sources = Array.isArray(resolutionSources) ? resolutionSources : [resolutionSources];
        let resolutionContext = '';

        for (const source of sources.slice(0, 3)) {
            try {
                const https = require('https');
                const http = require('http');
                
                const fetchWebContent = (url) => {
                    return new Promise((resolve) => {
                        const client = url.startsWith('https:') ? https : http;
                        const req = client.get(url, { timeout: 15000 }, (res) => {
                            let data = '';
                            res.on('data', chunk => data += chunk);
                            res.on('end', () => resolve(data.slice(0, 5000)));
                        });
                        req.on('error', () => resolve(''));
                        req.on('timeout', () => { req.destroy(); resolve(''); });
                        req.setTimeout(15000);
                    });
                };

                const content = await fetchWebContent(source);
                if (content) {
                    resolutionContext += `Source: ${source}\nContent: ${content}\n\n`;
                }
            } catch (e) {
                console.log(`Could not fetch source ${source} for market ${marketId}`);
            }
        }

        if (!resolutionContext.trim()) {
            return null;
        }

        const prompt = `Based on the following sources and market information, provide a concise explanation (2-3 sentences max) of why this prediction market was resolved:

Market Title: ${title}
Market ID: ${marketId}

Sources:
${resolutionContext}

Provide a clear, factual reason for the market resolution based on the evidence from the sources.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.1
        });

        return response.choices[0]?.message?.content?.trim() || null;

    } catch (error) {
        console.log(`Could not fetch resolution reason for market ${marketId}:`, error.message);
        return null;
    }
}

async function updateAirtable(markets) {
    try {
        console.log(`Updating ${markets.length} markets...`);
        
        const existingRecords = await base(process.env.AIRTABLE_TABLE_NAME).select().all();
        if (existingRecords.length > 0) {
            for (let i = 0; i < existingRecords.length; i += 10) {
                const batch = existingRecords.slice(i, i + 10);
                await base(process.env.AIRTABLE_TABLE_NAME).destroy(batch.map(r => r.id));
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        
        for (let i = 0; i < markets.length; i += 10) {
            const batch = markets.slice(i, i + 10);
            const records = [];
            
            for (const market of batch) {
                const fields = {
                    'Market ID': market.marketId,
                    'Status': Number(market.status),
                    'Creator': market.creator,
                    'Resolver': market.resolver,
                    'Outcome Count': Number(market.outcomeCount),
                    'Collateral Amount': parseFloat(require('ethers').formatEther(market.collateralAmount)),
                    'Metadata URI': market.metaDataURI,
                    'Block Number': Number(market.blockNumber)
                };

                ['createdAt', 'expiresAt', 'resolvedAt', 'pausedAt'].forEach(dateField => {
                    if (market[dateField] > 0) {
                        const fieldName = dateField.replace(/At$/, '').replace(/^./, c => c.toUpperCase()) + ' Date';
                        fields[fieldName] = new Date(market[dateField] * 1000).toISOString().split('T')[0];
                    }
                });

                const metadata = await fetchMetadata(market.metaDataURI);
                if (metadata) {
                    if (metadata.title) fields['Title'] = metadata.title;
                    if (metadata.description) fields['Description'] = metadata.description;
                    if (metadata.category) fields['Category'] = metadata.category;
                    if (metadata.tags?.length) fields['Tags'] = metadata.tags.join(', ');
                    if (metadata.image_url) fields['Image URL'] = metadata.image_url;
                    if (metadata.rules?.description) fields['Rules Description'] = metadata.rules.description;
                    if (metadata.resolution_sources?.length) fields['Resolution Sources'] = metadata.resolution_sources.join('\n');
                    if (metadata.outcomes?.length) fields['Outcomes'] = metadata.outcomes.map(o => `${o.id}: ${o.title}`).join(', ');
                }

                if (market.resolvedAt > 0) {
                    const resolutionSources = metadata?.resolution_sources;
                    const title = metadata?.title || fields['Title'];
                    const resolutionReason = await fetchResolutionReason(market.marketId, market.resolver, resolutionSources, title);
                    if (resolutionReason) {
                        fields['reason_it_was_resolved'] = resolutionReason;
                    }
                }

                records.push({ fields });
                await new Promise(r => setTimeout(r, 500));
            }
            
            await base(process.env.AIRTABLE_TABLE_NAME).create(records);
            await new Promise(r => setTimeout(r, 1000));
        }
        
        // Update last_synced_at for the first record only
        if (markets.length > 0) {
            console.log('Updating last_synced_at timestamp...');
            const allRecords = await base(process.env.AIRTABLE_TABLE_NAME).select().all();
            if (allRecords.length > 0) {
                const firstRecord = allRecords[0];
                await base(process.env.AIRTABLE_TABLE_NAME).update(firstRecord.id, {
                    'last_synced_at': new Date().toISOString()
                });
                console.log('Updated last_synced_at timestamp');
            }
        }
        
        console.log('Successfully updated Airtable');
    } catch (error) {
        console.error('Airtable error:', error.message);
        throw error;
    }
}

(async () => {
    try {
        console.log('Fetching markets...');
        const markets = await fetchMarkets();
        console.log(`Found ${markets.length} markets`);
        await updateAirtable(markets);
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error.message);
    }
})();