// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ZKVerifier.sol";
import "./MessageStore.sol";

/// @title ChatRoom — role-based chat room with ZKP-gated message posting
contract ChatRoom is AccessControl {
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    ZKVerifier public immutable verifier;
    MessageStore public immutable store;

    struct Room {
        string name;
        bool isActive;
        bool isPrivate;
    }

    mapping(uint256 => Room) public rooms;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(bytes32 => bool) public usedProofNullifiers;
    uint256 public roomCount;

    event RoomCreated(uint256 indexed roomId, string name, bool isPrivate);
    event MemberJoined(uint256 indexed roomId, address indexed member);
    event MemberRemoved(uint256 indexed roomId, address indexed member);
    event MessagePosted(uint256 indexed roomId, address indexed sender, bytes32 indexed messageId, bytes32 proofHash);

    modifier onlyMember(uint256 roomId) {
        require(rooms[roomId].isActive, "Room not active");
        require(isMember[roomId][msg.sender], "Not a member");
        _;
    }

    modifier onlyModerator() {
        require(hasRole(MODERATOR_ROLE, msg.sender), "Not a moderator");
        _;
    }

    constructor(address _verifier, address _store) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender);
        verifier = ZKVerifier(_verifier);
        store = MessageStore(_store);
    }

    /// @notice Create a new chat room
    function createRoom(string calldata name, bool isPrivate) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 roomId) {
        roomId = roomCount++;
        rooms[roomId] = Room({ name: name, isActive: true, isPrivate: isPrivate });
        isMember[roomId][msg.sender] = true;
        emit RoomCreated(roomId, name, isPrivate);
    }

    /// @notice Join an open room
    function joinRoom(uint256 roomId) external {
        require(rooms[roomId].isActive, "Room not active");
        require(!rooms[roomId].isPrivate, "Private room");
        isMember[roomId][msg.sender] = true;
        emit MemberJoined(roomId, msg.sender);
    }

    /// @notice Add member to a private room (moderator only)
    function addMember(uint256 roomId, address member) external onlyModerator {
        require(rooms[roomId].isActive, "Room not active");
        isMember[roomId][member] = true;
        emit MemberJoined(roomId, member);
    }

    /// @notice Post an encrypted message with a ZKP proof of validity
    /// @param roomId Target room
    /// @param ciphertext Encrypted message content
    /// @param proofHash Hash of the ZK proof for indexing
    /// @param nullifier Prevents duplicate proofs
    /// @param a,b,c Groth16 proof components
    /// @param publicInputs Public signals for the verifier
    function postMessage(
        uint256 roomId,
        bytes calldata ciphertext,
        bytes32 proofHash,
        bytes32 nullifier,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata publicInputs
    ) external onlyMember(roomId) {
        require(!usedProofNullifiers[nullifier], "Duplicate proof");
        require(ciphertext.length <= 512, "Message too large");

        // Verify the ZK proof on-chain
        require(verifier.verifyProof(a, b, c, publicInputs), "ZKP verification failed");

        usedProofNullifiers[nullifier] = true;

        bytes32 messageId = store.storeMessage(roomId, msg.sender, ciphertext, proofHash);

        emit MessagePosted(roomId, msg.sender, messageId, proofHash);
    }

    /// @notice Remove a message (moderation)
    function removeMessage(bytes32 messageId) external onlyModerator {
        store.removeMessage(messageId);
    }

    /// @notice Deactivate a room
    function deactivateRoom(uint256 roomId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rooms[roomId].isActive = false;
    }
}