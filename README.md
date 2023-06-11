# Hardhat Voting Project

## Tests automatiques

Les tests automatiques du projet de voting ont été organisés comme suit :
### Test de déploiement
Le test vérifie simplement le déploiement du smart contract
### Vérification sur les transitions d'état du contrat de voting
Les tests vérifient que les transitions impossibles sont bien revert, par exemple il n'est pas possible de passer de l'état RegisteringVoters à l'état ProposalsRegistrationEnded
### Vérification sur le fait que seul le owner peut effectuer les différentes demandes de transitions
Les tests vérifient simplement que si quelqu'un d'autre que le owner essaye d'appeler une des différentes fonctions de transition, l'appel sera revert avec la cause attendue

### Tests sur l'état RegisteringVoters
Les tests vérifient les différentes actions possible dans cet état : vérification de l'ajout de voters, des différents cas d'erreurs et transition vers l'état suivant.
On teste aussi l'impossibilité d'effectuer certaines actions dans cet état (voter, ajouter un proposition de vote, ...) 

### Tests sur l'état  ProposalsRegistrationStarted :
Les tests vérifient les différentes actions possible dans cet état : ajout d'une proposition de vote et ses différents cas d'erreurs, consultation d'une proposition de vote et ses différents cas d'errreur et transition vers l'état suivant.

### Tests sur l'état  ProposalsRegistrationEnded :
Le test vérifie la transition vers l'état suivant.

### Tests sur l'état  VotingSessionStarted :
Les tests vérifient les différentes actions possible dans cet état : vote pour une proposition et ses différents cas d'erreur et transition vers l'état suivant.

### Tests sur l'état  VotingSessionEnded :
Le test vérifie la transition vers l'état suivant.

### Tests sur l'état  VotesTallied :
Le test vérifie que le vainqueur correspond bien aux votes indiqués.

## Philosophie des tests :
- On ne vérifie les events que dans quelques tests dédiés, ils ne sont pas vérifiés systématiquement pour alléger la lecture des tests car ce n'est plus nécessaire
- La vérification du type BigNumber n'est faite que quand cela est indispensable, en effet le type n'aura pas une importance pour le bon fonctionnement de la dapp !
- Les tests pourraient être beaucoup plus poussés et l'utilisation de fonctions javascript pour factoriser certains enchainements pourrait être effectués, mais ça n'est pas forcément utile dans le cadre de cet exercice

## Résultats de tests :
  Test Voting
+ Initialization
      ✔ should deploy the smart contract
+ Check not possible states transitions
      ✔ shall revert startProposalsRegistering from not expected state (69ms)
      ✔ shall revert endProposalsRegistering from not expected state
      ✔ shall revert startVotingSession from not expected state
      ✔ shall revert endVotingSession from not expected state
      ✔ shall revert tallyVotes from not expected state
+ Check only owner can trigger states transitions
      ✔ shall revert startProposalsRegistering if not owner
      ✔ shall revert endProposalsRegistering if not owner
      ✔ shall revert startVotingSession if not owner
      ✔ shall revert endVotingSession if not owner
      ✔ shall revert tallyVotes if not owner
+ RegisteringVoters state
      ✔ shall add a voter and send event if the owner
      ✔ shall revert if adding a voter while not the owner
      ✔ shall not add a voter already added
      ✔ shall go to ProposalsRegistrationStarted state and send event
      ✔ shall not add proposal in this state
      ✔ shall not vote in this state
      ✔ shall get correct voter info if asking info for a registered voter (38ms)
      ✔ shall get correct voter info if asking info for an unregistered voter address
      ✔ shall revert if non voter is asking for voter info
+ ProposalsRegistrationStarted state
      ✔ shall accept a proposal from a registered user and send event
      ✔ 2 registered users add several proposals and send events (50ms)
      ✔ shall not add an empty proposal
      ✔ shall not add a voter in ProposalsRegistrationStarted state
      ✔ shall not add a proposal if not registered
      ✔ shall get proposal if voter ask for it (57ms)
      ✔ shall revert if non voter request for proposal
      ✔ shall go to ProposalsRegistrationEnded state and send event
+ ProposalsRegistrationEnded state
      ✔ shall go to VotingSessionEnded state and send event
+ VotingSessionStarted state
      ✔ Shall accept vote from a voter and send event
      ✔ Shall increment voteCount for voted proposals (88ms)
      ✔ Shall allow voters to vote only once
      ✔ Shall revert if voter votes for not existing proposal
      ✔ Shall revert if not voter tries to vote
      ✔ Shall go to VotingSessionEnded state and send event
+ VotingSessionEnded state
      ✔ Shall go to VotesTallied state and send event
+ VotesTallied state
      ✔ Check winner is "Proposition 2"

## Résultat de la couverture de test :
File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts/  |      100 |      100 |      100 |      100 |                |
-  Voting.sol |      100 |      100 |      100 |      100 |                |
All files    |      100 |      100 |      100 |      100 |                |
