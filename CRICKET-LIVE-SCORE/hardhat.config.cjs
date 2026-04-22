require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    polygonMumbai: {
      url: process.env.RPC_URL || "https://polygon-mumbai.infura.io/v3/your_project_id",
      accounts: [process.env.BACKEND_PRIVATE_KEY || "0x..."],
    },
  },
};
