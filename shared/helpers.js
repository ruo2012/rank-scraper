/**
 * Common methods to be used by scrapers
 */
var URL = require('url');
var Helpers = function () {};
exports.Helpers  = Helpers;

(function () {
    /**
     *  Top Level Domains used for parsing root and subdomains
     */
    var COMMON_TLDS = ['.com', '.org', '.edu', '.gov', '.co', '.net',
        '.mil', '.info'];

    var TOP_LEVEL_DOMAINS = ['.ca', '.de', '.jp', '.fr', '.au', '.us', '.ru',
        '.ch', '.it', '.nl', '.se', '.no', '.es',
        '.aero', '.asia', '.biz', '.cat', '.coop', '.int', '.io', '.jobs', '.ly',
        '.mil', '.mobi', '.museum', '.name', '.pro', '.tel', '.travel', '.xxx',
        '.ac', '.ad', '.ae', '.af', '.ag', '.ai', '.al', '.am', '.an', '.ao', '.aq', 'ar',
        '.as', '.at', '.au', '.aw', '.ax', '.az', '.ba', '.bb', '.bd', '.be', '.bf', '.bg',
        '.bh', '.bi', '.bj', '.bm', '.bn', '.bo', '.br', '.bs', '.bt', '.bv', '.bw', '.by',
        '.bz', '.ca', '.cc', '.cd', '.cf', '.cg', '.ch', '.ci', '.ck', '.cl', '.cm', '.cn',
        '.co', '.cr', '.cs', '.cu', '.cv', '.cx', '.cz', '.dd', '.de', '.dj', '.dk', '.dm',
        '.do', '.dz', '.ec', '.ee', '.eg', '.eh', '.er', '.es', '.et', '.eu', '.fi', '.fj',
        '.fk', '.fm', '.fo', '.fr', '.ga', '.gb', '.ge', '.gf', '.gg', '.gh', '.gi', '.gl',
        '.gm', '.gn', '.gp', '.gq', '.gr', '.gs', '.gt', '.gu', '.gw', '.gy', '.hk', '.hm',
        '.hn', '.hr', '.ht', '.hu', '.id', '.ie', '.il', '.im', '.in', '.iq', '.ir', '.is',
        '.it', '.je', '.jm', '.jo', '.jp', '.ke', '.kg', '.kh', '.ki', '.km', '.kn', '.kp',
        '.kr', '.kw', '.ky', '.kz', '.la', '.lb', '.lc', '.li', '.lk', '.lr', '.ls', '.lt',
        '.lu', '.lv', '.ma', '.mc', '.md', '.me', '.mg', '.mh', '.mk', '.ml', '.mm', '.mn',
        '.mo', '.mp', '.mq', '.mr', '.ms', '.mt', '.mu', '.mv', '.mw', '.mx', '.my', '.mz',
        '.na', '.nc', '.ne', '.nf', ',ng', '.ni', '.nl', '.no', '.np', '.nr', '.nu', '.nz',
        '.om', '.pa', '.pe', '.pf', '.pg', '.ph', '.pk', '.pl', '.pm', '.pn', '.pr', '.ps',
        '.pt', '.pw', '.py', '.qa', '.re', '.ro', '.rs', '.ru', '.rw', '.sa', '.sb', '.sc',
        '.sd', '.se', '.sg', '.sh', '.si', '.sj', '.sk', '.sl', '.sm', '.sn', '.so', '.sr',
        '.st', '.su', '.sv', '.sy', '.sz', '.tc', '.td', '.tf', '.tg', '.th', '.tj', '.tk',
        '.tl', '.tm', '.tn', '.to', '.tp', '.tr', '.tt', '.tv', '.tw', '.tz', '.ua', '.ug',
        '.uk', '.us', '.uy', '.uz', '.va', '.vc', '.ve', '.vg', '.vi', '.vn', '.vu', '.wf',
        '.ws', '.ye', '.yt', '.za', '.zm', '.zw'
    ];
    /**
     * Parse the domain from the provided URL and return it
     */

    this.getDomainURL = function (url) {
        var hostName = this.getSubdomainURL(url);
        var domain = hostName;

        if (hostName != null) {
            var parts = hostName.split('.').reverse();

            if (parts != null && parts.length > 1) {
                domain = parts[1] + '.' + parts[0];
                if (TOP_LEVEL_DOMAINS.indexOf('.' + parts[0]) > -1) {
                    if (parts.length > 2 && (COMMON_TLDS.indexOf('.' + parts[1] > -1))) {
                        domain = [parts[2], parts[1], parts[0]].join('.');
                    }
                }
            }
        }

        return domain;
    };

    /**
     * Parse the subdomain from the provided URL and return it
     */
    this.getSubdomainURL = function (url) {
        var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
            return match[2];
        }
        else {
            var match = url.match(/(www[0-9]?\.)?(.[^/:]+)/i);
            if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
                return match[2];
            }
            return url;
        }

    };

    /**
     * Replace all the occurrence of given string.
     */
    this.replaceAll = function (string, find, replace) {
        string = string.replace(/\s\s+/g, ' ');
        return string.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
    };
    this.escapeRegExp = function (str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    };
    /**
     * Parse the page from the provided URL and return it
     */
    this.getDomainURLToPage = function (url) {
        return URL.parse(url).pathname.replace(/\/+$/, "");
        //return url.replace(/^(?:\/\/|[^\/]+)*\//, "").replace(/\/+$/, "");
    };

}).call(Helpers.prototype);
