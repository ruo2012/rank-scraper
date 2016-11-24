var google = require('./lib/google');
var yahoo = require('./lib/yahoo');
var bing = require('./lib/bing');

google('weekly meal planner', 'us', 'en', null, function (err, next, links) {
  console.log(links)
})
