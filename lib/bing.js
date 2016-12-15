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
var itemSelector = '#b_content li.b_algo';
var descSel = '.b_caption p sdfsf';
var linkSel = 'h2 a';
var nextSel = 'td.b a span';
var advertisements = '.ads-ad';
var mapResults = '._gt';
var inTheNews = '.card-section';
var peopleAsk = '.related-question-pair';
var sponsored = '#tvcap .commercial-unit-desktop-top';

var URL = 'http://www.bing.com/search?q=%s&cc=%s&first=%d&count=%d&ie=UTF-8&oe=UTF-8';

var nextTextErrorMsg = 'Translate `bing.nextText` option to selected language to detect next results link.';

// start parameter is optional
function bing(query, sedb, lang, start, proxy, callback) {
    if (typeof callback === 'undefined') {
        callback = start
    } else {
        startIndex = start
    }
    ibing(query, sedb, lang, 0, proxy, [], [], 0, callback);
}

bing.resultsPerPage = 50;
bing.sedb = 'us';
bing.lang = 'en';
bing.requestOptions = {};
bing.nextText = 'Next';
bing.totalResults = 100;

var ibing = function (query, sedb, lang, start, proxy, links, urls, index, callback) {
    if (bing.resultsPerPage > 100) bing.resultsPerPage = 100; // bing won't allow greater than 100 anyway
    if (bing.lang !== 'en' && bing.nextText === 'Next') console.warn(nextTextErrorMsg);

    // timeframe is optional. splice in if set
    if (bing.timeSpan) {
        URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + bing.timeSpan) : URL.concat('&tbs=qdr:', bing.timeSpan)
    }

    if (_.isEmpty(sedb)) {
        sedb = bing.sedb
    }
    if (_.isEmpty(lang)) {
        lang = bing.lang
    }

    console.log(sedb);
    var newUrl = util.format(
        URL,
        Helpers.replaceAll(encodeURIComponent(Helpers.replaceAll(query, ' ', '+')), '%2B','+'),
        sedb,
        start,
        bing.resultsPerPage
    );
    newUrl += '&gl=' + sedb.toUpperCase();
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

    for (var k in bing.requestOptions) {
        requestOptions[k] = bing.requestOptions[k]
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
                    urls.push(Helpers.getDomainURL(qsObj['/url?q']) + Helpers.getDomainURLToPage(qsObj['/url?q']));
                } else if ($(linkElem).attr('href')) {
                    links.push(Helpers.getDomainURL($(linkElem).attr('href')));
                    urls.push(Helpers.getDomainURL($(linkElem).attr('href')) + Helpers.getDomainURLToPage($(linkElem).attr('href')));
                }
                $(descElem).find('div').remove();
            });
            console.log('Bing index: ', index);
            var nextFunc = null;
            if (links.length < bing.totalResults && index < 3) {
                console.log('Next page');
                index++;
                ibing(query, sedb, lang, start + bing.resultsPerPage + 1, proxy, links, urls, index, callback)
            } else {
                links = links.slice(0, bing.totalResults);
                urls = urls.slice(0, bing.totalResults);
                console.log(links.length);
                callback(null, nextFunc, {links: links, urls: urls});
            }
        } else {
            callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
        }
    })
};

module.exports = bing;