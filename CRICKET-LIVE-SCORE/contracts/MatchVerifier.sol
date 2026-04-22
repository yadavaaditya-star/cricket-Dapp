// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MatchVerifier {
    address public owner;
    mapping(bytes32 => bytes32) public eventHash;

    event MatchEventStored(bytes32 indexed matchId, bytes32 indexed eventHash, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "MatchVerifier: only owner");
        _;
    }

    function storeMatchEvent(bytes32 matchId, bytes32 hashValue) external onlyOwner {
        require(matchId != bytes32(0), "MatchVerifier: invalid matchId");
        require(hashValue != bytes32(0), "MatchVerifier: invalid hash");
        require(eventHash[matchId] == bytes32(0), "MatchVerifier: event already stored");

        eventHash[matchId] = hashValue;
        emit MatchEventStored(matchId, hashValue, block.timestamp);
    }

    function verifyMatchEvent(bytes32 matchId, bytes32 expectedHash) external view returns (bool) {
        return eventHash[matchId] == expectedHash;
    }
}
