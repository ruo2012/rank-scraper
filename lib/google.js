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
var itemSelector = '';
var itemSel1 = '.srg .g';
var itemSel2 = 'li.g';
var itemSel3 = '.g';
var descSel = 'span.st';
var linkSel = 'h3.r a';
var nextSel = 'td.b a span';
var advertisements = '.ads-ad';
var mapResults = '._gt';
var inTheNews = '.card-section';
var peopleAsk = '.related-question-pair';
var sponsored = '#tvcap .commercial-unit-desktop-top';

//var URL = 'http://www.google.%s/search?q=%s&uule=%s&start=%d&num=%d&gl=%s&ie=%s&ie=UTF-8&oe=UTF-8';
var URL = '%s://www.google.%s/search?hl=%s&q=%s&start=%s&num=%s&uule=%s&ip=0.0.0.0&source_ip=0.0.0.0&ie=UTF-8&oe=UTF-8&noj=1&igu=1&nomo=1&nota=1&biw=1075&bih=5000';

var nextTextErrorMsg = 'Translate `google.nextText` option to selected language to detect next results link.';
var protocolErrorMsg = "Protocol `google.protocol` needs to be set to either 'http' or 'https', please use a valid protocol. Setting the protocol to 'https'.";

// start parameter is optional
function google(query, sedb, lang, start, proxy, device, callback) {
    if (typeof callback === 'undefined') {
        callback = start
    } else {
        startIndex = start
    }
    igoogle(query, sedb, lang, 0, proxy, [], [], 0, device, callback);
}

google.resultsPerPage = 100;
google.sedb = 'us';
google.lang = 'en';
google.requestOptions = {};
google.nextText = 'Next';
google.totalResults = 100;
google.protocol = 'https';

var igoogle = function(query, sedb, lang, start, proxy, links, urls, index, device, callback) {
    if (google.resultsPerPage > 100) google.resultsPerPage = 100; // Google won't allow greater than 100 anyway
    if (google.lang !== 'en' && google.nextText === 'Next') console.warn(nextTextErrorMsg);
    if (google.protocol !== 'http' && google.protocol !== 'https') {
        google.protocol = 'http';
        console.warn(protocolErrorMsg);
    }

    // timeframe is optional. splice in if set
    if (google.timeSpan) {
        URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + google.timeSpan) : URL.concat('&tbs=qdr:', google.timeSpan)
    }
    if (_.isEmpty(sedb)) {
        sedb = google.sedb
    }
    if (_.isEmpty(lang)) {
        lang = google.lang
    }

    var locale = _.find(COUNTRY_CODES_TO_UULE, { cc: sedb });

    //TODO: remove thes condition when country code list is updated
    if (!locale) {
        console.log('========================');
        console.log('Country not found');
        console.log('========================');
        logger.alert('Country not found');
        console.log(locale)
    }
    else {
        console.log(locale);
        var newUrl = util.format(
            URL,
            google.protocol,
            locale.tld,
            google.lang,
            querystring.escape(query),
            start,
            google.resultsPerPage,
            // locale.cc.toUpperCase(),
            locale.uule
        );
        //var newUrl = util.format(
        //    URL,
        //    locale.tld,
        //    Helpers.replaceAll(encodeURIComponent(Helpers.replaceAll(query, ' ', '+')), '%2B','+'),
        //    locale.uule,
        //    start,
        //    google.resultsPerPage,
        //    locale.cc.toUpperCase(),
        //    (new Date()).getTime()
        //);
        console.log(newUrl);
        USER_AGENTS = (device === 'mobile' && configObj.USER_AGENTS_MOBILE)? configObj.USER_AGENTS_MOBILE: USER_AGENTS;
        var userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        console.log(userAgent);

        var requestOptions = {
            url: newUrl,
            headers: {
                // Pick a random user agent
                'User-Agent': userAgent,
                'Cache-Control':'private, no-cache, no-store, must-revalidate, max-age=0',
                 'Pragma':'no-cache'
            },
            method: 'GET'
        }

        if (proxy && proxy !== null) {
            requestOptions.proxy = 'http://' + proxy;
        }

        for (var k in google.requestOptions) {
            requestOptions[k] = google.requestOptions[k]
        }

        request(requestOptions, function(err, resp, body) {
            if ((err == null) && resp.statusCode === 200) {
                // console.log(body)
                var $ = cheerio.load(body);
                itemSelector = itemSel2;
                if ($(itemSel1).length > $(itemSel2).length) {
                    itemSelector = itemSel1
                }
                if ($(itemSel3).length > $(itemSelector).length) {
                    itemSelector = itemSel3
                }
                $(itemSelector).each(function(i, elem) {
                    var linkElem = $(elem).find(linkSel);
                    var descElem = $(elem).find(descSel);
                    var qsObj = querystring.parse($(linkElem).attr('href'));

                    if (qsObj['/url?q']) {
                        links.push(Helpers.getDomainURL(qsObj['/url?q']));
                        urls.push(Helpers.getSubdomainURL(qsObj['/url?q']) + Helpers.getDomainURLToPage(qsObj['/url?q']));
                    } else if ($(linkElem).attr('href')) {
                        links.push(Helpers.getDomainURL($(linkElem).attr('href')));
                        urls.push(Helpers.getSubdomainURL($(linkElem).attr('href')) + Helpers.getDomainURLToPage($(linkElem).attr('href')));
                    }
                    $(descElem).find('div').remove();
                });
                console.log('Goggle index: ', index);
                var nextFunc = null;
                if (links.length < google.totalResults && index < 2) {
                    console.log('Next page');
                    index++;
                    igoogle(query, sedb, lang, start + google.resultsPerPage, proxy, links, urls, index, device, callback)
                } else {
                    links = links.slice(0, google.resultsPerPage);
                    urls = urls.slice(0, google.totalResults);
                    console.log(links.length);
                    callback(null, nextFunc, {links: links, urls: urls});
                }
            } else {
                callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
            }
        })
    }
};

module.exports = google;