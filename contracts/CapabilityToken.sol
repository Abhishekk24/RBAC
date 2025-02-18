// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CapabilityToken {
    struct Token {
        address owner;
        string resource;
        uint256 expiry;
        bool valid;
    }

    mapping(uint256 => Token) public tokens;
    uint256 public tokenCounter;

    event TokenIssued(uint256 tokenId, address indexed owner, string resource, uint256 expiry);
    event TokenRevoked(uint256 tokenId);
    event TokenDelegated(uint256 tokenId, address indexed newOwner);

    function issueToken(address to, string memory resource, uint256 duration) public returns (uint256) {
        uint256 tokenId = tokenCounter++;
        tokens[tokenId] = Token(to, resource, block.timestamp + duration, true);
        emit TokenIssued(tokenId, to, resource, block.timestamp + duration);
        return tokenId;
    }

    function revokeToken(uint256 tokenId) public {
        require(tokens[tokenId].valid, "Token already revoked");
        tokens[tokenId].valid = false;
        emit TokenRevoked(tokenId);
    }

    function isTokenValid(uint256 tokenId) public view returns (bool) {
        return tokens[tokenId].valid && tokens[tokenId].expiry > block.timestamp;
    }

    function delegateToken(uint256 tokenId, address newOwner) public {
        require(tokens[tokenId].valid, "Token is not valid");
        tokens[tokenId].owner = newOwner;
        emit TokenDelegated(tokenId, newOwner);
    }
}