import { createWriteStream} from 'fs';
import * as path from 'path';
import axios from "axios";
import { unlink as removeFile} from 'fs/promises'

// Download NFT image for tweet
export async function downloadImage(nftUrl, fileName) {  
  const url = nftUrl
  let path = generateImagePath(fileName)
  const writer = createWriteStream(path)

  const response = await axios.get(url, {responseType: 'stream'});

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

// Delete NFT image
export async function removeImage(fileName, delay = 0){
  try {
    await new Promise((resolve) => setTimeout(resolve, delay))
    await removeFile(generateImagePath(fileName))

  } catch (error) {
    console.error('Error removing card', error)
  }
}

// Generate image path
export function generateImagePath(fileName){
  const path_ = path.resolve('images', `${fileName}.png`)
  return path_
}
