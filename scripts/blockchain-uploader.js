// D:\hardhat_resave\my-hardhat-project3\scripts\blockchain-uploader.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { contractAddress, privateKey, abiPaths, rpcUrl } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadHashes = async (hashes) => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  
  const abiPath = path.resolve(__dirname, abiPaths.myToken);
  const contractArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);

  const results = [];
  for (const hash of hashes) {
    try {
      const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}`;
      const exists = await contract.isImageHashActive(formattedHash);
      
      if (exists) {
        results.push({ originalHash: hash, formattedHash, status: 'exists' });
        continue;
      }

      const tx = await contract.uploadImageHash(formattedHash);
      const receipt = await tx.wait();
      
      results.push({
        originalHash: hash,
        formattedHash,
        status: 'success',
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });
    } catch (error) {
      results.push({ originalHash: hash, status: 'error', error: error.message });
    }
  }
  return results;
};