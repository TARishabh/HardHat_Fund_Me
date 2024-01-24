// // the naive way to do it part 1
// // function deployFunc(params) {
//     // hre.getNamedAccounts();
// // }
// // module.exports.default = deployFunc;

// const { network } = require("hardhat");
// const {networkConfig, developmentChains} = require("../helper-hardhat-config");
// const {verify} = require("../utils/verify");

// // the naive way to do it part 2
// // module.exports = async(hre)=>{
// //  const {getNamedAccounts,deployments} = hre;
// // }



// // now the way to actually do it:
// module.exports = async ({getNamedAccounts,deployments})=>{
//     const {deploy, log} = deployments;
//     const {deployer} = await getNamedAccounts();
//     const chaindId = network.config.chainId;

//     // const ethUsdPriceFeedAddress = networkConfig[chaindId]['ethUsdPriceFeed'];

//     let ethUsdPriceFeedAddress;
//     if (developmentChains.includes(network.name)){
//         const ethUsdAggregator = await deployments.get("MockV3Aggregator");
//         ethUsdPriceFeedAddress = ethUsdAggregator.address;
//     } 
//     else {
//         ethUsdPriceFeedAddress = networkConfig[chaindId]['ethUsdPriceFeed'];
//     }
//     const args = [ethUsdPriceFeedAddress];
//     const fundMe = await deploy("FundMe",{
//         from:deployer,
//         args:args, // put price feed address
//         log:true,
//         // we need to wait if on a live network so we can verify properly
//         waitConfirmations: network.config.blockConfirmations || 1,
//     })
    
//     if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
//         // IF THE CHAIN IS SEPOLIA, MAINNET, THEN WE HAVE TO VERIFY THAT CONTRACT
//         await verify(fundMe.address,args);
//     }
// }




const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`FundMe deployed at ${fundMe.address}`)

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
}

module.exports.tags = ["all", "fundme"]
