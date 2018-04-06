/*
 * currcond.js
 * Code to display a set of current conditions for a NOAA Observation Station.
 *
 * Invocation:
 *	html += currentConditions(Object);
 *	Where Object is the properties object returned by the call to:
 * 		http://api.weather.gov/stations/{stationID}/observations...
 */
function currentConditions(conditions) {
	var html = '',
		m2mi = .01 / 2.54/12/5280,
		degF = function(t,u){if (u.matches(/C/)) { return t*5/9+32.toFixed(0)} else return t};
	html += 
}
var TAG = {
	div: function(options) { return TAG.buildTag('div', options) },
	img: function(options) { return TAG.buildTag('img', options) },
	p: function(options) { return TAG.buildTag('p', options) },
	makeElement: function(tag, constOpts) {
		return function(options){
			return TAG.buildTag(tag, $.extend({},constOpts,options));
		};
	},
	buildTag: function (tagName, options) {
		var rzlt = '';
		rzlt += '<' + tagName;
		if ((typeof options) == 'string') { rzlt += '>' + options }
		else {
			for (var attr in options) {
				if (attr != 'text') rzlt += ' ' + attr + '="' + options[attr] + '"';
			}
			rzlt += '>';
			if (options.text) {
				if ((typeof options.text) == 'string') {rzlt += options.text }
				else if (options.text instanceof Array) { rzlt += options.text.join('') }
				else {
					var errMsg = 'NOTARRAYORSTRING: "text" option is not string or array';
					alert(errMsg);
					rzlt += errMsg;
				}
			}
		}
		rzlt += '</' + tagName + '>';
		return rzlt;
	}
};