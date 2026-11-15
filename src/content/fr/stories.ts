import type { StoryTexts } from '../types';

/**
 * Les répliques alternent entre l’appelant et l’appelé, en commençant par
 * l’appelant. Noms, lieux et événements sont fictifs.
 */
export const stories: StoryTexts = {
  grocery: {
    title: 'L’offre',
    fragments: [
      [
        'Docteur, c’est Walt Hollis. Personne n’est malade. Il me faut un homme qui sait garder un secret.',
        'J’en garde depuis trente ans, Walt. Allez-y.',
        'Un type de la ville veut racheter le magasin. Il veut en faire un de ces libres-services.',
        'Et Mae, qu’est-ce qu’elle en dit ?',
      ],
      [
        'Monsieur Hollis ? Vernon Platt, chambre six. J’ai fait préparer les papiers.',
        'Je vous ai dit que j’y réfléchirais, monsieur Platt.',
        'Réfléchissez vite. L’offre repart par le train de vendredi, et moi aussi.',
      ],
      [
        'Ida, ça fait vingt ans qu’on est voisins. Si je vendais, tu m’en voudrais ?',
        'J’en voudrais surtout à la vitrine vide. Qui me ferait crédit pour la farine ?',
        'Personne, j’imagine. Ils ne font pas crédit, ces nouveaux magasins.',
      ],
      [
        'Walt, la Gazette a entendu dire que tu vendais. Un commentaire ?',
        'La Gazette entend beaucoup de choses par ce standard, dirait-on.',
        'Ha. Alors c’est vrai ?',
        'Écris que je n’ai pas décidé. Ce sera vrai jusqu’à vendredi.',
      ],
      [
        'Walt, Mae est passée chercher ses cachets pour le cœur. Elle m’a parlé de l’argent.',
        'C’est beaucoup d’argent, docteur. On pourrait se reposer.',
        'Tu te reposerais une semaine. Ensuite tu viendrais remplir mon garde-manger gratis, par ennui.',
      ],
      [
        'Monsieur Platt, ici Hollis. Je ne signerai pas.',
        'Il y aura un magasin comme le mien dans cette ville d’ici deux ans. Avec ou sans vous.',
        'Qu’ils le construisent. Les gens savent où me trouver.',
      ],
      [
        'Ida, demain en une : « Hollis reste. » Je voulais que tu sois la première au courant.',
        'Dieu le bénisse. Je vais lui faire un gâteau grand comme un enjoliveur.',
        'Garde-m’en une part. Le maire est furieux, il voulait les impôts.',
      ],
    ],
    epilogue:
      'L’épicerie Hollis est restée ouverte onze ans de plus. Le libre-service est venu quand même, au bord de la nationale.',
  },

  looms: {
    title: 'Les nouveaux métiers',
    fragments: [
      [
        'Doyle, ici le bureau. Les nouveaux métiers à tisser arrivent le premier du mois.',
        'Ils remplacent combien d’hommes ?',
        'La direction parle de « réorganiser l’atelier ».',
        'Ce n’est pas un chiffre, monsieur Kemp.',
      ],
      [
        'Sal, garde-moi l’arrière-salle jeudi soir. Les gars veulent parler.',
        'Parler, ou crier ?',
        'Ça dépendra de ce que je leur dis.',
      ],
      [
        'Monsieur Doyle, c’est Mme Abbott. Trois de mes pensionnaires demandent s’ils doivent chercher ailleurs.',
        'Dites-leur de patienter. Rien n’est décidé.',
        'Ils paient leur loyer avec cette filature, monsieur Doyle. Et moi aussi, à bien y penser.',
      ],
      [
        'Capitaine, c’est le pasteur. Nous faisons une collecte pour les familles de la filature, au cas où.',
        'Mettez la caserne pour vingt dollars. Les gars porteront les cartons.',
        'Merci. Espérons ne jamais avoir à les ouvrir.',
      ],
      [
        'Monsieur Kemp, j’ai une proposition. Formez les hommes aux nouveaux métiers au lieu de les renvoyer.',
        'La formation prend du temps, Doyle. Le temps, c’est de l’argent.',
        'Embaucher des inconnus qui ne connaissent pas l’atelier aussi. Donnez-moi huit semaines.',
      ],
      [
        'Madame Abbott ? Sal, à la Lanterne. Votre pensionnaire Peter fait la fête ici depuis midi.',
        'La fête pour quoi ?',
        'Kemp a dit oui à Doyle. Personne n’est renvoyé. Ils apprennent les nouvelles machines.',
      ],
      [
        'Doyle, le premier métier tourne. Deux fois plus de tissu, deux fois moins de bruit.',
        'Et les hommes ?',
        'Ils apprennent plus vite que moi. Vous aviez raison. Ne le répétez à personne.',
      ],
    ],
    epilogue:
      'Les nouveaux métiers ont tourné vingt ans à la filature de Larkfield. Doyle y a formé chaque homme lui-même.',
  },

  waltz: {
    title: 'La valse du colonel',
    fragments: [
      [
        'Mademoiselle Lindqvist, colonel Haverty. Je souhaite prendre des leçons. De valse, précisément.',
        'À votre âge, colonel ? Je veux dire : bien sûr. Une raison particulière ?',
        'Le bal de printemps du maire. Et je n’en dirai pas plus.',
      ],
      [
        'Greta, ma chère, on a vu le colonel sortir de chez vous en fredonnant. En fredonnant !',
        'Des leçons, madame Pruitt. Rien que des leçons.',
        'Mais avec qui compte-t-il donc danser ?',
        'Je suis tenue au secret. Mais une robe neuve ne serait pas de trop.',
      ],
      [
        'Whitlock, à propos du bal. Mme Pruitt est-elle sur la liste des invités ?',
        'Elle préside le comité, Haverty. C’est elle qui a écrit la liste.',
        'Alors j’ose croire que j’y figure.',
      ],
      [
        'Monsieur le juge, une question en théorie. Serait-il inconvenant qu’une veuve depuis six ans danse ?',
        'En théorie, Edith, je trouverais inconvenant qu’elle s’en prive.',
      ],
      [
        'Colonel, vous avez encore compté jusqu’à quatre. C’est une valse. Un, deux, trois.',
        'Quarante ans de marche au pas, mademoiselle. Mes pieds sont têtus.',
        'Alors laissez votre cœur compter. Il a l’air de connaître le chemin.',
      ],
      [
        'Ashford, vous avez vu le colonel et Mme Pruitt hier soir ? Trois valses !',
        'Quatre. Je les ai comptées. Et il ne lui a marché sur le pied que deux fois.',
        'Pariez l’argent de la ville sur un mariage en juin.',
      ],
    ],
    epilogue:
      'Edith Pruitt et le colonel Haverty se sont mariés en juin. Mlle Lindqvist a joué la valse.',
  },

  crossing: {
    title: 'La dernière traversée',
    fragments: [
      [
        'Amos, c’est Ned, au bac. Il paraît que le comté a voté l’argent.',
        'Pour le pont ? Je l’ai entendu aussi. En acier, à deux voies.',
        'Quarante et un ans que je tire cette corde.',
      ],
      [
        'Ned, ici Merriweather. Tu peux prendre le camion de lait demain à six heures ?',
        'Je le prendrai à six heures tant que je serai là, John.',
        'Tu seras là. Un pont, ça prend des années.',
      ],
      [
        'Ned, Quill, au chantier. Quand le pont ouvrira, que deviendra la vieille ?',
        'Le bac ? À la ferraille, je suppose. Il appartient au comté.',
        'Pas si je l’achète avant. Il ferait un beau bateau de promenade.',
      ],
      [
        'Docteur Rourke ? Le Bluebell prépare une fête d’adieu pour le bac de Ned. Vous jouez toujours du violon ?',
        'Seulement pour les vaches et les amis proches.',
        'Ned est un ami proche.',
        'Alors je vais l’accorder.',
      ],
      [
        'Ned, ils coulent la dernière travée cette semaine. Tu la verras depuis l’embarcadère.',
        'Je l’ai regardé pousser comme une mauvaise herbe, Amos.',
        'Monte à l’écluse après. J’ai gardé une bouteille.',
      ],
      [
        'Quill, le comté dit oui. Il est à toi pour un dollar, si je reste son capitaine.',
        'Un dollar et un capitaine ? La meilleure affaire de ma vie.',
      ],
      [
        'John, amène toute la famille samedi. Dernière traversée au coucher du soleil, puis on danse.',
        'Les enfants veulent prendre le pont et le bac, les deux.',
        'Alors qu’ils prennent les deux. C’est le soir pour ça.',
      ],
    ],
    epilogue:
      'Le pont a ouvert en octobre. Le vieux bac a promené les pique-niques d’été sur la rivière pendant vingt ans encore.',
  },

  longDistance: {
    title: 'Interurbain',
    fragments: [
      [
        'Maman ? C’est Clara ! Je t’appelle de la ville !',
        'Clara ! Tout va bien ? Ça doit coûter une fortune.',
        'Trois minutes, promis. Maman, je suis standardiste maintenant. Au grand central, en ville.',
      ],
      [
        'Maman, on est deux cents sur un seul étage. Deux cents ! Et ce bruit !',
        'Ils te nourrissent correctement, au moins ?',
        'Je mange un sandwich debout. Je n’ai jamais été aussi heureuse.',
      ],
      [
        'Monsieur le pasteur ? Clara Abbott, j’appelle de la ville. Maman va bien ? Elle a l’air fatiguée.',
        'Elle travaille trop, Clara. Mais elle lit tes lettres à toute la paroisse.',
        'Toutes ? Oh non.',
      ],
      [
        'Maman, ils installent des machines. Les gens composeront eux-mêmes l’interurbain.',
        'Des machines ? Et toi, que feras-tu ?',
        'Ils disent qu’il y aura toujours du travail pour nous. Ils disent beaucoup de choses.',
      ],
      [
        'Maman, mon étage ferme à la fin du mois. La moitié d’entre nous sont renvoyées.',
        'Alors rentre, ma chérie. Ta chambre est là. Elle l’a toujours été.',
        'Il y a encore quelqu’un au standard, à Larkfield ? Quelqu’un de vrai, qui répond ?',
        'Pour l’instant. Elle nous écoute, je parie. Dis-lui bonjour.',
      ],
      [
        'Maman, je suis à la gare. Le train de sept heures quarante. Laisse la lumière du perron allumée.',
        'Elle est allumée depuis ton appel, Clara.',
      ],
    ],
    epilogue:
      'Clara Abbott est rentrée et a tenu la pension après sa mère. Elle n’a jamais passé un appel sans dire merci.',
  },
};
