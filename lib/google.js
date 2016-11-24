var _ = require('lodash')
var request = require('request')
var cheerio = require('cheerio')
var querystring = require('querystring')
var util = require('util')
var Logger = require('le_node')
var logger = new Logger({
    token: 'c938c20d-f4e3-4da3-bd79-291c7138760c'
});
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

var URL = 'http://www.google.%s/search?hl=%s&q=%s&uule=%s&ie=UTF-8&oe=UTF-8'

var nextTextErrorMsg = 'Translate `google.nextText` option to selected language to detect next results link.'

// start parameter is optional
function google(query, sedb, lang, start, proxy, callback) {
    if (typeof callback === 'undefined') {
        callback = start
    } else {
        startIndex = start
    }
    igoogle(query, sedb, lang, 0, proxy, callback);
}

google.resultsPerPage = 100;
google.sedb = 'us';
google.lang = 'en';
google.requestOptions = {};
google.nextText = 'Next';

var igoogle = function(query, sedb, lang, start, proxy, callback) {
    if (google.resultsPerPage > 100) google.resultsPerPage = 100; // Google won't allow greater than 100 anyway
    if (google.lang !== 'en' && google.nextText === 'Next') console.warn(nextTextErrorMsg)

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

    var locale = _.find(COUNTRY_CODES_TO_UULE, { cc: sedb })

    //TODO: remove thes condition when country code list is updated
    if (!locale) {
        console.log('========================');
        console.log('Country not found');
        console.log('========================');
        logger.alert('Country not found');
        console.log(locale)
    }
    else {
        console.log(locale)
        var newUrl = util.format(
            URL,
            locale.tld,
            lang,
            querystring.escape(query),
            locale.uule,
            start,
            google.resultsPerPage
        )
        newUrl += '&gl=' + locale.cc.toUpperCase();
        newUrl += "&ie="+(new Date()).getTime();
            console.log(newUrl)

        var userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
        console.log(userAgent)

        var requestOptions = {
            url: newUrl,
            headers: {
                // Pick a random user agent
                'User-Agent': userAgent,
                'Cache-Control':'no-cache'
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
                var $ = cheerio.load(body)
                var links = []
                var totalPages = Number($('.g').length) + Number($(mapResults).length) + Number($(advertisements).length) + Number($(peopleAsk).length) + Number($(sponsored).length);
                itemSelector = itemSel2
                if(Number($(mapResults).length) > 0) {
                    totalPages+= 2;
                }
                if ($(itemSel1).length > $(itemSel2).length) {
                    itemSelector = itemSel1
                }
                if ($(itemSel3).length > $(itemSelector).length) {
                    itemSelector = itemSel3
                }
                console.log('total: ',totalPages)
                $(itemSelector).each(function(i, elem) {
                    var linkElem = $(elem).find(linkSel)
                    var descElem = $(elem).find(descSel)
                    var item = {
                        title: $(linkElem).first().text(),
                        link: null,
                        description: null,
                        href: null
                    }
                    var qsObj = querystring.parse($(linkElem).attr('href'))

                    if (qsObj['/url?q']) {
                        item.link = qsObj['/url?q']
                        item.href = item.link
                    } else {
                        item.link = $(linkElem).attr('href');
                        item.href = $(linkElem).attr('href');
                    }

                    $(descElem).find('div').remove()
                    item.description = $(descElem).text()
                    var link = links.filter(function (data) { return (data.title === item.title && data.link === item.link && data.href === item.href)})
                    if(!link || (link && link.length <= 0)){
                        links.push(item)
                    }
                })

                var nextFunc = null
                if ($(nextSel).last().text() === google.nextText) {
                    logger.alert('Next page');
                    nextFunc = function() {
                        igoogle(query, start + google.resultsPerPage, callback)
                    }
                }

                //console.log(links)
                callback(null, nextFunc, {links: links, total: totalPages})
            } else {
                callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
            }
        })
    }
}

module.exports = google