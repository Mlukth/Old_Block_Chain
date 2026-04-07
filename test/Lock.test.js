const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lock", function () {
  let lock;
  let owner;
  let addr1;
  let addr2;
  let unlockTime;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    unlockTime = (await ethers.provider.getBlock("latest")).timestamp + 10;
    const Lock = await ethers.getContractFactory("Lock");
    lock = await Lock.deploy(unlockTime, { value: ethers.utils.parseEther("1.0") });
  });

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      expect(await ethers.provider.getBalance(lock.address)).to.equal(
        ethers.utils.parseEther("1.0")
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      await expect(
        lock.deploy(1234567890, { value: ethers.utils.parseEther("1.0") })
      ).to.be.revertedWith("Unlock time should be in the future");
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet");
      });

      it("Should revert with the right error if called from another account", async function () {
        const lockedBalance = await ethers.provider.getBalance(lock.address);
        await expect(lock.connect(addr1).withdraw()).to.be.revertedWith("You aren't the owner");
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [unlockTime]);
        await ethers.provider.send("evm_mine");

        const lockedBalance = await ethers.provider.getBalance(lock.address);
        await expect(lock.withdraw()).to.changeEtherBalances(
          [lock, owner],
          [-lockedBalance, lockedBalance]
        );
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [unlockTime]);
        await ethers.provider.send("evm_mine");

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(ethers.utils.parseEther("1.0"), unlockTime);
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        await ethers.provider.send("evm_setNextBlockTimestamp", [unlockTime]);
        await ethers.provider.send("evm_mine");

        await expect(lock.withdraw()).to.changeEtherBalances(
          [lock, owner],
          [ethers.utils.parseEther("0"), ethers.utils.parseEther("1.0")]
        );
      });
    });
  });
});