import { TwitterApi} from 'twitter-api-v2';
import { downloadImage, removeImage, generateImagePath } from './image.js';
import dotenv from 'dotenv'

dotenv.config()

// Init twitter bot
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_appKey,
    appSecret: process.env.TWITTER_appSecret,
    accessToken: process.env.TWITTER_accessToken,
    accessSecret: process.env.TWITTER_accessSecret,
});

// Create and send tweet
export async function createAndSendTweet(tweetInfo){
    let tweet = ''
    let mediaId = ''
    let tweetSend = false
    for(const swap of tweetInfo){
        const pool = swap.pool;
        const user = swap.user;
        const userType = swap.userType;
        const token = swap.nftMint;
        const nftName = swap.nftName;
        const price = swap.solTransfer;
        const signature = swap.signature;
        const action = swap.action;
        const nftImageUrl = swap.nftImage;
        await downloadImage(nftImageUrl, token);
        let path = generateImagePath(token);
        mediaId = await twitterClient.v1.uploadMedia(path);
        tweet = `New ${action} swap!!\n\n🖼NFT: ${nftName}\n\n🤑Price: ${price} SOL\n\n💱 Pool: https://solscan.io/account/${pool}\n\n🤝 ${userType}: https://solscan.io/account/${user}\n\n🕵🏻‍♂️ Proof: https://solscan.io/tx/${signature}`
        try{
            await twitterClient.v1.tweet(tweet, { media_ids: mediaId });
        }catch(error){
            console.log(error)
        }
        removeImage(token, 10000)
        tweetSend = true
    }
    
    return tweetSend
};