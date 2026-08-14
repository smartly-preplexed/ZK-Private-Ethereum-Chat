const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy ZKVerifier
  const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
  const verifier = await ZKVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddr = await verifier.getAddress();
  console.log("ZKVerifier deployed to:", verifierAddr);

  // Deploy MessageStore
  const MessageStore = await ethers.getContractFactory("MessageStore");
  const store = await MessageStore.deploy();
  await store.waitForDeployment();
  const storeAddr = await store.getAddress();
  console.log("MessageStore deployed to:", storeAddr);

  // Deploy ChatRoom
  const ChatRoom = await ethers.getContractFactory("ChatRoom");
  const chat = await ChatRoom.deploy(verifierAddr, storeAddr);
  await chat.waitForDeployment();
  const chatAddr = await chat.getAddress();
  console.log("ChatRoom deployed to:", chatAddr);

  // Create default rooms
  await chat.createRoom("general", false);
  await chat.createRoom("engineering", false);
  await chat.createRoom("research", true);
  await chat.createRoom("ops", true);
  console.log("Default rooms created");

  console.log("\nDeployment complete:");
  console.log("  ZKVerifier:  ", verifierAddr);
  console.log("  MessageStore: ", storeAddr);
  console.log("  ChatRoom:     ", chatAddr);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });