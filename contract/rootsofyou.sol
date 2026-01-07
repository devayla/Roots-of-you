// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ROOTSOFYOU is ERC721URIStorage, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 public MINT_PRICE = 0 ether; // public mint price
    uint256 public MAX_SUPPLY = 10000;
    uint256 public totalMinted;

    bool public mintActive = true;

    address public signerAddress;
    string public baseURI;

    mapping(uint256 => bool) public mintedFids; // track minted FIDs

    event TokenMinted(address indexed to, uint256 indexed fid, string tokenUri, string mintType);
    event MintPaused();
    event MintResumed();
    event MintPriceUpdated(uint256 newPrice);
    event SignerUpdated(address newSigner);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    event BaseURIUpdated(string newBaseURI);
    event TokenURIUpdated(uint256 indexed tokenId, string newURI);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor(address _signer) ERC721("rootsofyou", "ROOT") Ownable(msg.sender) {
        signerAddress = _signer;
    }

    // -------------------------------
    // Modifiers
    // -------------------------------
    modifier underMaxSupply() {
        require(totalMinted < MAX_SUPPLY, "Max supply reached");
        _;
    }

    modifier mintIsActive() {
        require(mintActive, "Minting is paused");
        _;
    }

    // -------------------------------
    // Public Mint (Paid, To Address)
    // -------------------------------
    /**
     * @notice Allows public minting for a fee, verified by backend signature
     * @param to Address that will receive the NFT
     * @param fid Farcaster FID used as tokenId
     * @param tokenUri Metadata URI for NFT
     * @param signature Backend signature verifying mint request
     */
    function publicMint(
        address to,
        uint256 fid,
        string memory tokenUri,
        bytes memory signature
    ) external payable nonReentrant underMaxSupply mintIsActive returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(msg.value == MINT_PRICE, "Incorrect mint price");
        require(!mintedFids[fid], "FID already minted");

        // Verify signature for public mint
        bytes32 messageHash = keccak256(
            abi.encodePacked(to, fid, "PUBLIC_MINT")
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == signerAddress, "Invalid public signature");

        _mintFID(to, fid, tokenUri, "Public");
        return fid;
    }

    // -------------------------------
    // Internal Mint Function
    // -------------------------------
    function _mintFID(
        address to,
        uint256 fid,
        string memory tokenUri,
        string memory mintType
    ) internal {
        _safeMint(to, fid);
        _setTokenURI(fid, tokenUri);
        mintedFids[fid] = true;
        totalMinted++;
        emit TokenMinted(to, fid, tokenUri, mintType);
    }

    // -------------------------------
    // Admin Functions
    // -------------------------------
    function pauseMinting() external onlyOwner {
        mintActive = false;
        emit MintPaused();
    }

    function resumeMinting() external onlyOwner {
        mintActive = true;
        emit MintResumed();
    }

    function setSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer");
        signerAddress = newSigner;
        emit SignerUpdated(newSigner);
    }

    function setMintPrice(uint256 newPriceInWei) external onlyOwner {
        MINT_PRICE = newPriceInWei;
        emit MintPriceUpdated(MINT_PRICE);
    }

    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalMinted, "Cannot set below current supply");
        MAX_SUPPLY = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function updateTokenURI(uint256 tokenId, string memory newURI) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenURI(tokenId, newURI);
        emit TokenURIUpdated(tokenId, newURI);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "No ether to withdraw");
        (bool success, ) = owner().call{value: bal}("");
        require(success, "Withdraw failed");
        emit FundsWithdrawn(owner(), bal);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
