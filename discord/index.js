import {Client, GatewayIntentBits, EmbedBuilder} from 'discord.js'
import dotenv from 'dotenv'

dotenv.config()

// Initialize discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Login into discord bot
export const initDiscord = async () => {
    client.on('ready', async () => {
      console.log(`Discord logged in as ${client.user?.tag}`)
    })
  
    await client.login(process.env.DISCORD_TOKEN)
  
    return client
}

// Send message on discord
export const createPostOnDiscordChannel = async (embedInfo) => {
    try {
      if (!client.isReady()) {
        return
      }
      for(const swap of embedInfo){
        const channelID = process.env.DISCORD_ALERT_CHANNEL_ID;
        const pool = swap.pool
        const user = swap.user
        const userType = swap.userType
        const token = swap.nftMint
        const nftName = swap.nftName
        const price = swap.solTransfer
        const signature = swap.signature
        const action = swap.action
        let path = swap.nftImage
        let embed = await createEmbedSale(nftName, token, price, user, userType, pool, signature, action, path)
        const channel = await client.channels.fetch(channelID)
        await channel.send({ embeds: [embed] });
        
        console.log('Posted on Discord successfully')
      } 
    } catch (error) {
      console.error('Post on discord channel failed ', error)
    }
}

// Create embed for discord message
export const createEmbedSale = async (nftName, token, price, user, userType, pool, signature, action, imagePath) => {
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`${nftName}`)
    .setURL(`https://hyperspace.xyz/token/${token}`)
    .setAuthor({
      name: `New ${action} swap`,
      iconURL: 'https://pbs.twimg.com/profile_images/1562853552816521216/dnNBcFXM_400x400.jpg'
    })
    .addFields(
      {
        name: 'Price',
        value: `${price} S◎L`,
      },
      {
        name: 'Transaction',
        value: `[${signature.substring(0,4)}...${signature.slice(-4)}](https://solscan.io/tx/${signature})`,
      },
      {
        name: 'Pool',
        value: `[${pool.substring(0,4)}...${pool.slice(-4)}](https://solscan.io/account/${pool})`,
        inline: true,
      },
      {
        name: `${userType}`,
        value: `[${user.substring(0,4)}...${user.slice(-4)}](https://solscan.io/account/${user})`,
        inline: true,
      },
    )
    .setImage(imagePath)
    .setTimestamp()
    .setFooter({
      text: `Powered by Hadeswap`,
      iconURL: 'https://pbs.twimg.com/profile_images/1562853552816521216/dnNBcFXM_400x400.jpg',
    })
  return embed  
};

  




