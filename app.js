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

                records.push({ fields });
                await new Promise(r => setTimeout(r, 500));
            }
            
            await base(process.env.AIRTABLE_TABLE_NAME).create(records);
            await new Promise(r => setTimeout(r, 1000));
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