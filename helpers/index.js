import {web3} from '@project-serum/anchor';
import { Metaplex } from '@metaplex-foundation/js';
import dotenv from 'dotenv'

dotenv.config()

// Connect to Solana RPC
const conn = new web3.Connection(process.env.RPC_ENDPOINT, 'confirmed');
// Init metaplex sdk 
const metaplex = new Metaplex(conn);

// Parse info from tx for tweet & discord message
export async function txInfo(tx, signature){
    let loop = 0;
    let swapArray = [];
    let typeArray = [];
    for(const log of tx.meta.logMessages){
        if(log==='Program log: Instruction: SellNftToLiquidityPair'){
            typeArray.push(log)
        }else if(log==='Program log: Instruction: SellNftToTokenToNftPair'){
            typeArray.push(log)
        }else if(log==='Program log: Instruction: BuyNftFromPair'){
            typeArray.push(log)
        }
    };
    try{
        for(const inst of tx.transaction.message.instructions){
            let side = getSide(typeArray[loop])
            let swapPool = inst.accounts[side.swapPoolIndex];
            let user = inst.accounts[side.userIndex];
            let nftMint = inst.accounts[side.nftMintIndex];
            let solTransfer = 0;
            for(const innerInst of tx.meta.innerInstructions[loop].instructions){
                if(innerInst.parsed.type==='transfer' && innerInst.program==='system'){
                    solTransfer = solTransfer + (innerInst.parsed.info.lamports/web3.LAMPORTS_PER_SOL);
                };
            };
            let metadata = await metaplex.nfts().findByMint({mintAddress: nftMint}).run(); 
            let info = {
                pool: swapPool.toBase58(),
                user: user.toBase58(),
                nftMint: nftMint.toBase58(),
                nftName: metadata.name || 'NFT',
                nftImage: metadata.json.image || '',
                solTransfer: Number(solTransfer.toFixed(3)),
                signature: signature,
                userType: side.userType,
                action: side.action
            };
            swapArray.push(info);
            loop++;
        };
    }catch(err){console.log(err)}
    
    return swapArray
}

// Get side of swap
function getSide(type){
    let swapPoolIndex = 0;
    let userIndex = 0;
    let nftMintIndex = 0;
    let userType = '';
    let action = '';
    if(type==='Program log: Instruction: BuyNftFromPair'){
        swapPoolIndex = 1;
        userIndex = 2;
        nftMintIndex = 6;
        userType = 'Buyer';
        action = 'buy';
    }else if(type==='Program log: Instruction: SellNftToLiquidityPair'){
        swapPoolIndex = 1;
        userIndex = 3;
        nftMintIndex = 4;
        userType = 'Seller';
        action = 'sell';
    }else if(type==='Program log: Instruction: SellNftToTokenToNftPair'){
        swapPoolIndex = 0;
        userIndex = 2;
        nftMintIndex = 3;
        userType = 'Seller';
        action = 'sell';
    };
    let side = {
        swapPoolIndex: swapPoolIndex,
        userIndex: userIndex,
        nftMintIndex: nftMintIndex,
        userType: userType,
        action: action
    }
    return side
}