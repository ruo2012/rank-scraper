var _ = require('lodash');
var request = require('request');
var cheerio = require('cheerio');
var querystring = require('querystring');
var util = require('util');
var Logger = require('le_node');
var logger = new Logger({
    token: 'c938c20d-f4e3-4da3-bd79-291c7138760c'
});

var SharedResources = require('./../shared/helpers.js');
var Helpers = new SharedResources.Helpers();
var configObj = require('./../config');
var USER_AGENTS = configObj.USER_AGENTS;
var COUNTRY_CODES_TO_UULE = configObj.COUNTRY_CODES;
var itemSelector = '#doc #web li';
var descSel = '.compText p';
var linkSel = 'h3.title a';
var nextSel = 'td.b a span';
var advertisements = '.ads-ad';
var mapResults = '._gt';
var inTheNews = '.card-section';
var peopleAsk = '.related-question-pair';
var sponsored = '#tvcap .commercial-unit-desktop-top';

var URL = 'http://%ssearch.yahoo.com/search?p=%s&b=%d&n=%d&ie=UTF-8&oe=UTF-8';

var nextTextErrorMsg = 'Translate `yahoo.nextText` option to selected language to detect next results link.';

// start parameter is optional
function yahoo(query, sedb, lang, start, proxy, callback) {
    if (typeof callback === 'undefined') {
        callback = start
    } else {
        startIndex = start
    }
    iyahoo(query, sedb, lang, 0, proxy, [], [], 0, callback);
}

yahoo.resultsPerPage = 30;
yahoo.sedb = 'us';
yahoo.lang = 'en';
yahoo.requestOptions = {};
yahoo.nextText = 'Next';
yahoo.totalResults = 100;

var iyahoo = function (query, sedb, lang, start, proxy, links, urls, index, callback) {
    if (yahoo.resultsPerPage > 100) yahoo.resultsPerPage = 100; // yahoo won't allow greater than 100 anyway
    if (yahoo.lang !== 'en' && yahoo.nextText === 'Next') console.warn(nextTextErrorMsg);

    // timeframe is optional. splice in if set
    if (yahoo.timeSpan) {
        URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + yahoo.timeSpan) : URL.concat('&tbs=qdr:', yahoo.timeSpan)
    }

    if (_.isEmpty(sedb)) {
        sedb = yahoo.sedb
    }
    if (_.isEmpty(lang)) {
        lang = yahoo.lang
    }
    var newUrl = util.format(
        URL,
        ((sedb === 'us') ? '' : sedb + '.'),
        Helpers.replaceAll(encodeURIComponent(Helpers.replaceAll(query, ' ', '+')), '%2B','+'),
        start,
        yahoo.resultsPerPage
    );
    newUrl += "&ie=" + (new Date()).getTime();
    console.log(newUrl);

    var userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    console.log(userAgent);

    var requestOptions = {
        url: newUrl,
        headers: {
            // Pick a random user agent
            'User-Agent': userAgent,
            'Cache-Control': 'no-cache'
        },
        method: 'GET'
    };

    if (proxy && proxy !== null) {
        requestOptions.proxy = 'http://' + proxy;
    }

    for (var k in yahoo.requestOptions) {
        requestOptions[k] = yahoo.requestOptions[k]
    }

    request(requestOptions, function (err, resp, body) {
        if ((err == null) && resp.statusCode === 200) {
            // console.log(body)
            var $ = cheerio.load(body);
            console.log($(itemSelector).length);
            $(itemSelector).each(function (i, elem) {
                var linkElem = $(elem).find(linkSel);
                var descElem = $(elem).find(descSel);
                var qsObj = querystring.parse($(linkElem).attr('href'));
                //console.log($(linkElem).attr('href'))
                if (qsObj['/url?q']) {
                    links.push(Helpers.getDomainURL(qsObj['/url?q']));
                    urls.push(Helpers.getDomainURL(qsObj['/url?q']) +  Helpers.getDomainURLToPage(qsObj['/url?q']));
                } else if ($(linkElem).attr('href')) {
                    links.push(Helpers.getDomainURL($(linkElem).attr('href')));
                    urls.push(Helpers.getDomainURL($(linkElem).attr('href')) +  Helpers.getDomainURLToPage($(linkElem).attr('href')));
                }
                $(descElem).find('div').remove();
            });
            console.log('yahoo index: ', index);
            var nextFunc = null;
            if (links.length < yahoo.totalResults && index < 5) {
                console.log('Next page');
                index++;
                iyahoo(query, sedb, lang, start + yahoo.resultsPerPage + 1, proxy, links, urls, index, callback)
            } else {
                links = links.slice(0, yahoo.totalResults);
                urls = urls.slice(0, yahoo.totalResults);
                console.log(links.length);
                callback(null, nextFunc, {links: links, urls: urls});
            }
        } else {
            callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
        }
    })
};

module.exports = yahoo;