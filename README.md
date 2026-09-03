# CardScope V11.4 — moteur Worker rapide + mains estimées adverses

Version stabilisée après l’audit final Claude.

## Nouveauté V11.4 — mains adverses estimées

- Une petite commande **« Voir les mains estimées »** apparaît uniquement dans le bloc de probabilité après actions ; la grille reste donc cachée pendant l’utilisation normale.
- Elle ouvre une grille facultative de **169 types de mains** pour l’adversaire sélectionné. Plus une case est claire, plus cette main est compatible avec ses actions `+ / ++ / +++`.
- Les cartes déjà connues, mortes ou révélées sont retirées automatiquement.
- La grille n’affiche volontairement pas un faux pourcentage : c’est une **compatibilité avec les actions**, pas la probabilité certaine que l’adversaire possède cette main.
- Aucun changement du moteur d’équité V11.2 : cette vue réutilise exactement les poids de pression déjà audités.


## Stabilisation V11.2

- Le Monte-Carlo pondéré est maintenant **adaptatif** : si l'échantillon utile est trop faible, CardScope poursuit automatiquement les simulations jusqu'à viser environ **5 000 observations utiles**, avec un plafond de **8×** la précision choisie.
- Aucun nouveau bouton : la précision choisie reste le minimum de simulations ; CardScope n'en fait davantage que lorsque les actions adverses rendent l'estimation statistiquement fragile.
- Les valeurs exactes et le modèle `+ / ++ / +++` sont inchangés par rapport à la V11.1 auditée.


## Corrections V11.2

- Répare le bug bloquant de V11.0 : `bestCurrentCategory`, `detectDraws` et `updateQuickRead` sont rétablies.
- Corrige **Cartes qui peuvent t’aider** : une amélioration créée uniquement par le board n’est plus comptée comme une aide personnelle.
- La valeur **D’ici river** utilise désormais une probabilité personnelle : la combinaison finale doit être supérieure à la combinaison portée par le board seul.
- Intègre le moteur bitmask `engine.js` dans un **Web Worker** : le calcul lourd ne bloque plus l’interface.
- Le calcul exact automatique monte jusqu’à environ **2,6 millions de distributions** ; sinon CardScope passe en Monte-Carlo.
- Le modèle de pression V11 (`+ / ++ / +++`) est porté dans le moteur rapide avec la même isolation Préflop / Flop / Turn / River.
- Les cartes mortes et les cartes révélées restent retirées du paquet.
- En l’absence de Web Worker (ex. ouverture directe en `file://`), le moteur fonctionne en repli sur le thread principal.

## Actions adverses

- `+` : action forte
- `++` : action très forte
- `+++` : tout engager / pression maximale

CardScope affiche ensuite la proba normale, la proba après actions adverses, la variation en points, la fiabilité et le verdict vert / orange / rouge.

## Déploiement GitHub Pages

Place les **10 fichiers** du ZIP directement à la racine du dépôt. Après mise à jour d’une ancienne PWA, fais une actualisation forcée une fois (`Ctrl+F5`) pour purger le cache.


## Finition V11.4
- Worker de calcul **persistant** : il est réutilisé entre les calculs au lieu d'être recréé à chaque fois.
- Annulation silencieuse d'un ancien calcul : pas de faux message d'erreur dans la console.
- Repli automatique sur le moteur principal si le Worker ne peut pas démarrer ou rencontre une erreur.
- Passe automatique relevée jusqu'à **50 000 simulations** selon la précision choisie.
- Libellé de la grille clarifié : **compatibilité** avec les actions.
