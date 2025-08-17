import Airtable from 'airtable';

interface MarketFilters {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
}

interface Env {
    AIRTABLE_API_KEY: string;
    AIRTABLE_BASE_ID: string;
    AIRTABLE_TABLE_NAME: string;
}

export async function getMarkets({ status, category, search, limit = 10 }: MarketFilters, env: Env) {
    try {
        let filterFormula = '';
        const filters: string[] = [];

        if (status) {
            filters.push(`{Status} = '${status}'`);
        }
        if (category) {
            filters.push(`{Category} = '${category}'`);
        }
        if (search) {
            filters.push(`OR(SEARCH('${search}', {Title}), SEARCH('${search}', {Description}))`);
        }

        if (filters.length > 0) {
            filterFormula = filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`;
        }

        const base = new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(env.AIRTABLE_BASE_ID);
        
        const records = await base(env.AIRTABLE_TABLE_NAME)
            .select({
                maxRecords: limit,
                filterByFormula: filterFormula,
                sort: [{ field: 'Created Date', direction: 'desc' }]
            })
            .all();

        const markets = records.map(record => ({
            marketId: record.fields['Market ID'],
            title: record.fields['Title'] || 'No title',
            description: record.fields['Description'] || 'No description',
            status: record.fields['Status'],
            category: record.fields['Category'] || 'Uncategorized',
            creator: record.fields['Creator'],
            collateralAmount: record.fields['Collateral Amount'],
            createdDate: record.fields['Created Date'],
            expiresDate: record.fields['Expires Date'],
            resolvedDate: record.fields['Resolved Date'],
            outcomes: record.fields['Outcomes'],
            tags: record.fields['Tags']
        }));

        return { markets, count: markets.length };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getMarketDetails({ marketId }: { marketId: string }, env: Env) {
    try {
        const base = new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(env.AIRTABLE_BASE_ID);
        
        const records = await base(env.AIRTABLE_TABLE_NAME)
            .select({
                filterByFormula: `{Market ID} = '${marketId}'`
            })
            .all();

        if (records.length === 0) {
            return { error: `Market with ID ${marketId} not found` };
        }

        const record = records[0];
        const market = {
            marketId: record.fields['Market ID'],
            title: record.fields['Title'],
            description: record.fields['Description'],
            status: record.fields['Status'],
            category: record.fields['Category'],
            creator: record.fields['Creator'],
            resolver: record.fields['Resolver'],
            collateralAmount: record.fields['Collateral Amount'],
            outcomeCount: record.fields['Outcome Count'],
            createdDate: record.fields['Created Date'],
            expiresDate: record.fields['Expires Date'],
            resolvedDate: record.fields['Resolved Date'],
            pausedDate: record.fields['Paused Date'],
            outcomes: record.fields['Outcomes'],
            tags: record.fields['Tags'],
            imageUrl: record.fields['Image URL'],
            rulesDescription: record.fields['Rules Description'],
            resolutionSources: record.fields['Resolution Sources'],
            metadataUri: record.fields['Metadata URI'],
            blockNumber: record.fields['Block Number']
        };

        return { market };
    } catch (error: any) {
        return { error: error.message };
    }
}