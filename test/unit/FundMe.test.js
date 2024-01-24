const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe", function () {
    let fundMe
    let mockV3Aggregator
    let deployer
    const sendValue = ethers.utils.parseEther("1") // 1 ETH
    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor",async function(){
        it("sets the aggregator addresses correctly",async function(){
            const response = await fundMe.getPriceFeed();
            assert.equal(response,mockV3Aggregator.address);
        });
    });

    describe("FundMe",async function(){
        it("fails on sending low eth",async function(){
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!");
        });

        it("updated the amount funded data structure",async function(){
            await fundMe.fund({value: sendValue});
            const response = await fundMe.getAddressToAmountFunded(deployer);
            assert.equal(response.toString(),sendValue.toString());
        });

        it("Adds funder to array of funder",async ()=>{
            await fundMe.fund({value:sendValue});
            const response = await fundMe.getFunder(0);
            assert.equal(response.toString(),deployer.toString());
        });
    });

    describe('Withdraw', async() => {
        beforeEach(async function(){
            await fundMe.fund({value:sendValue});
        });
        it("withdraw eth from a single funder",async ()=>{
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
            
            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);

            const {effectiveGasPrice,gasUsed} = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
            
            // Assert
            assert.equal(endingFundMeBalance,0);
            assert.equal(startingFundMeBalance.add(startingDeployerBalance),endingDeployerBalance.add(gasCost).toString());
        })
    })
    
    it("allows is to withdraw with multiple funders",async ()=>{
        const accounts = await ethers.getSigners();
        for (let i=1;i<6;i++){
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({value:sendValue});
        };
        const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
        const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
        
        // Act
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt = await transactionResponse.wait(1);

        const {effectiveGasPrice,gasUsed} = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice);

        // Assert
        const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
        // assert.equal(endingFundMeBalance,0);
        assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),endingDeployerBalance.add(gasCost).toString());

        await expect(fundMe.getFunder(0)).to.be.reverted;
        for(i=1; i<6;i++){
            assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address),0);
        }
    });

    it("allows only the owner to withdraw", async function(){
        const accounts = await ethers.getSigners();
        const attacker = accounts[1];
        const attackerConnectedContract = await fundMe.connect(attacker);
        await expect(attackerConnectedContract.withdraw()).to.be.reverted;
    })

})