const { ethers } = require("hardhat");

async function main() {
  const MatchVerifier = await ethers.getContractFactory("MatchVerifier");
  const matchVerifier = await MatchVerifier.deploy();

  await matchVerifier.waitForDeployment();

  console.log("MatchVerifier deployed to:", await matchVerifier.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});