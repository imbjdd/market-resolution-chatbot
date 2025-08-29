import Airtable from 'airtable';
import Fuse from 'fuse.js';

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

        const base = new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(env.AIRTABLE_BASE_ID);
        
        let records;
        
        if (search) {
            const marketMatch = search.match(/market\s*(\d+)/i);
            const justNumber = /^\d+$/.test(search);
            
            if (marketMatch || justNumber) {
                const number = marketMatch ? marketMatch[1] : search;
                const searchFormula = `OR({Market ID} = '${number}', SEARCH('${search}', {Title}), SEARCH('${search}', {Description}))`;
                
                if (filters.length > 0) {
                    filterFormula = `AND(${filters.join(', ')}, ${searchFormula})`;
                } else {
                    filterFormula = searchFormula;
                }
                
                records = await base(env.AIRTABLE_TABLE_NAME)
                    .select({
                        maxRecords: limit,
                        filterByFormula: filterFormula,
                        sort: [{ field: 'Created Date', direction: 'desc' }]
                    })
                    .all();
            } else {
                if (filters.length > 0) {
                    filterFormula = filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`;
                }
                
                const selectOptions: any = {
                    maxRecords: 1000,
                    sort: [{ field: 'Created Date', direction: 'desc' }]
                };
                
                if (filterFormula) {
                    selectOptions.filterByFormula = filterFormula;
                }
                
                records = await base(env.AIRTABLE_TABLE_NAME)
                    .select(selectOptions)
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
                    tags: record.fields['Tags'],
                    reasonItWasResolved: record.fields['reason_it_was_resolved']
                }));

                const fuse = new Fuse(markets, {
                    keys: ['title', 'description'],
                    threshold: 0.3,
                    includeScore: true
                });

                const fuzzyResults = fuse.search(search);
                const filteredMarkets = fuzzyResults.map(result => result.item).slice(0, limit);
                
                return { markets: filteredMarkets, count: filteredMarkets.length };
            }
        } else {
            if (filters.length > 0) {
                filterFormula = filters.length === 1 ? filters[0] : `AND(${filters.join(', ')})`;
            }

            const selectOptions: any = {
                maxRecords: limit,
                sort: [{ field: 'Created Date', direction: 'desc' }]
            };
            
            if (filterFormula) {
                selectOptions.filterByFormula = filterFormula;
            }

            records = await base(env.AIRTABLE_TABLE_NAME)
                .select(selectOptions)
                .all();
        }

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
            tags: record.fields['Tags'],
            reasonItWasResolved: record.fields['reason_it_was_resolved']
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
            blockNumber: record.fields['Block Number'],
            reasonItWasResolved: record.fields['reason_it_was_resolved']
        };

        return { market };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getAllMarketTitles(env: Env) {
    try {
        const base = new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(env.AIRTABLE_BASE_ID);
        
        const records = await base(env.AIRTABLE_TABLE_NAME)
            .select({
                fields: ['Market ID', 'Title', 'Status', 'Resolved Date']
            })
            .all();

        const markets = records.map(record => ({
            marketId: record.fields['Market ID'],
            title: record.fields['Title'] || 'No title',
            status: record.fields['Status'],
            resolvedDate: record.fields['Resolved Date']
        }));

        return { markets };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getResolutionReason({ marketId }: { marketId: string }, env: Env) {
    try {
        const base = new Airtable({ apiKey: env.AIRTABLE_API_KEY }).base(env.AIRTABLE_BASE_ID);
        
        const records = await base(env.AIRTABLE_TABLE_NAME)
            .select({
                filterByFormula: `{Market ID} = '${marketId}'`,
                fields: ['Market ID', 'Title', 'reason_it_was_resolved', 'Resolved Date', 'Status']
            })
            .all();

        if (records.length === 0) {
            return { error: `Market with ID ${marketId} not found` };
        }

        const record = records[0];
        return {
            marketId: record.fields['Market ID'],
            title: record.fields['Title'],
            reasonItWasResolved: record.fields['reason_it_was_resolved'],
            resolvedDate: record.fields['Resolved Date'],
            status: record.fields['Status']
        };
    } catch (error: any) {
        return { error: error.message };
    }
}