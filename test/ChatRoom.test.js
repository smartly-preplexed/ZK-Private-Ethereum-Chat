const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChatRoom", function () {
  let verifier, store, chat;
  let admin, alice, bob, carol;

  beforeEach(async () => {
    [admin, alice, bob, carol] = await ethers.getSigners();

    const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
    verifier = await ZKVerifier.deploy();
    await verifier.waitForDeployment();

    const MessageStore = await ethers.getContractFactory("MessageStore");
    store = await MessageStore.deploy();
    await store.waitForDeployment();

    const ChatRoom = await ethers.getContractFactory("ChatRoom");
    chat = await ChatRoom.deploy(await verifier.getAddress(), await store.getAddress());
    await chat.waitForDeployment();
  });

  describe("Room management", () => {
    it("should create a room", async () => {
      await chat.createRoom("general", false);
      const room = await chat.rooms(0);
      expect(room.name).to.equal("general");
      expect(room.isActive).to.be.true;
      expect(room.isPrivate).to.be.false;
    });

    it("should allow joining public rooms", async () => {
      await chat.createRoom("general", false);
      await chat.connect(alice).joinRoom(0);
      expect(await chat.isMember(0, alice.address)).to.be.true;
    });

    it("should reject joining private rooms", async () => {
      await chat.createRoom("secret", true);
      await expect(chat.connect(alice).joinRoom(0)).to.be.revertedWith("Private room");
    });

    it("should allow moderator to add members to private rooms", async () => {
      await chat.createRoom("secret", true);
      await chat.addMember(0, alice.address);
      expect(await chat.isMember(0, alice.address)).to.be.true;
    });
  });

  describe("Message posting", () => {
    beforeEach(async () => {
      await chat.createRoom("general", false);
      await chat.connect(alice).joinRoom(0);
    });

    it("should post a message with valid proof", async () => {
      const ciphertext = ethers.toUtf8Bytes("encrypted message");
      const proofHash = ethers.id("proof1");
      const nullifier = ethers.id("null1");

      const a = [1, 2];
      const b = [[1, 2], [3, 4]];
      const c = [1, 2];
      const publicInputs = [1];

      await expect(
        chat.connect(alice).postMessage(0, ciphertext, proofHash, nullifier, a, b, c, publicInputs)
      ).to.emit(chat, "MessagePosted");
    });

    it("should reject duplicate proof nullifiers", async () => {
      const ciphertext = ethers.toUtf8Bytes("encrypted message");
      const proofHash = ethers.id("proof1");
      const nullifier = ethers.id("null1");

      const a = [1, 2];
      const b = [[1, 2], [3, 4]];
      const c = [1, 2];
      const publicInputs = [1];

      await chat.connect(alice).postMessage(0, ciphertext, proofHash, nullifier, a, b, c, publicInputs);

      await expect(
        chat.connect(alice).postMessage(0, ciphertext, proofHash, nullifier, a, b, c, publicInputs)
      ).to.be.revertedWith("Duplicate proof");
    });

    it("should reject non-members", async () => {
      const ciphertext = ethers.toUtf8Bytes("encrypted message");
      const proofHash = ethers.id("proof1");
      const nullifier = ethers.id("null1");
      const a = [1, 2];
      const b = [[1, 2], [3, 4]];
      const c = [1, 2];
      const publicInputs = [1];

      await expect(
        chat.connect(bob).postMessage(0, ciphertext, proofHash, nullifier, a, b, c, publicInputs)
      ).to.be.revertedWith("Not a member");
    });

    it("should reject oversized messages", async () => {
      const ciphertext = new Uint8Array(513);
      const proofHash = ethers.id("proof1");
      const nullifier = ethers.id("null1");
      const a = [1, 2];
      const b = [[1, 2], [3, 4]];
      const c = [1, 2];
      const publicInputs = [1];

      await expect(
        chat.connect(alice).postMessage(0, ciphertext, proofHash, nullifier, a, b, c, publicInputs)
      ).to.be.revertedWith("Message too large");
    });
  });

  describe("MessageStore pagination", () => {
    it("should paginate room messages", async () => {
      await chat.createRoom("general", false);
      await chat.connect(alice).joinRoom(0);

      for (let i = 0; i < 5; i++) {
        const ciphertext = ethers.toUtf8Bytes(`msg-${i}`);
        const nullifier = ethers.id(`null-${i}`);
        await chat.connect(alice).postMessage(
          0, ciphertext, ethers.id(`p${i}`), nullifier,
          [1, 2], [[1, 2], [3, 4]], [1, 2], [1]
        );
      }

      const page1 = await store.getRoomMessages(0, 0, 3);
      const page2 = await store.getRoomMessages(0, 3, 3);

      expect(page1.length).to.equal(3);
      expect(page2.length).to.equal(2);
      expect(await store.getRoomMessageCount(0)).to.equal(5);
    });
  });

  describe("Moderation", () => {
    it("should allow moderator to remove messages", async () => {
      await chat.createRoom("general", false);
      await chat.connect(alice).joinRoom(0);

      const ciphertext = ethers.toUtf8Bytes("bad message");
      await chat.connect(alice).postMessage(
        0, ciphertext, ethers.id("p1"), ethers.id("n1"),
        [1, 2], [[1, 2], [3, 4]], [1, 2], [1]
      );

      const ids = await store.getRoomMessages(0, 0, 10);
      await chat.removeMessage(ids[0]);

      const msg = await store.getMessage(ids[0]);
      expect(msg.removed).to.be.true;
    });
  });
});