var LanguageModel = function() {  
  this.DEBUG = false;
  this.nGramFrequencies = {};
  this.nGramProbabilities = {};
  this.numberOfMicroposts = 0;
};

LanguageModel.prototype.getNGrams = function(text, nGramSize) {
  if (!text) {
    return;
  }
  // defaulting to trigrams, also see
  // http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.42.4093
  if (!nGramSize) {
    nGramSize = 3;
  }
  // regexes mostly based on
  // https://github.com/cramforce/streamie/blob/master/public/lib/stream/streamplugins.js
  var URL_REGEX = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig
  var HASHTAG_REGEX = /(^|\s)\#(\S+)/g;
  var USER_REGEX = /(^|\W)\@([a-zA-Z0-9_]+)/g;
  var nGramRegEx = new RegExp('.{' + nGramSize + '}', 'g');
  if (this.DEBUG === true) console.log('Before normalization: ' + text);
  // remove typical Twitter lingo, loosly based on
  // https://support.twitter.com/articles/166337-the-twitter-glossary
  text = text.replace(/\bRT\s+@/g, '@'); // remove "RT" (RT @twitterName)
  text = text.replace(/\bOH:?\s/g, ''); // remove "OH" (OverHeard) 
  text = text.replace(/\bHT:?\s/g, ''); // remove "HT" (HeardThrough)   
  text = text.replace(/\bDM\b/g, ''); // remove "DM" (DirectMessage)   
  text = text.replace(/\bretweets?\b/gi, ''); // remove "ReTweet"
  text = text.replace(/\bspam\b/gi, ''); // remove "spam"
  text = text.replace(/\b\(cont\)\b/gi, ''); // remove "(cont)" (TwitLonger)
  text = text.replace(/\b[Vv]ia:?\s+@/g, '@'); // remove "via @twitterName"
  text = text.trim().toLowerCase(); // only consider lower case
  text = text.replace(HASHTAG_REGEX, ''); // remove #hashtags
  text = text.replace(USER_REGEX, ''); // remove @twitterNames
  text = text.replace(URL_REGEX, ''); // remove URLs    
  text = text.replace(/\W/g, ' '); // remove any non-character
  text = text.replace(/\d/g, ' '); // remove any digit
  text = text.replace(/\s+/g, ' '); // remove multiple spaces    
  if (this.DEBUG === true) console.log('After normalization:  ' + text);
  var nGrams = text.match(nGramRegEx); // split in n-grams  
  // deduplicate ngrams, neat trick stolen from
  // http://stackoverflow.com/questions/7683845/removing-duplicates-from-an-array-in-javascript
  nGrams = Object.keys(nGrams.reduce(function(r, v) {
    return r[v] = 1, r;
  }, {}));
  return nGrams;
};

LanguageModel.prototype.calculateFrequencies = function(nGrams) {
  if (!Array.isArray(nGrams)) {
    return;
  }
  this.numberOfMicroposts += 1;
  var that = this;
  nGrams.forEach(function(nGram) {
    if (that.nGramFrequencies.hasOwnProperty(nGram)) {
      that.nGramFrequencies[nGram]++;
    } else {
      that.nGramFrequencies[nGram] = 1;
    }
  });
  return this.nGramFrequencies;
};

LanguageModel.prototype.getNGramProbability = function(nGram) {
  if (!this.nGramFrequencies[nGram]) {
    // pseudocount for zero-count possibilities
    // ToDo: empirically determine minimumProbability
    var minimumProbability = 0.000001;
    return minimumProbability / this.numberOfMicroposts;
  }
  return this.nGramFrequencies[nGram] / this.numberOfMicroposts;
};

var englishTweets = [
  'Ward Cunningham’s Smallest Federated Wiki Paves Road To Our Curated Future bit.ly/x0Pjcg via @semanticweb by @jenz514 #linkeddata',
  'I heard a new term yesterday. POTATO. Person Over Thirty Acting Twenty One.',
  'How To Write Readable - And Retweetable - Tweets rww.to/zXZqZI',
  'yay, our paper was accepted to #lile2012, the linked learning workshop at #www2012 :) #linkeddata /cc @talisaspire',
  'Daylight Saving Time starts tomorrow night. Hooray!',
  'Nervous Medical Students Await Next Week’s Match Day rww.to/Ay6V3q',
  'RT @sarahebourne: ALL THE SLIDES! #RWD RT @Malarkey ★ All the slides from my full day responsive design workshop bit.ly/yMEdJQ',
  'Somehow William Morris feels like the right/wrong thing to read on a plane to SXSW.',
  'Nice talk by @r4isstatic on linked data at the bbc',
  'amused by how some thinner paperbacks weigh more than some larger hardcovers. All makes sense, just not expected.',
  'Talking about a Korean version of 5 star Open Data at WebSci Korea WG j.mp/AqNRdr #opendata #linkeddata (via @mhausenblas)',
  'For everyone who ask about 2nd edition of Html5 Game course - W3C hopes to get it running before the end of the year, but no dates yet.',
  '3 new tech industry jobs posted to the ReadWriteWeb job board -- jbs.gd/Czjv6 #jobs',
  '@jenit have you tried Visual Source Safe? If you insist on needless pain, do it properly!',
  '@ndw @JeniT @peteduncanson @gklyne @xquery @bensummers for penance I now find myself needing to study hg-git.github.com',
  'Crowdfunding Moves Closer to Congressional Approval rww.to/y33G9C'
];

var germanTweets = [
  '@Ernst_Crameri - Gibt es auch eine Adresse, von Ihnen, unter Facebook? Meine Adresse lautet: facebook.com/Clubmembers - Liebe Grüße vom DiDi',
  '21.11.2011 - Mein heutiger Direkt-Link, in die Live-Sendung (JAZZ-Musik, im Hintergrund), mit Admin, DiDi, unter j-tv.me/vnIx8n --',
  'Hier präsentieren wir Ihnen Gruppen, unserer Mitglieder, von A bis Z, unter http://Groups-A-to-Z.social-network-worldwide.com',
  'Die Domain http://www.DJ-Suchmaschine.de ist online - (DJANE and DJ) - The domain http://www.DJ-Suchmaschine.de is online-GOOD ENTERTAINMENT',
  'http://www.youtube.com/watch?v=Uw5AajrlWzI - Streng Geheim - Top Secret - Community under http://Top-Secret.social-network-worldwide.com',
  'Joyce Fosuah - Africas next Top Model - Fotos und Kontakt under http://vip-model-international.mixxt.com/networks/images/album.56033#images',
  'Im Moment, bin ich am Arbeiten, unter http://www.Social-Network-Worldwide.com und LIVE erreichbar, unter http://justin.tv/VIP_TV LG v. DiDi',
  'Schau mal rein, unter http://German-Tweets.social-network-worldwide.com - Dort kann JEDER GRATIS & KOSTENLOS Werbung machen. VIEL ERFOLG !!',
  'Bei manchen Posts merkt man, wer ein wahrer Freund, bei Twitter, ist. - Admin, ebenso, unter http://www.International-Social-Network.com',
  'Betrachte dieses Video und dann dein eigenes Leben!!! - Nick Vujicic - VIDEO unter http://www.youtube.com/user/ABCDatenbank',
  'Unsere weltweiten Communitys, unter http://German-Tweets.Social-Network-Worldwide.com , präsentieren sich im neuen Update. Viel Erfolg .....',
  'Diskutieren Sie mit unter http://on.fb.me/gFbVpJ , bei verschiedenen Themen, " von A bis Z ", plus Homepages',
  'GESEGNETE WEIHNACHTEN und ein GESUNDES Jahr 2011. Ich wünsche ALLEN das zurück, was Sie mir wünschen. Liebe Grüße - http://bit.ly/ftJcFY',
  'Kennen Sie schon unsere Gruppe " Words-Database " bei Facebook unter http://on.fb.me/c4XdpI - Eine Datenbank für Begriffe und Wörter.',
  'Mithilfe von http://surfer-tausch.club-card.net können Sie kostenlos Ihre Links promoten u. Sie erhalten ohne viel Aufwand tausende Besucher',
  'Unsere Community "German-Tweets" unter http://German-Tweets.social-network-worldwide.com ist größtenteils fertig programmiert. VIEL ERFOLG',
  'Unter http://Midlife-Blues.VIP-Radio.eu/ präsentieren wir Ihnen einen Künstler mit dem Style "Folk, Blues, Spacemusic, Liedermacher ".',
  'Words-Database ist bei Facebook unter http://bit.ly/c4XdpI erreichbar - Words Database is accessible on Facebook under http://bit.ly/c4XdpI',
  'Es gibt Menschen da hätten die Eltern ruhig verhüten können -.- share.golikeus.net/357260 via @GoLikeUs',
  'Diskutieren auch Sie mit unter http://Verkaufte-Kinder.woerter-datenbank.de , in der Datenbank " Top Secret - Streng geheim ".',
  'Diskutieren auch Sie mit unter http://bit.ly/cYYDSt , bei dem Thema " Freie Energie und Levitation ", plus Homepages',
  'Absoluter Geheimtipp für das “Personal” der BRD. Interessante Informationen und Video unter http://bit.ly/duIhU0 - Empfehlung LESENSWERT -',
  'Haha, das müsst Ihr Euch alle anschauen. Viel Spaß damit ;-) http://fb.me/C0l37Hcc',
  'Diskutieren auch Sie mit unter http://bit.ly/aguTpm , bei dem Thema " Bundesrepublik Deutschland - Finanzagentur ", plus Homepages',
  '@Jobangebote24 Unter http://www.Aktion-Arbeit.com können Sie auch KOSTENLOS Ihre Suchanfragen hinterlassen. VIEL ERFOLG damit ....',
  '@Hunalehre Kennen Sie schon die logoistischen Wissenschaften ? Mehr INFOS unter http://logoistische-Wissenschaft.club-card.net',
  'Sollte Ihr PC-Bildschirm mal von INNEN her schmutzig sein? Unter http://Bildschirm-Reinigung.club-card.net haben wir eventuell die Lösung!',
  'Meine eigenen, über 24.000 Domains, werden Step by Step unter http://Domains.grey-network.com eingetragen. Liebe Grüße vom Admin DiDi',
  'Hier unter http://bit.ly/brtDAg erhalten Sie von mir Hintergrundwissen zum Thema GEHIRNTRANSMITTER, mittels privater Vorlesung.',
  'Unsere Community unter http://MeeSales.Social-Network-Worldwide.com und die neue Plattform unter http://www.Mee-Sales.com sind aktualisiert.',
  'Über den Datenschutz; kann ich nur lachen. Meine Meinung darüber finden Sie unter http://bit.ly/csLzgT - (Tipp: http://www.Artikel-19.info )',
  'Hier unter http://www.onlinewahn.de/uhr.htm hab ich was gefunden zum Thema Urheberrechte. Gute Unterhaltung ..... :-)',
  'TOP-SECRET ... Freut euch auf das neue Jahr 2011. In das Internet dann nur noch mit dem neuen PERSONALausweis möglich ... HAPPY NEW YEAR ...',
  'Habe ein Geschenk an euch ALLE - Unter http://Barry-White.VIP-Club-Card.com könnt Ihr gemeinsam mit einer Legende träumen. GUTE UNTERHALTUNG',
  'In dieser Community unter http://DJ-Network.Social-Network-Worldwide.com präsentieren sich DJs und Musiker plus GEMAfreie Musik zum Download',
  'Dieses Video, unter http://bit.ly/arxsjv (Auto - Sex), ist was zum Ablachen - Wuensche allen Tweetern gute Unterhaltung ..... :-)',
  '"George Orwell - 2010" - INFO unter http://bit.ly/cXgx0y - Elektronische Transmitter in Tabletten ... Medikamenteneinnahme überwachen ...',
  '"Jetzt wirds lustig" - INFO unter http://bit.ly/cu5P2q - 31.000 Londoner Polizisten bekamen im Jahr 2008 Mikrochips zur totalen Überwachung',
  'Models & Dressmens u. solche die es werden wollen präsentieren sich unter http://Model.VIP-Model-International.com von ihrer schönsten Seite',
  'TIPP unter http://www.words-search.com - Begriffe und Woerter mit deren Beschreibung plus interessante Diskussionen - Eine Art Woerter-Wiki',
  'Hey TRANCE-Musikliebhaber-Habe hier unter http://bit.ly/7CqftQ geile Mucke. Als Hintergrundmusik beim Surfen nur das Beste.GUTE UNTERHALTUNG',
  'In einer Szene ( http://bit.ly/9QqoaR ), ähnlich der in dem Film "Avatar" richtet Jo Conrad eine Botschaft an die Hintergrundmächte der Welt',
  '@twitt_erfolg_de Danke für den Link und das nette Telefongespräch. Habe die Kontaktanfrage bei Xing bestätigt. Wünsche eine geruhsame Nacht.',
  'Wenn Ihr wissen wollt wie ich aussehe: Unter http://www.Kino.to "Viel Rauch um Nichts" eingeben. Der Bärtige könnte dann ich sein ... :-)',
  'Damit ich ein wenig warm werde, zum Arbeiten, brauch ich natürlich abgefahrene Musik unter http://bit.ly/bblIRk - Gute Unterhaltung damit',
  'Werd mal wieder ein paar geile Videos hochladen unter http://German-Tweets.social-network-worldwide.com Gute Unterhaltung damit, euer Admin',
  'So, mein Tag beginnt jetzt mal... oder soll ich Nacht sagen?... lol... Ja, ja, die Programmierer sind schon ein komisches Volk .... :-)',
  'Ist der EURO schon tot ? Hoch lebe der neue Personalausweis ... unser neues Bezahlsystem der Zukunft ... In diesem Sinne ... Gute Nacht ....',
  'JOB gesucht ? JOB zu vergeben ? Unter http://bit.ly/CimPt können Sie Kleinanzeigen Kostenlos aufgeben; zum Suchen, Finden und mitdiskutieren',
  'Kampfsport mal etwas anders :-) - Lachen Sie mal unter http://bit.ly/a4fTJI so richtig was ab. VIEL SPASS mit diesem Video .... lol ....',
  'Der Toplink bei redir.ec ist heute meiner: http://redir.ec/Asche Danke für die vielen Retweets'
];

var frenchTweets = [
  'Présidentielle 2007 : Kadhafi aurait financé Sarkozy http://www.mediapart.fr/journal/international/120312/presidentielle-2007-kadhafi-aurait-finance-sarkozy via @mediapart',
  'RT @Phildp: L\'escalier qui bibliothèque: Une certaine idée de la France - bit.ly/xoIUF8',
  'pinterest.com/pin/7205766275… "Selon la note, le financement libyen prévu s’élevait au total à 50 millions d’euros. Et les opérations financières...',
  '[Vidéo] Présentation des rapports sur la sécurisation et les évolutions du baccalauréat : dai.ly/wCVBzu #bac',
  'Discours d’Eva Joly à Alizay sur le Pacte écologique pour l’emploi bit.ly/zz4caN #joly #eelv #emploi',
  '17H Eurexpo @romainbgb Tous à Lyon alors Caroline :) cc .@Jeunesactifs69 @romainbgb @sarah_jctr @florencedesruol @xavierberujon @KMartenon',
  'En mairie où je viens de présenter à la presse le Ludopole qui ouvrira au pôle de culture et de loisirs de @Lyon_Confluence le 4 avril #lyon',
  'découvre le dispositif de prévention de l’échec précoce en lecture "Coup de Pouce Clé" à l\'école des Clairs-Bassins à La Charité sur Loire',
  'La nouvelle tranche d’impôt voulue par Hollande, un geste... symbolique lutte-ouvriere.org/notre-actualit…',
  '@delevoye Bon débat avec @bayrou @UFCquechoisir !',
  'RT @delevoye En route pour un débat au #Modem avec @bayrou , Martin Hirsch et Alain Bazot de @UFCquechoisir',
  'En route pour un débat au #Modem avec @bayrou , Martin Hirsch et Alain Bazot de @UFCquechoisir',
  '#waterforum6 Pour @JeanLeonetti, il faut transformer le #PNUE en #OME (Organisation mondiale de l\'environnement)',
  'Meeting de campagne en soutien à #Bayrou ce soir 20h30 au 22 rue de la Belle Feuille (Centre George Gorce, salle n°6) à Boulogne-Billancourt',
  'jurassic park :) RT @carolinedescham:Si vs êtes fan de préhistoire et k vous voulez voir des dinosaures de la toile bit.ly/yc2CYd',
  '"On considère le chef d\'entreprise comme l\'homme à abattre ou une vache à traire,peu voient en lui le cheval qui tire le char" W. Churchill',
  'Présidentielle: pour une procuration à #Issy-les-Moulineaux, contactez-moi : okan.germiyan@yahoo.fr #Bayrou',
  'RT @nousbayrou : François @Bayrou rencontre les lecteurs de Métro, en Une mercredi! instagr.am/p/IE7-2_goxk/ #Bayrou',
  'À 17h au QG de campagne, dialogue autour des associations avec Martin Hirsch, Jean-Paul Delevoye et Alain Bazot is.gd/CjvrZW',
  'RDV le 29 mars 19h à l\'Hôtel de ville de #Beauvais pour une grande réunion publique sur le Pont de Paris. Pour tout savoir, venez nombreux!',
  '#Paris, 4ème ville la plus compétitive au monde, selon cette étude : bit.ly/yNbl0q'
];

// English
var english = new LanguageModel();
englishTweets.forEach(function(tweet) {
  var ngrams = english.getNGrams(tweet);
  english.calculateFrequencies(ngrams);
});
Object.keys(english.nGramFrequencies).forEach(function(nGram) {
  english.nGramProbabilities[nGram] = english.getNGramProbability(nGram);
});
english.nGramProbabilities.default = english.getNGramProbability(false);
// console.log('English ' + JSON.stringify(english).replace(/,/, '\n'));

// German
var german = new LanguageModel();
germanTweets.forEach(function(tweet) {
  var ngrams = german.getNGrams(tweet);
  german.calculateFrequencies(ngrams);
});
Object.keys(german.nGramFrequencies).forEach(function(nGram) {
  german.nGramProbabilities[nGram] = german.getNGramProbability(nGram);
});
german.nGramProbabilities.default = german.getNGramProbability(false);
// console.log('German ' + JSON.stringify(german).replace(/,/, '\n'));

// French
var french = new LanguageModel();
frenchTweets.forEach(function(tweet) {
  var ngrams = french.getNGrams(tweet);
  french.calculateFrequencies(ngrams);
});
Object.keys(french.nGramFrequencies).forEach(function(nGram) {
  french.nGramProbabilities[nGram] = french.getNGramProbability(nGram);
});
french.nGramProbabilities.default = french.getNGramProbability(false);
// console.log('French ' + JSON.stringify(french).replace(/,/, '\n'));

var NaiveBayes = function(categories, features) {
  this.DEBUG = true;  
  this.categories = categories;
  this.features = features;
  this.probabilities = {};
  this.numberOfSamples = 0;
  var that = this;
  Object.keys(this.categories).forEach(function(category) {
    that.numberOfSamples += categories[category].sampleSize;    
    that.probabilities[category] = {
      categoryProbability: null
    };
    Object.keys(that.features).forEach(function(feature) {
      that.probabilities[category][feature] = [];
    });
  });  
}; 

NaiveBayes.prototype.aPrioriProbabilities = function(category) {
  this.probabilities[category].categoryProbability =
      this.categories[category].sampleSize / this.numberOfSamples;
};

NaiveBayes.prototype.aPosterioriProbabilities =
    function(category, feature, probability) {
  this.probabilities[category][feature].push(probability);
};

NaiveBayes.prototype.classify = function(newItem) {
  // a priori
  var that = this;
  Object.keys(this.categories).forEach(function(category) {
    that.aPrioriProbabilities(category);
  });    
  // a posteriori
  Object.keys(that.categories).forEach(function(category) {      
    Object.keys(newItem).forEach(function(feature) {
      newItem[feature].forEach(function(item) {
        var probability = that.features[feature].data[category][item] ?
            that.features[feature].data[category][item] :
            that.features[feature].data[category].default;
        that.aPosterioriProbabilities(category, feature, probability);
      });
    });
  });
  // final result
  var multiply = function (a, b) { return a * b; };
  Object.keys(this.categories).forEach(function(category) {
    Object.keys(that.features).forEach(function(feature) {
      that.probabilities[category][feature] =
          that.probabilities[category][feature].reduce(multiply);
      that.probabilities[category][feature] *=
          that.probabilities[category].categoryProbability
    });    
  });
  var categoryResults = {};
  Object.keys(this.categories).forEach(function(category) {
    var featureResults = [];    
    Object.keys(that.features).forEach(function(feature) {
      featureResults.push(that.probabilities[category][feature]);
    });
    categoryResults[featureResults.reduce(multiply)] = category;
  });

  if (this.DEBUG) console.log(categoryResults);
  var keys =
      Object.keys(categoryResults).map(function(n) { return parseFloat(n);});
  return categoryResults[Math.max.apply(null, keys)];
};

var categories = {
  english: {
    sampleSize: englishTweets.length
  },
  german: {
    sampleSize: germanTweets.length
  },
  french: {
    sampleSize: frenchTweets.length
  }
};
var features = {
  nGrams: {
    data: {
      english: english.nGramProbabilities,
      german: german.nGramProbabilities,
      french: french.nGramProbabilities
    }
  }
};

var newTweets = [
  'Looking forward to read @EricTopol\'s book "Destroying Medicine: Using patient\'s data" ow.ly/1IlzY7',
  'Si vous souhaitez contribuer à la traduction en français du rapport du Library Linked Data Group (LLD XG) contactez-moi #help #traductions',
  'Champions League: Bayern muss gegen Basel punktebn bit.ly/zQzlwz',
  'war heute beim Workshop zu Möglichkeiten der forschungsbezogenen Leistungsmessung an Universitäten bit.ly/ybDrmH #scientometrie #hhu',
  '@lechatpito Tiens, on m\'avait sollicité aussi ;-) bonne réunion et bon courage pour les convaincre'
];
newTweets.forEach(function(newTweet) {
  var naiveBayes = new NaiveBayes(categories, features);
  var languageModel = new LanguageModel();  
  var result = naiveBayes.classify({
    'nGrams': languageModel.getNGrams(newTweet)
  });
  console.log(
      newTweet + '\n' + languageModel.getNGrams(newTweet) + '\n' + result);
});
