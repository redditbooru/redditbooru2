var _ = require('underscore'),
    defer = require('q').defer,
    util = require('util'),
    ent = require('ent'),
    Mongo = require('../../lib/mongo.js'),
    Dal = require('../../lib/dal.js'),
    User = require('./user.js'),
    Post = function(obj) {
        if (_.isObject(obj)) {
            Post.copyRowFromDb(this, obj);
        }
    };

// Inherit Dal
util.inherits(Post, Dal);
_.extend(Post, Dal);

// Database mapping
Post._dbTable = 'posts';
Post._dbPrimaryKey = 'id';
Post._dbMap = {
    id: 'post_id',
    sourceId: 'source_id',
    externalId: 'post_external_id',
    dateCreated: 'post_date',
    dateUpdated: 'post_updated',
    title: 'post_title',
    link: 'post_link',
    userId: 'user_id',
    keywords: 'post_keywords',
    score: 'post_score',
    processed: 'post_processed',
    visible: 'post_visible',
    meta: 'post_meta'
};

Post.createFromRedditPost = function(post) {

    var retVal = defer();

    User.getByUserName(post.author)
        .then(function(userId) {
            retVal.resolve(new Post({
                post_external_id: post.id,
                user_id: userId,
                post_date: post.created,
                post_updated: Math.round(Date.now() / 1000),
                post_title: post.title,
                post_keywords: Post.getKeywords(post.title + ' ' + (post.link_flair_text ? post.link_flair_text : '')),
                post_link: post.url,
                post_nsfw: post.over_18,
                post_score: post.score,
                post_processed: false,
                post_visible: false
            }));
        })
        .fail(function(err) {
            retVal.reject(err);
        });

    return retVal.promise;
};

/**
 * Returns a string stripped of common/duplicate words and punctuation
 */
Post.getKeywords = function(str) {
    var stopWords = /\b(a|able|about|above|abroad|according|accordingly|across|actually|adj|after|afterwards|again|against|ago|ahead|ain\'t|all|allow|allows|almost|alone|along|alongside|already|also|although|always|am|amid|amidst|among|amongst|an|and|another|any|anybody|anyhow|anyone|anything|anyway|anyways|anywhere|apart|appear|appreciate|appropriate|are|aren\'t|around|as|a\'s|aside|ask|asking|associated|at|available|away|awfully|back|backward|backwards|be|became|because|become|becomes|becoming|been|before|beforehand|begin|behind|being|believe|below|beside|besides|best|better|between|beyond|both|brief|but|by|came|can|cannot|cant|can\'t|caption|cause|causes|certain|certainly|changes|clearly|c\'mon|co|co.|com|come|comes|concerning|consequently|consider|considering|contain|containing|contains|corresponding|could|couldn\'t|course|c\'s|currently|dare|daren\'t|definitely|described|despite|did|didn\'t|different|directly|do|does|doesn\'t|doing|done|don\'t|down|downwards|during|each|edu|eg|eight|eighty|either|else|elsewhere|end|ending|enough|entirely|especially|et|etc|even|ever|evermore|every|everybody|everyone|everything|everywhere|ex|exactly|example|except|fairly|far|farther|few|fewer|fifth|first|five|followed|following|follows|for|forever|former|formerly|forth|forward|found|four|from|further|furthermore|get|gets|getting|given|gives|go|goes|going|gone|got|gotten|greetings|had|hadn\'t|half|happens|hardly|has|hasn\'t|have|haven\'t|having|he|he\'d|he\'ll|hello|help|hence|her|here|hereafter|hereby|herein|here\'s|hereupon|hers|herself|he\'s|hi|him|himself|his|hither|hopefully|how|howbeit|however|hundred|i\'d|ie|if|ignored|i\'ll|i\'m|immediate|in|inasmuch|inc|inc.|indeed|indicate|indicated|indicates|inner|inside|insofar|instead|into|inward|is|isn\'t|it|it\'d|it\'ll|its|it\'s|itself|i\'ve|just|keep|keeps|kept|know|known|knows|last|lately|later|latter|latterly|least|less|lest|let|let\'s|like|liked|likely|likewise|look|looking|looks|low|lower|ltd|made|mainly|make|makes|many|may|maybe|mayn\'t|me|mean|meantime|meanwhile|merely|might|mightn\'t|mine|minus|miss|more|moreover|most|mostly|mr|mrs|much|must|mustn\'t|my|myself|name|namely|nd|near|nearly|necessary|need|needn\'t|needs|neither|never|neverf|neverless|nevertheless|new|next|nine|ninety|nobody|non|none|nonetheless|noone|no-one|nor|normally|not|nothing|notwithstanding|novel|now|nowhere|obviously|of|off|often|oh|ok|okay|old|once|one|ones|one\'s|only|onto|opposite|or|other|others|otherwise|ought|oughtn\'t|our|ours|ourselves|out|outside|over|overall|own|particular|particularly|past|per|perhaps|placed|please|plus|possible|presumably|probably|provided|provides|que|quite|qv|rather|rd|re|really|reasonably|recent|recently|regarding|regardless|regards|relatively|respectively|right|round|said|same|saw|say|saying|says|second|secondly|see|seeing|seem|seemed|seeming|seems|seen|self|selves|sensible|sent|serious|seriously|seven|several|shall|shan\'t|she|she\'d|she\'ll|she\'s|should|shouldn\'t|since|six|some|somebody|someday|somehow|someone|something|sometime|sometimes|somewhat|somewhere|soon|sorry|specified|specify|specifying|still|sub|such|sup|sure|take|taken|taking|tell|tends|th|than|thank|thanks|thanx|that|that\'ll|thats|that\'s|that\'ve|the|their|theirs|them|themselves|then|thence|there|thereafter|thereby|there\'d|therefore|therein|there\'ll|there\'re|theres|there\'s|thereupon|there\'ve|these|they|they\'d|they\'ll|they\'re|they\'ve|thing|things|think|third|thirty|this|thorough|thoroughly|those|though|three|through|throughout|thru|thus|till|together|too|took|toward|towards|tried|tries|truly|try|trying|t\'s|twice|two|un|under|underneath|undoing|unfortunately|unless|unlike|unlikely|until|unto|up|upon|upwards|us|use|used|useful|uses|using|usually|v|value|various|versus|very|via|viz|vs|want|wants|was|wasn\'t|way|we|we\'d|welcome|well|we\'ll|went|were|we\'re|weren\'t|we\'ve|what|whatever|what\'ll|what\'s|what\'ve|when|whence|whenever|where|whereafter|whereas|whereby|wherein|where\'s|whereupon|wherever|whether|which|whichever|while|whilst|whither|who|who\'d|whoever|whole|who\'ll|whom|whomever|who\'s|whose|why|will|willing|wish|with|within|without|wonder|won\'t|would|wouldn\'t|yes|yet|you|you\'d|you\'ll|your|you\'re|yours|yourself|yourselves|s|you\'ve|zero)\b/ig,
        charsStrip = /[^\d\w\s]/g,
        whiteSpace = /[\s]+/g,
        words = [],
        i = 0,
        count = 0;
    
    // Do all the character replacement
    str = ent.decode(str).replace(charsStrip, ' ').replace(stopWords, ' ').replace(whiteSpace, ' ').trim().toLowerCase();

    // Remove duplicate words
    str = str.split(' ');
    for (count = str.length; i < count; i++) {
        if (words.indexOf(str[i]) === -1) {
            words.push(str[i]);
        }
    }

    return words.join(' ');

};

/**
 * @override
 * Updates cache copy of the post data
 */
Post.prototype.sync = function() {

    // We only need to run on updates since the entry is created by Image
    if (this.id) {
        Mongo.update('posts', { score: this.score, keywords: this.keywords }, { postId: this.id });
    }

    return Dal.prototype.sync.call(this);
};

module.exports = Post;