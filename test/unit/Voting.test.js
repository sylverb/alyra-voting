const { ethers } = require('hardhat');
const { expect, assert } = require('chai');

describe("Test Voting", function() {

    let owner, addr1, addr2, addrNotRegistered

    describe("Initialization", function() {

        beforeEach(async function() {
            [owner, addr1, addr2] = await ethers.getSigners() //Récupère les comptes hardhat de test
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
        })

        it('should deploy the smart contract', async function() {
            let theOwner = await voting.owner()
            assert.equal(owner.address, theOwner)
        })
    })

    describe("RegisteringVoters state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2] = await ethers.getSigners() //Récupère les comptes hardhat de test
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
        })

        it('shall add a voter if the owner', async function() {
            const findEvent = await voting.addVoter(addr1.address)
            await expect(findEvent)
            .to.emit(
                voting, 
                'VoterRegistered'
            )
            .withArgs(
                addr1.address
            )
        })

        it('shall not add a voter if NOT the owner', async function() {
            await expect(voting.connect(addr1).addVoter(addr1.address)).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('shall not add a voter already added', async function() {
            await voting.addVoter(addr1.address)
            await expect(voting.addVoter(addr1.address)).to.be.revertedWith('Already registered')
        })

        it('add a voter and go to next state', async function() {
            let findEvent = await voting.addVoter(addr1.address)
            await expect(findEvent)
            .to.emit(
                voting, 
                'VoterRegistered'
            )
            .withArgs(
                addr1.address
            )

            findEvent = await voting.startProposalsRegistering()
            await expect(findEvent)
            .to.emit(
                voting, 
                'WorkflowStatusChange'
            )
            .withArgs(
                0,
                1
            )
        })

        it('shall not add proposal in this state', async function() {
            await voting.addVoter(addr1.address)
            await expect(voting.connect(addr1).addProposal("Proposition 1")).to.be.revertedWith('Proposals are not allowed yet')
        })

        it('shall not vote in this state', async function() {
            await voting.addVoter(addr1.address)
            await expect(voting.connect(addr1).setVote(0)).to.be.revertedWith('Voting session havent started yet')
        })

        it('shall get correct voter info if asking info for a registered voter', async function() {
            const registeredVoter = {
                isRegistered: true,
                hasVoted: false,
                votedProposalId: ethers.BigNumber.from(0),
            };
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)
            const { isRegistered, hasVoted, votedProposalId } = await voting.connect(addr1).getVoter(addr2.address)
            expect ({ isRegistered, hasVoted, votedProposalId }).to.be.deep.equal(registeredVoter)
        })

        it('shall get correct voter info if asking info for an unregistered voter', async function() {
            const unregisteredVoter = {
                isRegistered: false,
                hasVoted: false,
                votedProposalId: ethers.BigNumber.from(0),
            };
            await voting.addVoter(addr1.address)
            const { isRegistered, hasVoted, votedProposalId } = await voting.connect(addr1).getVoter(addr2.address)
            expect ({ isRegistered, hasVoted, votedProposalId }).to.be.deep.equal(unregisteredVoter)
        })
    })

    describe("ProposalsRegistrationStarted state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2, addrNotRegistered] = await ethers.getSigners() //Récupère les comptes hardhat de test
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
            // Register addr1 and addr2
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)
            // Start proposals registering
            await voting.startProposalsRegistering()
        })

        it('shall accept a proposal from a registered user', async function() {
            const findEvent = await voting.connect(addr1).addProposal("Proposition 1")
            await expect(findEvent)
            .to.emit(
                voting, 
                'ProposalRegistered'
            )
            .withArgs(
                1
            )
        })

        it('2 registered users add several proposals', async function() {
            var findEvent = await voting.connect(addr1).addProposal("Proposition 1")
            await expect(findEvent)
            .to.emit(
                voting, 
                'ProposalRegistered'
            )
            .withArgs(
                1
            )
            findEvent = await voting.connect(addr2).addProposal("Proposition 2")
            await expect(findEvent)
            .to.emit(
                voting, 
                'ProposalRegistered'
            )
            .withArgs(
                2
            )
            findEvent = await voting.connect(addr1).addProposal("Proposition 3")
            await expect(findEvent)
            .to.emit(
                voting, 
                'ProposalRegistered'
            )
            .withArgs(
                3
            )
        })
        it('shall not add an empty proposal', async function() {
            await expect(voting.connect(addr1).addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer")
        })
        it('shall not add a voter in ProposalsRegistrationStarted state', async function() {
            await expect(voting.addVoter(addr1.address)).to.be.revertedWith('Voters registration is not open yet')
        })
        it('shall not add a proposal if not registered', async function() {
            await expect(voting.connect(addrNotRegistered).addProposal("Proposition 1")).to.be.revertedWith("You're not a voter")
        })
        it('shall get proposal if voter', async function() {
            await voting.connect(addr1).addProposal("Proposition 0")
            await voting.connect(addr2).addProposal("Proposition 1")
            await voting.connect(addr1).addProposal("Proposition 2")
            const proposal = await voting.connect(addr1).getOneProposal(1)
            console.log(proposal)
        })
    })

    describe("VotesTallied state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2, addrNotRegistered] = await ethers.getSigners() //Récupère les comptes hardhat de test
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()

            // Register addr1 and addr2
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)

            // Start proposals registering
            await voting.startProposalsRegistering()

            // register proposals
            await voting.connect(addr1).addProposal("Proposition 0")
            await voting.connect(addr2).addProposal("Proposition 1")
            await voting.connect(addr1).addProposal("Proposition 2")

            // End proposal registering
            await voting.endProposalsRegistering()

            // Start voting
            await voting.startVotingSession()

            // Voting
            await voting.connect(addr1).setVote(1)
            await voting.connect(addr2).setVote(1)

            // End voting
            await voting.endVotingSession()

        })

        it('Check winner is "Proposition 1"', async function() {
            // Tally votes
            const findEvent = await voting.tallyVotes()
            await expect(findEvent)
            .to.emit(
                voting, 
                'WorkflowStatusChange'
            )
            .withArgs(
                4,
                5
            )
            const winner = await voting.winningProposalID()
            assert(winner.toString() === "1")
        })
    })


/*
        it('should NOT deposit Ethers if not enough funds provided', async function() {
            let etherQuantity = ethers.utils.parseEther('0.09');
            await expect(bank.deposit({ value: etherQuantity })).to.revertedWith('not enough funds provided')
        })

        it('should deposit Ethers if Owner and if enough funds provided', async function() {
            let etherQuantity = ethers.utils.parseEther('0.1');
            await expect(bank.deposit({ value: etherQuantity }))
            .to.emit(
                bank, 
                'Deposit'
            )
            .withArgs(
                owner.address, 
                etherQuantity
            )
            let balanceOfBank = await ethers.provider.getBalance(bank.address)
            assert.equal(balanceOfBank.toString(), "100000000000000000")
            //assert.equal(balanceOfBank.eq(etherQuantity), true)
        })*/
/*
    describe('Withdraw', function() {
        beforeEach(async function() {
            [owner, addr1, addr2] = await ethers.getSigners() //Récupère les comptes hardhat de test
            let contract = await hre.ethers.getContractFactory("Bank")
            bank = await contract.deploy()

            let etherQuantity = ethers.utils.parseEther('0.1');
            let transaction = await bank.deposit({ value: etherQuantity })
            await transaction.wait()        
        })

        it('should NOT withdraw if NOT the owner', async function() {
            let etherQuantity = ethers.utils.parseEther('0.1');
            await expect(bank.connect(addr1).withdraw(etherQuantity)).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('should NOT withdraw if the owner tries to withdraw too much ethers', async function() {
            let etherQuantity = ethers.utils.parseEther('0.2');
            await expect(bank.withdraw(etherQuantity)).to.be.revertedWith('you cannot withdraw this much')
        })

        it('should withdraw if the owner try to withdraw and the amount is correct', async function() {
            let etherQuantity = ethers.utils.parseEther('0.1');
            await expect(bank.withdraw(etherQuantity))
            .to.emit(
                bank, 
                'Withdraw'
            )
            .withArgs(
                owner.address, 
                etherQuantity
            )
        })
    })*/

})