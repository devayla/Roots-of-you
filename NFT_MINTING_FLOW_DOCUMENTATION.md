# NFT Minting Flow - Complete A to Z Documentation

## 📦 IPFS Packages Used

### Package.json Dependencies:
1. **`@pinata/sdk`** (v2.1.0) - Primary Pinata SDK for IPFS uploads
   - Used in: `app/api/generate-image/route.ts`
   - Functions: `pinFileToIPFS()`, `pinJSONToIPFS()`

2. **`pinata`** (v2.5.1) - Alternative Pinata SDK (newer version)
   - Used in: `app/api/upload-share-image/route.ts`
   - Functions: `pinata.upload.public.file()`

**Note**: The project uses TWO different Pinata packages:
- `@pinata/sdk` (older, uses API key/secret)
- `pinata` (newer, uses JWT token)

---

## 🔄 Complete NFT Minting Flow (Step-by-Step)

### **PHASE 1: Image Generation & IPFS Upload**

#### Step 1: User Triggers Image Generation
**Location**: `components/Home/ImageGenerator.tsx` (line ~263-398)

```typescript
// User clicks "Generate" button
const { mutate: generateImage } = useMutation({
  mutationFn: async () => {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      body: JSON.stringify({ fid, forceRegenerate: false }),
    })
    return await response.json()
  }
})
```

**What happens:**
- Frontend sends POST request to `/api/generate-image`
- Includes `fid` (Farcaster ID) from user context
- Shows progress indicators during generation

---

#### Step 2: Backend Receives Request & Checks Cache
**Location**: `app/api/generate-image/route.ts` (line ~89-141)

**Process:**
1. **Database Check**: Queries MongoDB for existing user image
   ```typescript
   const existingUser = await UserImage.findOne({ fid })
   ```
2. **Cache Return**: If exists and has metadata, returns cached data immediately
   ```typescript
   if (existingUser && existingUser.metadataIpfsUrl) {
     return Response.json({
       imageUrl: existingUser.ipfsUrl,
       metadataIpfsUrl: existingUser.metadataIpfsUrl,
       fromCache: true
     })
   }
   ```

---

#### Step 3: Fetch User Profile Picture (PFP)
**Location**: `app/api/generate-image/route.ts` (line ~285-328)

**Process:**
1. **Fetch PFP**: Downloads user's profile picture from Farcaster
   ```typescript
   const pfpResponse = await fetch(pfpUrl, { 
     signal: AbortSignal.timeout(30000) 
   })
   pfpBuffer = Buffer.from(await pfpResponse.arrayBuffer())
   ```

2. **Resize Image**: Uses `sharp` library to resize to 1024x1024
   ```typescript
   const resizedPfpBuffer = await sharp(pfpBuffer)
     .resize(1024, 1024, { fit: 'cover', position: 'center' })
     .png()
     .toBuffer()
   ```

3. **Convert to Base64**: Converts for AI model input
   ```typescript
   pfpBase64 = resizedPfpBuffer.toString('base64')
   ```

---

#### Step 4: Generate NFT Image with AI
**Location**: `app/api/generate-image/route.ts` (line ~450-500)

**Process:**
1. **Initialize Google Gemini AI**:
   ```typescript
   const genAI = new GoogleGenerativeAI(apiKey)
   const imageModel = genAI.getGenerativeModel({
     model: 'gemini-2.5-flash-image'
   })
   ```

2. **Generate Image**:
   ```typescript
   result = await imageModel.generateContent([
     finalPrompt, // Detailed prompt for Azuki-style character
     { inlineData: { mimeType: 'image/png', data: pfpBase64 } }
   ])
   ```

3. **Extract Image Data**:
   ```typescript
   // Extract base64 image from response
   generatedImageData = part.inlineData.data
   // Extract text description (traits JSON)
   textDescription = part.text
   ```

---

#### Step 5: Upload Generated Image to IPFS
**Location**: `app/api/generate-image/route.ts` (line ~635-658)

**Process:**
1. **Initialize Pinata SDK**:
   ```typescript
   const { apiKey, secretKey } = getRandomPinataKey() // Load balancing
   const pinata = new PinataSDK(pinataApiKey, pinataSecretApiKey)
   ```

2. **Convert to Stream**:
   ```typescript
   const imageBuffer = Buffer.from(generatedImageData, 'base64')
   const imageStream = Readable.from(imageBuffer)
   ```

3. **Upload to IPFS**:
   ```typescript
   imageUploadResult = await pinata.pinFileToIPFS(imageStream, {
     pinataMetadata: { name: `pixel-character-${fid}.png` }
   })
   ```

4. **Get CID & Gateway URL**:
   ```typescript
   const imageCid = imageUploadResult.IpfsHash
   const ipfsGatewayUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${imageCid}`
   ```

**Key Function**: `pinata.pinFileToIPFS(stream, options)`
- **Input**: Readable stream of image buffer
- **Output**: `{ IpfsHash: string }` - The CID (Content Identifier)
- **Returns**: IPFS hash that uniquely identifies the image

---

#### Step 6: Create NFT Metadata JSON
**Location**: `app/api/generate-image/route.ts` (line ~663-683)

**Process:**
1. **Parse Traits**: Extract traits from AI-generated description
   ```typescript
   traits = {
     background: "Soft Pink",
     body_color: "Fair",
     eyes: "Brown Calm",
     hair: "Blonde Short",
     // ... etc
   }
   ```

2. **Create Metadata Object**:
   ```typescript
   const metadata = {
     name: `FID Azuki #${fid}`,
     description: `An FID Azuki creature...`,
     image: ipfsGatewayUrl, // Image IPFS URL
     attributes: [
       { trait_type: 'Background', value: traits.background },
       { trait_type: 'Body Color', value: traits.body_color },
       // ... all traits
     ],
     properties: {
       files: [{ type: 'image/png', uri: ipfsGatewayUrl }]
     }
   }
   ```

---

#### Step 7: Upload Metadata JSON to IPFS
**Location**: `app/api/generate-image/route.ts` (line ~685-708)

**Process:**
1. **Upload Metadata**:
   ```typescript
   metadataUploadResult = await pinata.pinJSONToIPFS(metadata, {
     pinataMetadata: { name: `pixel-character-metadata-${fid}` }
   })
   ```

2. **Get Metadata CID & URL**:
   ```typescript
   const metadataCid = metadataUploadResult.IpfsHash
   const metadataIpfsGatewayUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${metadataCid}`
   ```

**Key Function**: `pinata.pinJSONToIPFS(jsonObject, options)`
- **Input**: JavaScript object (automatically stringified)
- **Output**: `{ IpfsHash: string }` - The metadata CID
- **Returns**: IPFS hash for the metadata JSON

---

#### Step 8: Save to Database
**Location**: `app/api/generate-image/route.ts` (line ~710-753)

**Process:**
1. **Prepare Data**:
   ```typescript
   const userImageData = {
     fid,
     username,
     displayName,
     ipfsUrl: ipfsGatewayUrl,        // Image IPFS URL
     ipfsCid: imageCid,               // Image CID
     metadataIpfsUrl: metadataIpfsGatewayUrl,  // Metadata IPFS URL
     metadataIpfsCid: metadataCid,    // Metadata CID
     traits,
     description: loreOnly,
     isPro,
     primaryAddress,
     verifiedAddresses
   }
   ```

2. **Save to MongoDB**:
   ```typescript
   await UserImage.findOneAndUpdate(
     { fid },
     userImageData,
     { upsert: true, new: true }
   )
   ```

---

#### Step 9: Return Response to Frontend
**Location**: `app/api/generate-image/route.ts` (line ~755-768)

**Response includes:**
```typescript
{
  success: true,
  imageUrl: ipfsGatewayUrl,           // Image IPFS URL
  ipfsCid: imageCid,                  // Image CID
  ipfsUrl: ipfsGatewayUrl,
  metadataIpfsCid: metadataCid,         // Metadata CID
  metadataIpfsUrl: metadataIpfsGatewayUrl,  // Metadata IPFS URL
  fid,
  username,
  traits,
  description: loreOnly,
  fromCache: false,
  isPro
}
```

---

### **PHASE 2: Signature Generation**

#### Step 10: User Clicks Mint Button
**Location**: `components/Home/ImageGenerator.tsx` (line ~665-697) or `components/Home/Mint.tsx` (line ~22-62)

**Process:**
1. **Check Eligibility** (pre-mint check):
   ```typescript
   const { mutate: checkEligibility } = useMutation({
     mutationFn: async () => {
       const res = await fetch('/api/generate-signature', {
         method: 'POST',
         body: JSON.stringify({ fid, address })
       })
       return await res.json()
     }
   })
   ```

---

#### Step 11: Backend Generates Signature
**Location**: `app/api/generate-signature/route.ts` (line ~13-133)

**Process:**
1. **Verify User Exists**:
   ```typescript
   const userImage = await UserImage.findOne({ fid })
   if (!userImage || !userImage.metadataIpfsCid) {
     return error
   }
   ```

2. **Verify Wallet Address**:
   ```typescript
   const isValidAddress = 
     addressLower === primaryAddressLower || 
     verifiedAddressesLower.includes(addressLower)
   ```

3. **Get Token URI** (metadata IPFS URL):
   ```typescript
   const tokenUri = userImage.metadataIpfsUrl || userImage.metadataIpfsCid
   ```

4. **Determine Mint Type**:
   ```typescript
   const whitelistEntry = await WhitelistEntry.findOne({ fid })
   const isWhitelisted = Boolean(whitelistEntry)
   const mintTag = isWhitelisted ? 'FREE_MINT' : 'PUBLIC_MINT'
   const contractFunction = isWhitelisted ? 'freeMint' : 'publicMint'
   ```

5. **Generate Message Hash**:
   ```typescript
   const messageHash = ethers.solidityPackedKeccak256(
     ['address', 'uint256', 'string'],
     [normalizedAddress, fid, mintTag]
   )
   ```

6. **Sign Message**:
   ```typescript
   const wallet = new ethers.Wallet(signerPrivateKey)
   const signature = await wallet.signMessage(ethers.getBytes(messageHash))
   ```

7. **Return Signature Data**:
   ```typescript
   return {
     success: true,
     signature,              // 0x... signature
     tokenUri,               // Metadata IPFS URL
     mintType: 'free' | 'public',
     contractFunction: 'freeMint' | 'publicMint',
     metadataIpfsCid,
     metadataIpfsUrl
   }
   ```

---

### **PHASE 3: Blockchain Minting**

#### Step 12: Execute Mint Transaction
**Location**: `components/Home/ImageGenerator.tsx` (line ~699-759)

**Process:**
1. **Check Chain**:
   ```typescript
   if (!isOnbase) {
     await switchChainAsync?.({ chainId: 8453 }) // Switch to Base
   }
   ```

2. **Prepare Mint Parameters**:
   ```typescript
   const mintValue = signatureData.mintType === 'public' 
     ? (mintPrice as bigint) 
     : BigInt(0)
   ```

3. **Call Smart Contract**:
   ```typescript
   const txHash = await writeContractAsync({
     address: CONTRACT_ADDRESS,
     abi: CONTRACT_ABI,
     functionName: signatureData.contractFunction, // 'freeMint' or 'publicMint'
     args: [
       fid,                    // Farcaster ID (used as tokenId)
       signatureData.tokenUri, // Metadata IPFS URL
       signatureData.signature  // Backend signature
     ],
     value: mintValue,         // 0 for free, MINT_PRICE for public
     chainId: 8453            // Base chain
   })
   ```

---

#### Step 13: Smart Contract Verification
**Location**: `contract/FID_AZUKI.sol` (line ~61-108)

**Process:**
1. **Contract Receives Call**:
   - Function: `freeMint()` or `publicMint()`
   - Parameters: `(fid, tokenUri, signature)`

2. **Verify Signature**:
   ```solidity
   bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, fid, "FREE_MINT"));
   bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
   address recoveredSigner = ethSignedMessageHash.recover(signature);
   require(recoveredSigner == signerAddress, "Invalid signature");
   ```

3. **Mint NFT**:
   ```solidity
   _safeMint(msg.sender, fid);           // Mint NFT with fid as tokenId
   _setTokenURI(fid, tokenUri);          // Set metadata URI
   mintedFids[fid] = true;               // Mark as minted
   totalMinted++;                        // Increment supply
   ```

4. **Emit Event**:
   ```solidity
   emit TokenMinted(msg.sender, fid, tokenUri, mintType);
   ```

---

#### Step 14: Wait for Transaction Confirmation
**Location**: `components/Home/ImageGenerator.tsx` (line ~735-753)

**Process:**
```typescript
onSuccess: async (txHash) => {
  // Wait for transaction to be mined
  if (txHash && publicClient) {
    await publicClient.waitForTransactionReceipt({ hash: txHash })
  }
  setMintSuccess(true)
  // Refresh minted status
  await refetchHasFidMinted?.()
}
```

---

### **PHASE 4: Share Image (Optional)**

#### Step 15: Generate Share Image
**Location**: `components/Home/ImageGenerator.tsx` (line ~425-653)

**Process:**
1. **Create Canvas**:
   ```typescript
   const canvas = document.createElement('canvas')
   canvas.width = 1200
   canvas.height = 800
   // Draw NFT image + branding
   ```

2. **Convert to Base64**:
   ```typescript
   const base64 = canvas.toDataURL('image/png', 0.95)
   ```

3. **Upload to IPFS**:
   ```typescript
   const uploadResponse = await fetch('/api/upload-share-image', {
     method: 'POST',
     body: JSON.stringify({
       imageData: base64,
       fid, username, displayName
     })
   })
   ```

---

#### Step 16: Upload Share Image to IPFS
**Location**: `app/api/upload-share-image/route.ts` (line ~12-84)

**Process:**
1. **Initialize Pinata (JWT version)**:
   ```typescript
   const pinata = new PinataSDK({
     pinataJwt: process.env.PINATA_JWT,
     pinataGateway: process.env.PINATA_GATEWAY
   })
   ```

2. **Convert Base64 to File**:
   ```typescript
   const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
   const imageBuffer = Buffer.from(base64Data, 'base64')
   const file = new File([imageBuffer], `share-image-${fid}.png`, {
     type: 'image/png'
   })
   ```

3. **Upload to IPFS**:
   ```typescript
   const ipfsUpload = await pinata.upload.public
     .file(file)
     .name(`share-image-${fid}.png`)
     .keyvalues({
       fid: fid.toString(),
       type: 'share-image'
     })
   ```

4. **Return IPFS URL**:
   ```typescript
   const ipfsGatewayUrl = `https://${process.env.PINATA_GATEWAY}/ipfs/${ipfsUpload.cid}`
   return { success: true, imageURL: ipfsGatewayUrl, cid: ipfsUpload.cid }
   ```

**Key Function**: `pinata.upload.public.file(file)`
- **Input**: File object
- **Output**: `{ cid: string }` - The CID
- **Returns**: IPFS hash for the share image

---

## 📋 Summary: Complete Flow Diagram

```
1. USER ACTION
   └─> Click "Generate" button
       └─> POST /api/generate-image { fid }

2. IMAGE GENERATION
   └─> Check MongoDB cache
   └─> Fetch PFP from Farcaster
   └─> Resize PFP (1024x1024) with Sharp
   └─> Generate image with Google Gemini AI
   └─> Extract image + traits from AI response

3. IPFS UPLOAD (Image)
   └─> Convert base64 → Buffer → Stream
   └─> pinata.pinFileToIPFS(stream)
   └─> Get imageCid (IPFS hash)
   └─> Create gateway URL: https://gateway.pinata.cloud/ipfs/{imageCid}

4. METADATA CREATION
   └─> Parse traits from AI description
   └─> Create metadata JSON object
   └─> Include image IPFS URL in metadata

5. IPFS UPLOAD (Metadata)
   └─> pinata.pinJSONToIPFS(metadata)
   └─> Get metadataCid (IPFS hash)
   └─> Create gateway URL: https://gateway.pinata.cloud/ipfs/{metadataCid}

6. DATABASE SAVE
   └─> Save to MongoDB:
       - fid, username, displayName
       - ipfsUrl, ipfsCid (image)
       - metadataIpfsUrl, metadataIpfsCid (metadata)
       - traits, description

7. RETURN TO FRONTEND
   └─> Display generated NFT image
   └─> Show mint button

8. MINT PREPARATION
   └─> User connects wallet
   └─> Click "Mint" button
   └─> POST /api/generate-signature { fid, address }

9. SIGNATURE GENERATION
   └─> Verify user exists in DB
   └─> Verify wallet address matches Farcaster
   └─> Get metadataIpfsUrl from DB
   └─> Check whitelist → determine mint type
   └─> Generate message hash: keccak256(address, fid, mintTag)
   └─> Sign with backend private key
   └─> Return { signature, tokenUri, mintType, contractFunction }

10. BLOCKCHAIN MINT
    └─> Switch to Base chain (if needed)
    └─> Call smart contract:
        - freeMint(fid, tokenUri, signature) OR
        - publicMint(fid, tokenUri, signature) [with ETH payment]
    └─> Contract verifies signature
    └─> Contract mints NFT: _safeMint(msg.sender, fid)
    └─> Contract sets token URI: _setTokenURI(fid, tokenUri)
    └─> Emit TokenMinted event

11. CONFIRMATION
    └─> Wait for transaction receipt
    └─> Show success message
    └─> (Optional) Auto-generate share image
    └─> (Optional) Upload share image to IPFS
```

---

## 🔑 Key IPFS Functions Reference

### Function 1: `pinata.pinFileToIPFS(stream, options)`
**Package**: `@pinata/sdk`
**Location**: `app/api/generate-image/route.ts:642`

```typescript
const imageStream = Readable.from(imageBuffer)
const result = await pinata.pinFileToIPFS(imageStream, {
  pinataMetadata: { name: `pixel-character-${fid}.png` }
})
// Returns: { IpfsHash: "Qm..." }
```

**Purpose**: Upload image file to IPFS
**Input**: Readable stream (Buffer converted to stream)
**Output**: Object with `IpfsHash` property (the CID)

---

### Function 2: `pinata.pinJSONToIPFS(jsonObject, options)`
**Package**: `@pinata/sdk`
**Location**: `app/api/generate-image/route.ts:688`

```typescript
const result = await pinata.pinJSONToIPFS(metadata, {
  pinataMetadata: { name: `pixel-character-metadata-${fid}` }
})
// Returns: { IpfsHash: "Qm..." }
```

**Purpose**: Upload JSON metadata to IPFS
**Input**: JavaScript object (auto-stringified)
**Output**: Object with `IpfsHash` property (the CID)

---

### Function 3: `pinata.upload.public.file(file)`
**Package**: `pinata` (v2.5.1)
**Location**: `app/api/upload-share-image/route.ts:49`

```typescript
const file = new File([imageBuffer], `share-image-${fid}.png`, {
  type: 'image/png'
})
const result = await pinata.upload.public
  .file(file)
  .name(`share-image-${fid}.png`)
  .keyvalues({ fid: fid.toString() })
// Returns: { cid: "Qm..." }
```

**Purpose**: Upload share image to IPFS (newer API)
**Input**: File object
**Output**: Object with `cid` property (the CID)

---

## 🔐 Environment Variables Required

```env
# Pinata Configuration (for @pinata/sdk)
PINATA_API_KEY=your_api_key
PINATA_SECRET_API_KEY=your_secret_key
PINATA_API_KEY_2=... (optional, for load balancing)
PINATA_SECRET_API_KEY_2=... (optional)

# Pinata Configuration (for pinata package - JWT)
PINATA_JWT=your_jwt_token

# Pinata Gateway
PINATA_GATEWAY=gateway.pinata.cloud

# Google AI (for image generation)
GOOGLE_GENERATIVE_AI_API_KEY=your_key
GOOGLE_GENERATIVE_AI_API_KEY_2=... (optional)

# Blockchain Signer (for signature generation)
SIGNER_PRIVATE_KEY=0x... (must match contract's signerAddress)

# MongoDB (for caching)
MONGODB_URI=mongodb://...
```

---

## 📝 Important Notes

1. **Two Pinata Packages**: The project uses both `@pinata/sdk` (older, API key) and `pinata` (newer, JWT). They serve different purposes:
   - `@pinata/sdk`: Main NFT image and metadata uploads
   - `pinata`: Share image uploads

2. **CID vs URL**: 
   - **CID** (Content Identifier): The IPFS hash (e.g., `QmXxxx...`)
   - **Gateway URL**: `https://gateway.pinata.cloud/ipfs/{CID}`

3. **Token URI**: The smart contract stores the **metadata IPFS URL** (not the image URL directly). The metadata JSON contains the image URL.

4. **Signature Flow**: 
   - Backend signs: `keccak256(address, fid, "FREE_MINT" | "PUBLIC_MINT")`
   - Contract verifies: Same hash + signature → must match `signerAddress`

5. **Token ID**: The Farcaster ID (`fid`) is used directly as the NFT token ID.

6. **Caching**: 
   - MongoDB caches generated images
   - localStorage caches character data on frontend
   - Share images are cached in localStorage

---

## 🎯 Quick Reference: What Goes Where

| Data | Storage | Location |
|------|---------|----------|
| Generated NFT Image | IPFS | `ipfsCid` → `ipfsUrl` |
| NFT Metadata JSON | IPFS | `metadataIpfsCid` → `metadataIpfsUrl` |
| User Data | MongoDB | `UserImage` collection |
| Token URI (on-chain) | Smart Contract | `tokenURI(fid)` returns `metadataIpfsUrl` |
| Share Image | IPFS | Separate upload via `/api/upload-share-image` |

---

## 🚀 How to Apply to Other Projects

1. **Install Packages**:
   ```bash
   npm install @pinata/sdk pinata ethers sharp
   ```

2. **Set Up Pinata**:
   - Create Pinata account
   - Get API key + secret (for `@pinata/sdk`)
   - Get JWT token (for `pinata` package)
   - Set up gateway

3. **Image Upload Flow**:
   - Convert image → Buffer → Stream
   - Use `pinata.pinFileToIPFS(stream)`
   - Get CID from `result.IpfsHash`
   - Construct gateway URL

4. **Metadata Upload Flow**:
   - Create metadata JSON object
   - Use `pinata.pinJSONToIPFS(metadata)`
   - Get CID from `result.IpfsHash`
   - Use metadata URL as `tokenURI` in contract

5. **Minting Flow**:
   - Generate signature on backend
   - Pass `tokenUri` (metadata IPFS URL) to contract
   - Contract stores URI, metadata JSON contains image URL

---

This documentation covers the complete A-to-Z flow of NFT minting in this project, from image generation to IPFS upload to blockchain minting.

