const hre = require("hardhat");


async function main() {
  console.log("🚀 Starting SecurePharmaTracker deployment...\n");


  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deployer account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");


  // Deploy the contract
  console.log("📦 Deploying SecurePharmaTracker contract...");
  const SecurePharmaTracker = await hre.ethers.getContractFactory("SecurePharmaTracker");
  const securePharmaTracker = await SecurePharmaTracker.deploy();


  await securePharmaTracker.waitForDeployment();
  const contractAddress = await securePharmaTracker.getAddress();


  console.log("✅ SecurePharmaTracker deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 Network:", hre.network.name);
  console.log("⛽ Gas used for deployment:", (await hre.ethers.provider.getTransactionReceipt(securePharmaTracker.deploymentTransaction().hash)).gasUsed.toString());


  // Setup initial roles for demonstration
  console.log("\n🔧 Setting up initial roles...");


  // Grant roles to the deployer for demonstration
  const MANUFACTURER_ROLE = await securePharmaTracker.MANUFACTURER_ROLE();
  const DISTRIBUTOR_ROLE = await securePharmaTracker.DISTRIBUTOR_ROLE();
  const AUDITOR_ROLE = await securePharmaTracker.AUDITOR_ROLE();


  await securePharmaTracker.grantRole(MANUFACTURER_ROLE, deployer.address);
  await securePharmaTracker.grantRole(DISTRIBUTOR_ROLE, deployer.address);
  await securePharmaTracker.grantRole(AUDITOR_ROLE, deployer.address);


  console.log("✅ Roles granted to deployer for testing");


  // Create a sample batch for demonstration
  console.log("\n📋 Creating sample batch for demonstration...");
  
  const currentTime = Math.floor(Date.now() / 1000);
  const expiryTime = currentTime + (365 * 24 * 60 * 60); // 1 year from now
  
  const tx = await securePharmaTracker.createBatch(
    "BATCH001",
    "Aspirin 500mg",
    1000,
    expiryTime
  );
  
  await tx.wait();
  console.log("✅ Sample batch 'BATCH001' created successfully");


  // Add quality test to the sample batch
  const testTx = await securePharmaTracker.addQualityTest(
    "BATCH001",
    "Purity Test",
    "99.5% Pure - PASSED"
  );
  
  await testTx.wait();
  console.log("✅ Quality test added to sample batch");


  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉");
  console.log("=".repeat(60));
  console.log(`📋 Copy this contract address to your Replit frontend:`);
  console.log(`📍 ${contractAddress}`);
  console.log("=".repeat(60));


  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    sampleBatch: "BATCH001"
  };


  console.log("\n📄 Deployment Summary:", JSON.stringify(deploymentInfo, null, 2));


  return contractAddress;
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((contractAddress) => {
    console.log(`\n🔗 Contract deployed at: ${contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });