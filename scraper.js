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
 * @param type
 * @param device
 * @param callback
 */
function scraper(query, sedb, lang, start, proxy, type, device, cert, callback) {
   if(type === 'yahoo') {
       yahoo(query, sedb, lang, start, proxy, 'desktop', function (err, next, links) {
           if (err) {
               callback(err);
           } else {
               callback(null, links);
           }
       });
   } else if(type === 'bing') {
       bing(query, sedb, lang, start, proxy, 'desktop', function (err, next, links) {
           if (err) {
               callback(err);
           } else {
               callback(null, links);
           }
       });
   } else {
       google(query, sedb, lang, start, proxy, device, cert, function (err, next, links) {
           if (err) {
               callback(err);
           } else {
               callback(null, links);
           }
       });
   }
}
module.exports = scraper;

// In order to test, uncomment this part and run node scraper.js

//scraper('great leaders', 'in', 'en', 0, 'ltpc170d53a:c170d53a@ltp.viia.me:8656', 'google', function (err, links) {
//    console.log('google ', links)
//});