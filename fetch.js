const { ethers } = require('ethers');
const fs = require('fs');

const CONFIG = {
    RPC_URL: 'https://testnet-rpc-1.xo.market/',
    CONTRACT_ADDRESS: '0x3cf19D0C88a14477DCaA0A45f4AF149a4C917523',
};

const CONTRACT_ABI = JSON.parse(fs.readFileSync('./abi.json', 'utf8')).abi;

const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, provider);

async function fetchEvents() {
    const filter = contract.filters.MarketCreated();
    let toBlock = await provider.getBlockNumber();
    const totalRange = toBlock;
    // less than 100k to not hit the limit
    const chunkSize = 90000;
    
    if (totalRange <= chunkSize) {
        return await contract.queryFilter(filter, 0, toBlock);
    }
    
    let allEvents = [];
    const chunks = Math.ceil(totalRange / chunkSize);
    
    for (let i = 0; i < chunks; i++) {
        const chunkFrom =  (i * chunkSize);
        const chunkTo = Math.min(chunkFrom + chunkSize - 1, toBlock);
        
        try {
            const events = await contract.queryFilter(filter, chunkFrom, chunkTo);
            allEvents = allEvents.concat(events);
            if (i < chunks - 1) await new Promise(r => setTimeout(r, 200));
        } catch (e) { continue; }
    }
    
    return allEvents;
}

async function getMarketDetails(marketId) {
    try {
        const extended = (await contract.getExtendedMarket(marketId)).market;
        return {
            status: extended.status,
            resolver: extended.resolver,
            winningOutcome: extended.winningOutcome.toString(),
            createdAt: Number(extended.createdAt),
            resolvedAt: Number(extended.resolvedAt),
            pausedAt: Number(extended.pausedAt),
            collateralAmount: extended.collateralAmount.toString()
        };
    } catch (e) { return null; }
}

async function fetchMarketResolutionReason(marketId, resolverAddress) {
    try {
        const filter = contract.filters.MarketResolved(marketId);
        const events = await contract.queryFilter(filter);
        
        if (events.length === 0) return null;
        
        const resolvedEvent = events[events.length - 1];
        
        if (resolvedEvent.args && resolvedEvent.args.reason) {
            return resolvedEvent.args.reason;
        }
        
        const tx = await provider.getTransaction(resolvedEvent.transactionHash);
        if (tx && tx.data) {
            try {
                const decodedData = contract.interface.parseTransaction({ data: tx.data, value: tx.value });
                if (decodedData.args && decodedData.args.reason) {
                    return decodedData.args.reason;
                }
            } catch (e) {
                console.log(`Could not decode transaction data for market ${marketId}`);
            }
        }
        
        const blockNumber = resolvedEvent.blockNumber;
        const block = await provider.getBlock(blockNumber);
        return `Market resolved at block ${blockNumber} on ${new Date(block.timestamp * 1000).toISOString()}`;
        
    } catch (error) {
        console.log(`Error fetching resolution reason for market ${marketId}:`, error.message);
        return null;
    }
}

async function fetchMarkets() {
    const events = await fetchEvents();
    const results = [];
    
    for (const event of events) {
        const details = await getMarketDetails(event.args.marketId);
        if (details) {
            results.push({
                marketId: event.args.marketId.toString(),
                creator: event.args.creator,
                expiresAt: Number(event.args.expiresAt),
                outcomeCount: Number(event.args.outcomeCount),
                metaDataURI: event.args.metaDataURI,
                blockNumber: event.blockNumber,
                ...details
            });
        }
        await new Promise(r => setTimeout(r, 100));
    }
    
    return results;
}

module.exports = { fetchMarkets, fetchMarketResolutionReason };