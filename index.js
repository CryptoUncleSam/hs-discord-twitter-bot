import {web3} from '@project-serum/anchor';
import {txInfo} from "./helpers/index.js";
import { createAndSendTweet } from "./twitter/index.js";
import { initDiscord, createPostOnDiscordChannel } from "./discord/index.js"
import dotenv from 'dotenv'

dotenv.config()

// Connect to solana RPC
const conn = new web3.Connection(process.env.RPC_ENDPOINT, 'confirmed');

// Start discord bot
await initDiscord();

// Wallet to subscribe
const hadeRoyalties = new web3.PublicKey('My11111111111111111111111111111111111111111');

// Variables for check Twitter Rate Limit
let startTime = Date.now()
let nextReset = startTime+(3600000*3)
let tweetCount = 0

// Subscribe to wallet
conn.onLogs(
    hadeRoyalties,
    async (info, context) =>{
        console.log(info.signature)
        try{
            let infoCurated = []
            // Check if tx have errors
            let notSale = info.logs.find(a =>{
                if(a.includes('Program returned error: custom program error: 0x1794')){
                    return true
                };
                if(a.includes('Program returned error: custom program error: 0x1')){
                    return true
                };
            });
            // Process tx if not error
            if(notSale){

            }else{
                let sig = info.signature
                let tx = await conn.getParsedTransaction(sig, {'commitment': 'confirmed','maxSupportedTransactionVersion': 1});
                if(tx != null && tx.meta.err===null){
                    infoCurated = await txInfo(tx, sig)
                }
            }
            console.log(infoCurated)
            // Send message on Discord
            await createPostOnDiscordChannel(infoCurated)
            // Send Tweet
            let wasSent = await createAndSendTweet(infoCurated) 
            if (wasSent){
                tweetCount++
            }
            // Check Twitter rate-limit send 300 tweets per 3h (ELEVATED-API)
            let timeNow = Date.now()
            console.log(`
                Tweet count: ${tweetCount}
                Time Reset: ${nextReset}
                Current Time: ${timeNow}`
            )
            if(timeNow>=nextReset){
                nextReset = timeNow+(3600000*3)
                tweetCount = 0
            }
            if(tweetCount>=300 && timeNow<nextReset){
                console.log(`Rate Limit Reach. Waiting ${nextReset-timeNow}`)
                await sleep(nextReset-timeNow)
                startTime = Date.now()
                nextReset = startTime+(3600000*3)
                tweetCount = 0
            }
        }catch(error){
            console.log(error)
            console.log(info.signature)
        }
    }
);