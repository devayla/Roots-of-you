/**
 * NFT Metadata structure following ERC721 standard
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // IPFS URL
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
  };
}

export interface TreeMetadataParams {
  imageCid: string;
  rootUser: {
    fid: number;
    username: string;
  };
  friends: Array<{
    user: {
      fid: number;
      username: string;
    };
    score: number;
  }>;
  maxScore: number;
}

/**
 * Creates ERC721-compliant metadata for a tree NFT
 */
export function createTreeNFTMetadata(params: TreeMetadataParams): NFTMetadata {
  const { imageCid, rootUser, friends, maxScore } = params;
  
  const imageUrl = `ipfs://${imageCid}`;
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${imageCid}`;
  
  const attributes = [
    {
      trait_type: "Friends Count",
      value: friends.length,
    },
    {
      trait_type: "Top Affinity Score",
      value: maxScore,
    },
    {
      trait_type: "Root User",
      value: rootUser.username,
    },
    {
      trait_type: "FID",
      value: rootUser.fid,
    },
    {
      trait_type: "Mint Date",
      value: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    },
  ];
  
  // Add top 3 friends as attributes
  const topFriends = friends
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  topFriends.forEach((friend, index) => {
    attributes.push({
      trait_type: `Top Friend #${index + 1}`,
      value: friend.user.username,
    });
  });
  
  return {
    name: `Roots of You #${rootUser.fid}`,
    description: `A unique friendship tree visualization for ${rootUser.username} on Farcaster. This tree represents ${friends.length} connections with a top affinity score of ${maxScore}. Each leaf represents a friend, and the tree grows from your roots.`,
    image: imageUrl,
    attributes,
    external_url: "", // Update with your app URL
    properties: {
      files: [
        {
          uri: gatewayUrl,
          type: "image/png",
        },
      ],
    },
  };
}




