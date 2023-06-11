const { ethers } = require('hardhat');
const { expect, assert } = require('chai');

describe("Test Voting", function() {

    let owner, addr1, addr2, addr3, addr4, addrNotRegistered

    describe("Initialization", function() {

        beforeEach(async function() {
            [owner, addr1, addr2] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
        })

        it('should deploy the smart contract', async function() {
            let theOwner = await voting.owner()
            assert.equal(owner.address, theOwner)
        })
    })

    describe("Check not possible states transitions", function() {
        beforeEach(async function() {
            [owner] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
        })

        it('shall revert startProposalsRegistering from not expected state', async function() {
            // First go in a state not allowing to go in ProposalsRegistrationStarted
            // The first one is ProposalsRegistrationStarted ...
            await voting.startProposalsRegistering()
            // Then try to make a transition to ProposalsRegistrationStarted
            await expect(voting.startProposalsRegistering()).to.be.revertedWith("Registering proposals cant be started now")
        })

        it('shall revert endProposalsRegistering from not expected state', async function() {
            await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet")
        })

        it('shall revert startVotingSession from not expected state', async function() {
            await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished")
        })

        it('shall revert endVotingSession from not expected state', async function() {
            await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet")
        })

        it('shall revert tallyVotes from not expected state', async function() {
            await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended")
        })
    })

    describe("Check only owner can trigger states transitions", function() {
        beforeEach(async function() {
            [owner,addr1] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
        })

        it('shall revert startProposalsRegistering if not owner', async function() {
            // Then try to make a transition to ProposalsRegistrationStarted
            await expect(voting.connect(addr1).startProposalsRegistering()).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('shall revert endProposalsRegistering if not owner', async function() {
            await expect(voting.connect(addr1).endProposalsRegistering()).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('shall revert startVotingSession if not owner', async function() {
            await expect(voting.connect(addr1).startVotingSession()).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('shall revert endVotingSession if not owner', async function() {
            await expect(voting.connect(addr1).endVotingSession()).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('shall revert tallyVotes if not owner', async function() {
            await expect(voting.connect(addr1).tallyVotes()).to.be.revertedWith('Ownable: caller is not the owner')
        })
    })

    describe("RegisteringVoters state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2, addrUnregistered] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
        })

        it('shall add a voter and send event if the owner', async function() {
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

        it('shall revert if adding a voter while not the owner', async function() {
            await expect(voting.connect(addr1).addVoter(addr1.address)).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('shall not add a voter already added', async function() {
            await voting.addVoter(addr1.address)
            await expect(voting.addVoter(addr1.address)).to.be.revertedWith('Already registered')
        })

        it('shall go to ProposalsRegistrationStarted state and send event', async function() {
            const findEvent = await voting.startProposalsRegistering()
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

        it('shall get correct voter info if asking info for an unregistered voter address', async function() {
            const unregisteredVoter = {
                isRegistered: false,
                hasVoted: false,
                votedProposalId: ethers.BigNumber.from(0),
            };
            await voting.addVoter(addr1.address)
            const { isRegistered, hasVoted, votedProposalId } = await voting.connect(addr1).getVoter(addr2.address)
            expect ({ isRegistered, hasVoted, votedProposalId }).to.be.deep.equal(unregisteredVoter)
        })

        it('shall revert if non voter is asking for voter info', async function() {
            await expect(voting.connect(addrUnregistered).getVoter(addr1.address)).to.be.revertedWith("You're not a voter")
        })
    })

    describe("ProposalsRegistrationStarted state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2, addrNotRegistered] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()
            // Register addr1 and addr2
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)
            // Start proposals registering
            await voting.startProposalsRegistering()
        })

        it('shall accept a proposal from a registered user and send event', async function() {
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

        it('2 registered users add several proposals and send events', async function() {
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
        it('shall get proposal if voter ask for it', async function() {
            await voting.connect(addr1).addProposal("Proposition 1")
            await voting.connect(addr2).addProposal("Proposition 2")
            var proposalData = await voting.connect(addr1).getOneProposal(1)
            expect(proposalData.voteCount).to.equal(0);
            expect(proposalData.description).to.equal('Proposition 1');
            proposalData = await voting.connect(addr1).getOneProposal(2)
            expect(proposalData.voteCount).to.equal(0);
            expect(proposalData.description).to.equal('Proposition 2');
        })
        it('shall revert if non voter request for proposal', async function() {
            await voting.connect(addr1).addProposal("Proposition 1")
            await expect(voting.connect(addrNotRegistered).getOneProposal(0)).to.be.revertedWith("You're not a voter")
        })
        it('shall go to ProposalsRegistrationEnded state and send event', async function() {
            await voting.connect(addr1).addProposal("Proposition 1")
            const findEvent = await voting.endProposalsRegistering()
            await expect(findEvent)
            .to.emit(
                voting, 
                'WorkflowStatusChange'
            )
            .withArgs(
                1,
                2
            )
        })
    })

    describe("ProposalsRegistrationEnded state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()

            // Register voters
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)

            // Start proposals registering
            await voting.startProposalsRegistering()

            // register proposals
            await voting.connect(addr1).addProposal("Proposition 0")
            await voting.connect(addr2).addProposal("Proposition 1")
            await voting.connect(addr1).addProposal("Proposition 2")
        })

        it('shall go to VotingSessionEnded state and send event', async function() {
            // End proposal registering
            const findEvent = await voting.endProposalsRegistering()

            await expect(findEvent)
            .to.emit(
                voting, 
                'WorkflowStatusChange'
            )
            .withArgs(
                1,
                2
            )
        })
    })

    describe("VotingSessionStarted state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2, addr3, addr4, addrNotRegistered] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()

            // Register voters
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)
            await voting.addVoter(addr3.address)
            await voting.addVoter(addr4.address)

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
        })

        it('Shall accept vote from a voter and send event', async function() {
            const findEvent = await voting.connect(addr1).setVote(2)
            await expect(findEvent)
            .to.emit(
                voting, 
                'Voted'
            )
            .withArgs(
                addr1.address,
                2
            )
        })

        it('Shall increment voteCount for voted proposals', async function() {
            // Check that voteCount for proposal 2 is 0
            var proposalData = await voting.connect(addr1).getOneProposal(2)
            expect(proposalData.voteCount).to.equal(0);

            // Vote for proposal 2
            await voting.connect(addr1).setVote(2)

            // Check that voteCount for proposal 2 is now 1
            var proposalData = await voting.connect(addr1).getOneProposal(2)
            expect(proposalData.voteCount).to.equal(1);

            // Vote for proposal 2
            await voting.connect(addr2).setVote(2)

            // Check that voteCount for proposal 2 is now 2
            var proposalData = await voting.connect(addr1).getOneProposal(2)
            expect(proposalData.voteCount).to.equal(2);

            // Check that voteCount for proposal 1 is 0
            var proposalData = await voting.connect(addr1).getOneProposal(1)
            expect(proposalData.voteCount).to.equal(0);

            // Vote for proposal 1
            await voting.connect(addr3).setVote(1)

            // Check that voteCount for proposal 1 is 1
            var proposalData = await voting.connect(addr1).getOneProposal(1)
            expect(proposalData.voteCount).to.equal(1);
        })

        it('Shall allow voters to vote only once', async function() {
            await voting.connect(addr1).setVote(2)
            await expect(voting.connect(addr1).setVote(2)).to.be.revertedWith('You have already voted')
        })
        it('Shall revert if voter votes for not existing proposal', async function() {
            await expect(voting.connect(addr1).setVote(99)).to.be.revertedWith('Proposal not found')
        })
        it('Shall revert if not voter tries to vote', async function() {
            await expect(voting.connect(addrNotRegistered).setVote(2)).to.be.revertedWith("You're not a voter")
        })
        it('Shall go to VotingSessionEnded state and send event', async function() {
            const findEvent = await voting.endVotingSession()
            await expect(findEvent)
            .to.emit(
                voting, 
                'WorkflowStatusChange'
            )
            .withArgs(
                3,
                4
            )
        })
    })

    describe("VotingSessionEnded state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()

            // Register voters
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)
            await voting.addVoter(addr3.address)
            await voting.addVoter(addr4.address)

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
            await voting.connect(addr1).setVote(2)
            await voting.connect(addr2).setVote(2)
            await voting.connect(addr3).setVote(1)
            await voting.connect(addr4).setVote(3)

            // End voting
            await voting.endVotingSession()
        })

        it('Shall go to VotesTallied state and send event', async function() {
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
        })
    })

    describe("VotesTallied state", function() {
        beforeEach(async function() {
            [owner, addr1, addr2, addr3, addr4, addrNotRegistered] = await ethers.getSigners()
            let contract = await ethers.getContractFactory("Voting")
            voting = await contract.deploy()

            // Register voters
            await voting.addVoter(addr1.address)
            await voting.addVoter(addr2.address)
            await voting.addVoter(addr3.address)
            await voting.addVoter(addr4.address)

            // Start proposals registering
            await voting.startProposalsRegistering()

            // register proposals
            await voting.connect(addr1).addProposal("Proposition 1")
            await voting.connect(addr2).addProposal("Proposition 2")
            await voting.connect(addr1).addProposal("Proposition 3")
            await voting.connect(addr4).addProposal("Proposition 4")

            // End proposal registering
            await voting.endProposalsRegistering()

            // Start voting
            await voting.startVotingSession()

            // Voting, winning id is 2
            await voting.connect(addr1).setVote(2)
            await voting.connect(addr2).setVote(2)
            await voting.connect(addr3).setVote(1)
            await voting.connect(addr4).setVote(3)

            // End voting
            await voting.endVotingSession()

            // Tally votes
            voting.tallyVotes()
        })

        it('Check winner is "Proposition 2"', async function() {
            const winner = await voting.winningProposalID()
            assert(winner.toString() === "2")
        })
    })
})