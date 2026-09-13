const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe("SecurePharmaTracker", function () {
  let SecurePharmaTracker;
  let securePharmaTracker;
  let owner;
  let manufacturer;
  let distributor;
  let regulator;
  let auditor;
  let addr1;


  const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
  const DISTRIBUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
  const REGULATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGULATOR_ROLE"));
  const AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUDITOR_ROLE"));


  beforeEach(async function () {
    [owner, manufacturer, distributor, regulator, auditor, addr1] = await ethers.getSigners();


    SecurePharmaTracker = await ethers.getContractFactory("SecurePharmaTracker");
    securePharmaTracker = await SecurePharmaTracker.deploy();
    await securePharmaTracker.waitForDeployment();


    // Grant roles
    await securePharmaTracker.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await securePharmaTracker.grantRole(DISTRIBUTOR_ROLE, distributor.address);
    await securePharmaTracker.grantRole(REGULATOR_ROLE, regulator.address);
    await securePharmaTracker.grantRole(AUDITOR_ROLE, auditor.address);
  });


  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await securePharmaTracker.hasRole(await securePharmaTracker.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
    });


    it("Should assign regulator role to owner", async function () {
      expect(await securePharmaTracker.hasRole(REGULATOR_ROLE, owner.address)).to.equal(true);
    });
  });


  describe("Batch Creation", function () {
    it("Should create a batch successfully", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400; // 1 day from now


      await expect(
        securePharmaTracker.connect(manufacturer).createBatch(
          "BATCH001",
          "Aspirin 500mg",
          1000,
          expiryTime
        )
      ).to.emit(securePharmaTracker, "BatchCreated")
        .withArgs("BATCH001", manufacturer.address, anyValue);
    });


    it("Should fail to create batch with empty batch ID", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;


      await expect(
        securePharmaTracker.connect(manufacturer).createBatch(
          "",
          "Aspirin 500mg",
          1000,
          expiryTime
        )
      ).to.be.revertedWith("Batch ID cannot be empty");
    });


    it("Should fail to create batch with zero quantity", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;


      await expect(
        securePharmaTracker.connect(manufacturer).createBatch(
          "BATCH001",
          "Aspirin 500mg",
          0,
          expiryTime
        )
      ).to.be.revertedWith("Quantity must be greater than 0");
    });


    it("Should fail to create batch with past expiry date", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 86400; // 1 day ago


      await expect(
        securePharmaTracker.connect(manufacturer).createBatch(
          "BATCH001",
          "Aspirin 500mg",
          1000,
          pastTime
        )
      ).to.be.revertedWith("Expiry date must be in the future");
    });


    it("Should fail if non-manufacturer tries to create batch", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;


      await expect(
        securePharmaTracker.connect(addr1).createBatch(
          "BATCH001",
          "Aspirin 500mg",
          1000,
          expiryTime
        )
      ).to.be.revertedWithCustomError(securePharmaTracker, "AccessControlUnauthorizedAccount");
    });
  });


  describe("Quality Testing", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;


      await securePharmaTracker.connect(manufacturer).createBatch(
        "BATCH001",
        "Aspirin 500mg",
        1000,
        expiryTime
      );
    });


    it("Should add quality test successfully", async function () {
      await expect(
        securePharmaTracker.connect(manufacturer).addQualityTest(
          "BATCH001",
          "Purity Test",
          "99.5% Pure - PASSED"
        )
      ).to.emit(securePharmaTracker, "QualityTestAdded")
        .withArgs("BATCH001", "Purity Test", "99.5% Pure - PASSED");
    });


    it("Should retrieve quality test result", async function () {
      await securePharmaTracker.connect(manufacturer).addQualityTest(
        "BATCH001",
        "Purity Test",
        "99.5% Pure - PASSED"
      );


      const result = await securePharmaTracker.getQualityTest("BATCH001", "Purity Test");
      expect(result).to.equal("99.5% Pure - PASSED");
    });


    it("Should fail to add quality test to non-existent batch", async function () {
      await expect(
        securePharmaTracker.connect(manufacturer).addQualityTest(
          "NONEXISTENT",
          "Purity Test",
          "99.5% Pure - PASSED"
        )
      ).to.be.revertedWith("Batch does not exist");
    });
  });


  describe("Batch Status Updates", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;




      await securePharmaTracker.connect(manufacturer).createBatch(
        "BATCH001",
        "Aspirin 500mg",
        1000,
        expiryTime
      );
    });


    it("Should update batch status successfully", async function () {
      await expect(
        securePharmaTracker.connect(manufacturer).updateBatchStatus("BATCH001", 1) // QUALITY_TESTED
      ).to.emit(securePharmaTracker, "BatchStatusUpdated")
        .withArgs("BATCH001", 1, anyValue);
    });


    it("Should fail invalid status transition", async function () {
      await expect(
        securePharmaTracker.connect(manufacturer).updateBatchStatus("BATCH001", 3) // DISTRIBUTED (invalid from MANUFACTURED)
      ).to.be.revertedWith("Invalid status transition");
    });
  });


  describe("Batch Recall", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;




      await securePharmaTracker.connect(manufacturer).createBatch(
        "BATCH001",
        "Aspirin 500mg",
        1000,
        expiryTime
      );
    });


    it("Should recall batch successfully", async function () {
      await expect(
        securePharmaTracker.connect(regulator).recallBatch(
          "BATCH001",
          "Quality control failure"
        )
      ).to.emit(securePharmaTracker, "BatchRecalled")
        .withArgs("BATCH001", "Quality control failure", anyValue);
    });


    it("Should fail to recall with empty reason", async function () {
      await expect(
        securePharmaTracker.connect(regulator).recallBatch("BATCH001", "")
      ).to.be.revertedWith("Recall reason cannot be empty");
    });
  });


  describe("Batch Information Retrieval", function () {
    beforeEach(async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;


      await securePharmaTracker.connect(manufacturer).createBatch(
        "BATCH001",
        "Aspirin 500mg",
        1000,
        expiryTime
      );
    });


    it("Should retrieve batch information correctly", async function () {
      const batchInfo = await securePharmaTracker.getBatchInfo("BATCH001");
      
      expect(batchInfo[0]).to.equal("BATCH001"); // batchId
      expect(batchInfo[1]).to.equal("Aspirin 500mg"); // drugName
      expect(batchInfo[2]).to.equal(manufacturer.address); // manufacturer
      expect(batchInfo[3]).to.equal(1000); // quantity
      expect(batchInfo[6]).to.equal(0); // status (MANUFACTURED)
    });


    it("Should fail to retrieve non-existent batch", async function () {
      await expect(
        securePharmaTracker.getBatchInfo("NONEXISTENT")
      ).to.be.revertedWith("Batch does not exist");
    });
  });


  describe("Emergency Functions", function () {
    it("Should pause and unpause contract", async function () {
      await securePharmaTracker.pause();
      expect(await securePharmaTracker.paused()).to.equal(true);


      await securePharmaTracker.unpause();
      expect(await securePharmaTracker.paused()).to.equal(false);
    });


    it("Should prevent batch creation when paused", async function () {
      await securePharmaTracker.pause();


      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = currentTime + 86400;


      await expect(
        securePharmaTracker.connect(manufacturer).createBatch(
          "BATCH001",
          "Aspirin 500mg",
          1000,
          expiryTime
        )
      ).to.be.revertedWithCustomError(securePharmaTracker, "EnforcedPause");
    });
  });
});