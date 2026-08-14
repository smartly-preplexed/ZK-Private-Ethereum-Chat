// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MessageStore — minimal on-chain storage for encrypted messages
/// @notice Stores only ciphertext + metadata to minimize gas. Plaintext never touches chain.
contract MessageStore {
    struct Message {
        uint256 roomId;
        address sender;
        bytes ciphertext;
        bytes32 proofHash;
        uint256 timestamp;
        bool removed;
    }

    mapping(bytes32 => Message) private messages;
    bytes32[] public messageIds;
    mapping(uint256 => bytes32[]) private roomMessageIds;

    event MessageStored(bytes32 indexed messageId, uint256 indexed roomId, address indexed sender);
    event MessageRemoved(bytes32 indexed messageId);

    /// @notice Store an encrypted message
    function storeMessage(
        uint256 roomId,
        address sender,
        bytes calldata ciphertext,
        bytes32 proofHash
    ) external returns (bytes32 messageId) {
        messageId = keccak256(abi.encodePacked(roomId, sender, block.timestamp, ciphertext, messageIds.length));

        messages[messageId] = Message({
            roomId: roomId,
            sender: sender,
            ciphertext: ciphertext,
            proofHash: proofHash,
            timestamp: block.timestamp,
            removed: false
        });

        messageIds.push(messageId);
        roomMessageIds[roomId].push(messageId);

        emit MessageStored(messageId, roomId, sender);
    }

    /// @notice Retrieve a message by ID
    function getMessage(bytes32 messageId) external view returns (
        uint256 roomId,
        address sender,
        bytes memory ciphertext,
        bytes32 proofHash,
        uint256 timestamp,
        bool removed
    ) {
        Message storage m = messages[messageId];
        return (m.roomId, m.sender, m.ciphertext, m.proofHash, m.timestamp, m.removed);
    }

    /// @notice Paginated message retrieval for a room
    function getRoomMessages(uint256 roomId, uint256 offset, uint256 limit) external view returns (bytes32[] memory page) {
        bytes32[] storage all = roomMessageIds[roomId];
        uint256 total = all.length;
        if (offset >= total) return new bytes32[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 size = end - offset;

        page = new bytes32[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = all[offset + i];
        }
    }

    /// @notice Get total message count for a room
    function getRoomMessageCount(uint256 roomId) external view returns (uint256) {
        return roomMessageIds[roomId].length;
    }

    /// @notice Soft-delete a message (moderation)
    function removeMessage(bytes32 messageId) external {
        messages[messageId].removed = true;
        emit MessageRemoved(messageId);
    }

    /// @notice Total messages across all rooms
    function totalMessages() external view returns (uint256) {
        return messageIds.length;
    }
}