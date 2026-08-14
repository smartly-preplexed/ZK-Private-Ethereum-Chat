Install Hardhat + Solidity toolchain
npm init -y npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox npm install ethers

Install frontend dependencies
npm install react react-dom next-themes sonner lucide-react
class-variance-authority clsx tailwind-merge tailwindcss
framer-motion recharts date-fns

Initialize Tailwind (if not already configured)
npx tailwindcss init -p

2. Configure MetaMask for Local Network
Open MetaMask → click the network dropdown → Add Network → Add a network manually
Enter:
Network Name: Hardhat Local
New RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
Save.
3. Deploy Smart Contracts
3a. Start the Hardhat node

This launches a local blockchain at http://127.0.0.1:8545 with 20 pre-funded accounts. Keep this terminal running.

You'll see output like:

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH) Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 ...

3b. Import a test account into MetaMask
Copy one of the Private Keys from the Hardhat node output (e.g., Account #0).
In MetaMask → Import Account → paste the private key.
You should now see ~10000 ETH in your wallet.
3c. Run the deployment script
In a new terminal:

Expected output:

Deploying contracts with: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 ZKVerifier deployed to: 0x5FbDB2315678afecb2576b52C4b8C2E6d8dA8a42 MessageStore deployed to: 0xe7f1726E7734CE477F66E3c2C2F8C3d6a4b2c1Ad ChatRoom deployed to: 0x9fE46736F7734CE477F66E3c2C2F8C3d6a4b2c1Ad Default rooms created

Save these addresses — you'll need them for the frontend config.

3d. Run the tests (optional)

4. Start the React Frontend
4a. Configure contract addresses
Create or edit src/lib/contract-config.ts:

4b. Start the dev server
component-4.sh
Open http://localhost:3000 in your browser (the one with MetaMask installed).

5. Connect & Start Chatting
Click Connect MetaMask in the top-right corner.

Approve the connection in MetaMask.

If prompted, switch to the Hardhat Local network (Chain ID 31337).

You'll see the chat interface with four default rooms:

# general — open to all
# engineering — open to all
# research — private (invite-only)
# ops — private (admin/moderator only)
Select a room from the left sidebar.

Type a message in the composer at the bottom and press Enter (or click Sign & Send).

The app will:

Encrypt your message client-side
Generate a ZK proof (simulated in this MVP)
Submit the transaction on-chain
Display the message once the transaction is confirmed
6. Invite Team Members
For public rooms (# general, # engineering)
Anyone can join without an invitation:

They connect MetaMask to the same Hardhat network.
They call joinRoom(roomId) on the ChatRoom contract.
In the frontend, clicking the room automatically joins them.
For private rooms (# research, # ops)
Only a moderator can add members:

Via Hardhat Console

Via a Frontend Admin Panel (if built)
The moderator connects their wallet, navigates to the admin panel, and enters the member's wallet address to invite them to a private room.

Granting Moderator Privileges

7. ZKP Proof Generation (Technical Details)
In this MVP, ZK proof generation is simulated in the browser. In production:

Circuit (message_validity.circom)

Generate proof with snarkjs

Submit proof on-chain
The frontend calls chat.postMessage() with the Groth16 proof components (a, b, c) and public inputs.

8. Troubleshooting


Issue	Solution
MetaMask not found	Install the MetaMask browser extension
Wrong network error	Switch MetaMask to Hardhat Local (Chain ID 31337)
Insufficient gas	Import a Hardhat test account (each has 10000 ETH)
ZKP verification failed	The simulated proof may randomly fail (5% rate). Retry.
Duplicate proof error	Each proof has a unique nullifier. Generate a new proof.
Contract not deployed	Run npx hardhat run scripts/deploy.js --network localhost
Frontend can't connect	Ensure Hardhat node is running (npx hardhat node)
9. Architecture Overview
┌─────────────────────────────────────────────────────┐ │ React Frontend │ │ │ │ ┌──────────┐ ┌───────────┐ ┌──────────────────┐ │ │ │ Wallet │ │ Chat UI │ │ ZKP Console │ │ │ │ Connect │ │ Messages │ │ Proof Generation │ │ │ └────┬─────┘ └─────┬─────┘ └────────┬─────────┘ │ │ │ │ │ │ │ └───────────────┴─────────────────┘ │ │ │ ethers.js │ └───────────────────────┼───────────────────────────────┘ │ ┌───────────────────────┼───────────────────────────────┐ │ Hardhat / Ethereum │ │ │ │ ┌──────────┐ ┌──────────────┐ ┌───────────────┐ │ │ │ ChatRoom │──│ ZKVerifier │ │ MessageStore │ │ │ │ (RBAC) │ │ (Groth16) │ │ (Pagination) │ │ │ └──────────┘ └──────────────┘ └───────────────┘ │ └──────────────────────────────────────────────────────┘

Quick Start Summary

Then open http://localhost:3000, connect MetaMask, and start chatting.
