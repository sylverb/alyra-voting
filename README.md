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
![alt text](https://github.com/sylverb/alyra-voting/blob/main/data/tests.png?raw=true)

## Résultat de la couverture de test :
![alt text](https://github.com/sylverb/alyra-voting/blob/main/data/coverage.png?raw=true)