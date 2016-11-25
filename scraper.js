var google = require('./lib/google');
var yahoo = require('./lib/yahoo');
var bing = require('./lib/bing');

/**
 * It scrapes google, yahoo and bing according to given keyword, country and language
 * and returns an object {google: array of links, yahoo: array of links, bing: array of links}
 * @param query
 * @param sedb
 * @param lang
 * @param start
 * @param proxy
 * @param callback
 */
function scraper(query, sedb, lang, start, proxy, callback) {
    var scrapedResult = {};
    var i = 0;
    google(query, sedb, lang, start, proxy, function (err, next, links) {
        i++;
        if (err) {
            callback(err);
        } else {
            scrapedResult.google = links;
            if (i >= 3) {
                callback(null, scrapedResult);
            }
        }
    });
    bing(query, sedb, lang, start, proxy, function (err, next, links) {
        i++;
        if (err) {
            callback(err);
        } else {
            scrapedResult.bing = links;
            if (i >= 3) {
                callback(null, scrapedResult);
            }
        }
    });
    yahoo(query, sedb, lang, start, proxy, function (err, next, links) {
        i++;
        if (err) {
            callback(err);
        } else {
            scrapedResult.yahoo = links;
            if (i >= 3) {
                callback(null, scrapedResult);
            }
        }
    });
}
module.exports = scraper;

// In order to test, uncomment this part and run node scraper.js

//scraper('weekly meal planner', 'us', 'en', null, 'ltpc170d53a:c170d53a@ltp.viia.me:8074', function (err, links) {
//    console.log('google ', links.google.length)
//    console.log('yahoo ',links.yahoo.length)
//    console.log('bing ', links.bing.length)
//});