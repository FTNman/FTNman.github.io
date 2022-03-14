var TAG = {
	div: function(options) { return TAG.buildTag('div', options) },
	img: function(options) { return TAG.buildTag('img', options) },
	p: function(options) { return TAG.buildTag('p', options) },
	span: function(options) { return TAG.buildTag('span', options) },
	tspan: function(options) { return TAG.buildTag('tspan', options) },
	text: function(options) { return TAG.buildTag('text', options) },
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

function Chart(width, height, leftPad, rightPad, topPad, bottomPad) {
	this.width = width;
	this.height = height;
	this.leftPad = leftPad;
	this.rightPad = rightPad;
	this.topPad = topPad;
	this.bottomPad = bottomPad;
	this.xAxOrig = leftPad;
	this.xAxLen = width - leftPad - rightPad;
	this.yAxOrig = height - bottomPad;
	this.yAxLen = height - bottomPad - topPad;
	this.xMin = null;
	this.xRange = null;
	this.yMin = null;
	this.yRange = null;
}
/* method: Chart::xpos()
 * returns x-coordinate of this datum
 */
Chart.prototype.xpos = function(x) {
	return this.xAxOrig + (this.xAxLen * ((x - this.xMin) / this.xRange));
};
/* method: Chart::ypos()
 * returns y-coordinate of this datum
 */
Chart.prototype.ypos = function(y) {
	return this.yAxOrig - (this.yAxLen * ((y - this.yMin) / this.yRange));
};
Chart.prototype.mapPoP = function(e) {
  var html = '';
  var y = this.ypos(e.value);
  var da=e.validTime.split('/');
  var startMs = new Date(da[0]).getTime();
  var dur = da[1].match(/^P(\d*)D?T?(\d*)H?/);
  var x1 = this.xpos(startMs);
  var x2 = this.xpos(((dur[1]*24) + (dur[2]*1))*1000*60*60 + startMs);
  html += '<line class="popLine" x1="' + x1 + '" x2="' + x2 + '" y1="' + y + '" y2="' + y + '"></line>';
  html +=TAG.text({
    class: 'popLab',
    x: x1 + ((x2-x1)/2),
    y: y,
    text: e.value+'%'
  });
  return html;
};
Chart.prototype.mapPath = function(e,i) {
  var html = '';
  var y = this.ypos(e.value);
  var da=e.validTime.split('/');
  var x = this.xpos(new Date(da[0]).getTime());
  html += ((i==0)?'M':' L')+x+','+y;
  return html;
};
Chart.prototype.mapTextLab = function(e) {
  var html = '';
  var y = this.ypos(e.value);
  var da=e.validTime.split('/');
  var x = this.xpos(new Date(da[0]).getTime());
  html += '<text x="'+x+'" y="'+y+'" class="popLab">'+e.value+'%</text>';
  return html;
};
Chart.prototype.mapQuantPrecip = function(e,i,a,cls) {
  var html = '';
  var logScale = scaleData().domain([-3,1]).range([this.yAxOrig, this.yAxOrig-this.yAxLen]),
    precip = e.value/25.4,
    y = logScale(Math.log10(precip)),
    hgt = logScale.range()[0] - y,
    labY = y + (hgt / 2);
  var da=e.validTime.split('/');
  var startMs = new Date(da[0]).getTime();
  var x = this.xpos(startMs);
  var dur = da[1].match(/^P(\d*)D?T?(\d*)H?/);
  var x2 = this.xpos(((dur[1]*24) + (dur[2]*1))*1000*60*60 + startMs);
  var wid = x2 - x;
  html += TAG.buildTag('rect', {
  	class: cls,
  	x: x,
  	y: y,
  	width: wid,
  	height: hgt
  });
  html += TAG.text({
  	class: 'popLab',
  	x: x+(wid/2),
  	y: labY,
  	dy: '0em',
  	text: Math.round(100*precip)/100 + ' in'
  });
  return html;
};
Chart.prototype.xAxisTimeline = function(options) {
  var html = '',
      y1 = this.ypos(this.yMin),
      y2 = this.ypos(this.yMin+this.yRange),
      ticInc = 1000*60*60,
      nTics = this.xRange / ticInc;
  for (var i=0;i<=nTics;i++) {
    var msTime = this.xMin + (i * ticInc),
        x = this.xpos(msTime),
        dt = new Date(msTime),
        hrs = dt.getHours(),
        isMajTic = i==0 || (hrs % 24) == 0,
        isMinTic = !isMajTic && (hrs % 6) == 0,
        cls = 'xTic' + (isMajTic ? ' xMajorTic' : '') + (isMinTic ? ' xMinorTic' : ''),
        textCls = (isMajTic ? 'xMajorTicLab' : '') + (isMinTic ? 'xMinorTicLab' : ''),
        yOffset = isMajTic ? '1.5em' : '1em',
        labelText = '';
    html += '<line class="'+cls+'" x1="'+x+'" y1="'+(isMajTic?(y1+5):y1)+'" x2="'+x+'" y2="'+y2+'"/>';
    if (isMajTic || isMinTic) {
      if (isMajTic) labelText = dt.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', weekday: 'short'});
      if (isMinTic) labelText = dt.toLocaleTimeString('en-US', {hour12: true, hour: '2-digit'});
      html += '<text class="'+textCls+'" x="'+x+'" y="'+y1+'" dx="0ex" dy="'+yOffset+'">'+labelText+'</text>';
    };
  }
  return html;
};
Chart.prototype.yAxisLabels = function(options){
  var html = '',
      x1 = this.xpos(this.xMin),
      x2 = this.xpos(this.xMin + this.xRange),
      ticInc = options.ticInc,
      nTics = this.yRange / ticInc;
  for (var i=0;i<=nTics;i++) {
    var yVal = this.yMin + (i * ticInc),
        y = this.ypos(yVal);
    html += '<line class="yTic" x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'"/>';
    html += '<text class="yTicLab" x="'+x1+'" y="'+y+'" dx="-.5ex" dy=".33em">'+yVal+'</text>';
  }
  return html;
};
var NWS = {
  baseUrl: 'https://api.weather.gov/points/',
  m2mi: function(m) {return m * 100 / 2.54 / 12 / 5280;},
  deg2compass: function(brng) {
    var crose = [
      'N', 'NNE', 'NE', 'ENE',
      'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 
      'W', 'WNW', 'NW', 'NNW'
    ], ndx;
    var ndx = Math.round(brng / 22.5) % 16;
    return crose[ndx];
  },
  degF: function(temp,uom) {
    return (uom.match(/degC/))?Math.round((9.0/5.0)*temp+32.0):temp;
  },
  Pa2InHg: function(pa) {
  	  return 0.0075006 * pa * .1 / 2.54;
  },
  getData: function(url, callback, retries) {
  	  console.log("In getData for: " + url);
  	  var tries = retries;
  	  var getUrl = (urlToGet,callBackToCall) => $.getJSON(urlToGet).done(callBackToCall).fail(reGet);
  	  var reGet = function(h,s,e) {
  	  	  tries--;
  	  	  alert('apiFail for: '+url+'\nStatus: '+h.status+' - '+e + '; Retries:[' + tries + ']');
  	  	  if (tries > 0) {
  	  	  	  getUrl(url,callback)
  	  	  } 
  	  }
  	  return getUrl(url,callback);
  },
  OLDgetData: function(url, callback, wxType) {
    $.getJSON(url)
    .done(callback)//.fail(function(h,s,e){this.apiFail(h,s,e,url)});
    .fail(function(h,s,e){alert('apiFail for: '+url+'\nStatus: '+h.status+' - '+e)});
  },
  apiFail: function(h,s,e,url) {
    alert('APIFAIL: '+url+'\nStatus: '+s+' Error: '+e);
  },
  extremes: function(ary,accfun) {
  	if (arguments.length==2){ary = ary.map((e)=>accfun(e));};
  	return ary.reduce(
  	  (m,a)=>[Math.min(m[0],a), Math.max(m[1],a)],
  	  [Number.MAX_VALUE, Number.MIN_VALUE]
  	);
  },
  badTemps:function(e,i,a){ return i==0 || Math.abs(a[i-1].value - e.value) < 40; }
};
//////////////////////////////////////////////////////
function getData(url, callback, retries) {
  console.log("In getData for: " + url);
  var tries = retries;
  var getUrl = (urlToGet,callBackToCall) => $.getJSON(urlToGet).done(callBackToCall).fail(reGet);
  var reGet = function(h,s,e) {
    tries--;
    alert('apiFail for: '+url+'\nStatus: '+h.status+' - '+e + '; Retries:[' + tries + ']');
    if (tries > 0) {
      getUrl(url,callback)
    } 
  }
  return getUrl(url,callback);
}
//////////////////////////////////////////////////////
var widgetObj,
    defaultLatLon = '39.8092794,-75.4865866',//'41.9796,-87.9045',
    chart,
    C2;

$("document").ready(function() {
  widgetObj = search_api.create("srch", { 
    "on_result": function(o) {CityChange(o);}
  }); 
  wxAtMyLoc();
});
function CityChange(o) {
  NWS['geo'] = o.result;
  var geo = o.result.properties;
  city = geo.Name;
  var url = NWS.baseUrl + (+geo.Lat).toFixed(4) + ',' + (+geo.Lon).toFixed(4); //41.9796,-87.9045;
  //url = NWS.baseUrl+'0,0';
  $('#loc').empty().html("Weather Forecast for: "
  	  + TAG.span({
  	  	style: "font-style: italic",
  	  	text: geo.Name + ', ' + geo.State +' (' + (+geo.Lat).toFixed(4) + ',' + (+geo.Lon).toFixed(4) + ')'
  	  })
  );
  //Erase previous weather alerts
  $('#alerts').empty();
  NWS.getData(url,initWX);
};
function initWX(data,status,xhdr){
  NWS['metaData'] = data;
  if ($('#loc').html().length == 0) $('#loc')
  	.html('Weather Forecast for: '
  		+ TAG.span({style: "font-style: italic", text: 'Your Current Location'})
  	);
  let locStr = $('#loc').html();
  let now = moment();
  locStr += " at " + now.format("h:mm a") + " on " + now.format("M/D/YYYY");
  $('#loc').html(locStr);
  var html = '';
  var loc = data.properties.relativeLocation.properties;
  var fcstUrl = data.properties.forecast;
  var hrlyUrl = data.properties.forecastHourly;
  var gridUrl = data.properties.forecastGridData;
  var staUrl = data.properties.observationStations;
  $('#subloc').empty().html(NWS.m2mi(loc.distance.value).toFixed(1) + 'mi ' + NWS.deg2compass(loc.bearing.value) + ' of ' + loc.city + ', ' + loc.state);
  html += '<pre>'+xhdr.responseText+'</pre>';
  $('#dta').html(html);
  let alertsUrl = "https://api.weather.gov/alerts";
  $.getJSON(alertsUrl, {active: 1, point: data.geometry.coordinates.slice().reverse().join(",")})
  	.done(processAlerts)
  	.fail(s=>alert("Couldn't get wx Alerts. Error: " + s));
  NWS.getData(fcstUrl,processForecast);
  NWS.getData(hrlyUrl,function(d){NWS['hrly']=d;});
  NWS.getData(gridUrl,function(d,s,h){NWS['grid']=d;plotGrid(d,s,h);});//prcsGrid(d,s,h)});
  NWS.getData(staUrl,function(d,s,h){NWS['stations']=d;getObservations(d,s,h);});
};
function processAlerts(data, status, hdr) {
	NWS['alerts'] = data;
	var html = '';
	html += data.features.map(formatAlert).join("");
	$("#alerts").empty().html(html);
};
function formatAlert(feature,i) {
	var alert = feature.properties,
		html = '';
	html += TAG.div({'class': 'alert', text: 
		TAG.buildTag('input', {'class': 'read-more-state', type: 'checkbox', id: 'alert-'+i})
		+ TAG.buildTag('label', {"class": "read-more-trigger", 'for': 'alert-'+i})
		+ TAG.p({"class": "read-more-wrap", text: [[alert.severity, alert.event, alert.headline].join(" - "),
			TAG.buildTag("span", {"class": "read-more-target", text: alert.description})]})
	});
	return html;
};
function getObservations(data, status, hdr) {
  let obsUrl = data.observationStations[0];
  //get all the observations for this station
  $.getJSON(obsUrl+"/observations")
  .done(processConditions);
};
function processConditions(data, status, hdr) {
	//TODO: Replace all the dynamic string build with filling in values in the html file.
	//		Move the daily hi/low to grid processing
	NWS['observations'] = data;
	let html = '';
	//Find first observation with non-null temperature; if none, report latest anyway.
	var validConditions = data.features
	.filter((e)=>e.properties.temperature.value !== null).slice()
	.sort((a,b)=>moment(b.properties.timestamp).diff(moment(a.properties.timestamp)));
	/* 
	var validConditions = data.features.filter((e)=>e.properties.temperature.value !== null);
	let fmax=(a,b)=>(moment(a.properties.timestamp) > moment(b.properties.timestamp))?a:b;
	const conditions;
	if (validConditions.length >= 0) {
		conditions = validConditions.reduce(fmax) // Select observation with temperature.value not null && newest timestamp
		}
		else {
		conditions = data.observations.features[0];
		}
	 */
	const conditions = (validConditions.length > 0) ? validConditions[0].properties : data.features[0].properties;
 	let fl = conditions.temperature.value === null ? null : NWS.degF(conditions.temperature.value, conditions.temperature.unitCode);
	if (conditions.heatIndex.value !== null) { fl = NWS.degF(conditions.heatIndex.value, conditions.heatIndex.unitCode); }
	if (conditions.windChill.value !== null) { fl = NWS.degF(conditions.windChill.value, conditions.windChill.unitCode); }
	html += TAG.buildTag('h4', {
		'class': 'condLoc',
		text: "Current conditions at: " + NWS.stations.features[0].properties.name + ":"
	});
	html += TAG.buildTag('h5', {
		"class": "obsTime",
		text: "Observation time: " + ageString(conditions.timestamp)
	});
	html += TAG.buildTag('img', {
		"class": "icon",
		src: conditions.icon
	});
	html += TAG.p({
		"class": "condHead",
		text: TAG.buildTag('span', {
			'class': 'wind',
			text: ['Winds: ',
				conditions.windSpeed.value === null
				? "N/A"
				: NWS.deg2compass(conditions.windDirection.value) + ' at ' + Math.round(NWS.m2mi(conditions.windSpeed.value)*60*60) + ' mph'
			]
		})
		+ TAG.buildTag('span', {
			'class': 'pressure',
			text: ['Barometer: ',
				conditions.barometricPressure.value === null 
				? "N/A"
				: NWS.Pa2InHg(conditions.barometricPressure.value).toFixed(2) + ' inHg'
			]
		})
		+ TAG.buildTag('span', {
			'class': 'humidity',
			text: ['Humidity: ',
				conditions.relativeHumidity.value === null
				? "N/A"
				: Math.round(conditions.relativeHumidity.value) + '%'
			]
		})
		+ TAG.buildTag('span', {
			'class': 'dewpoint',
			text: ['Dewpoint: ',
				conditions.dewpoint.value === null
				? "N/A"
				: NWS.degF(conditions.dewpoint.value, conditions.dewpoint.unitCode) + '&deg;'
			]
		})
	});
	html += TAG.p({
		"class": "currTemp",
		text: (conditions.temperature.value === null ? "N/A" : (NWS.degF(conditions.temperature.value, conditions.temperature.unitCode) + "&deg;"))
			+ " " + conditions.textDescription
	});
	html += fl === null ? "" : TAG.p({
		"class": "tempRange",
		text: TAG.span({style: "font-weight: bold", text: "Feels like: "}) + fl + "&deg;"
	});
	if (NWS.hasOwnProperty('grid')){
		html += TAG.p({
			"class": "tempRange",
			text: TAG.span({style: "font-weight: bold", text: "High: "}) + NWS.degF(NWS.grid.properties.maxTemperature.values[0].value, NWS.grid.properties.maxTemperature.uom) + "&deg;"
		});
		html += TAG.p({
			"class": "tempRange",
			text: TAG.span({style: "font-weight: bold", text: "Low: "}) + NWS.degF(NWS.grid.properties.minTemperature.values[0].value, NWS.grid.properties.minTemperature.uom) + "&deg;"
		});
	}
	$("#currCond").empty().html(html);
};
function ageString(ts) {
	let rzlt = '';
	const dur = moment.duration(moment() - moment(ts));
	if ( !dur.isValid() ) { rzlt = 'unknown'; }
	else if (dur.asMilliseconds() < (1000 * 60)) { rzlt = 'just now'; }
	else {
		rzlt += dur.days() ? (dur.days() + ' day' + pluralSfx(dur.days()) + ' ') : '';
		rzlt += dur.hours() ? (dur.hours() + ' hr' + pluralSfx(dur.hours()) + ' ') : '';
		rzlt += (dur.minutes() + Math.round(dur.seconds() / 60)) ? (dur.minutes() + Math.round(dur.seconds() / 60) + ' min' + pluralSfx(dur.minutes() + Math.round(dur.seconds() / 60)) + ' ago') : '';
	}
	return rzlt;
};
function pluralSfx(val) {
	return (val > 1) ? 's' : '';
};
function plotGrid(data, status, xhdr){
  var html = '',
    chtHgt = 200,
    chtWid = 1000,
    svt = new Date(data.properties.validTimes.split('/')[0]),
    pop = data.properties.probabilityOfPrecipitation,
    quantPrecip = data.properties.quantitativePrecipitation,
    daysToChart = 7;
/*   $('h5').empty();
  $('#subloc').after('<h5>Forecast update time: '+new Date(data.properties.updateTime).toLocaleString()+'</h5>'); */
  chart = new Chart(chtWid, chtHgt, .05*chtWid, .05*chtWid, .2*chtHgt, .2*chtHgt);
  chart.yMin = 0; chart.yRange = 100;
  chart.xMin = svt.getTime(); chart.xRange = 1000*60*60*24*daysToChart; //Days of forecast to chart
  html += '<svg id="PoP" version="1.1" width="'+chtWid+'" height="'+chtHgt+'">';
  html += TAG.buildTag('defs', 
  	TAG.buildTag('clipPath', {
  	  id: "clipToChart",
  	  text: TAG.buildTag('rect', {
  	  	width: chart.xAxLen, height: chart.yAxLen, x: chart.xAxOrig, y: chart.topPad
  	  })
  	})
  );
  html += TAG.text({
    class: 'chartTitle',
    x: chart.xAxOrig + (chart.xAxLen/2),
    y: chart.topPad - 20,
    text: [
      TAG.tspan({class: 'cCover ttlText', text: 'Cloud Cover'}),
      ', ',
      TAG.tspan({class: 'quatPrecip ttlText', text: 'Quantitative Precipitation'}),
      ', ',
      TAG.tspan({class: 'probPrecip ttlText', text: 'Probability of Precipitation'}),
      ', ',
      TAG.tspan({class: 'relHum ttlText', text: 'Relative Humidity'}),
      ' & ',
      TAG.tspan({class: 'dewpt ttlText', text: 'Dewpoint'})
    ]
  });
  html += TAG.text({
  	"class": "gridUpdtTime",
  	x: chart.xAxOrig + chart.xAxLen,
  	y: chart.topPad,
  	dy: "-.2em",
  	text: "Forecast update time: " + ageString(data.properties.updateTime) //moment(data.properties.updateTime).fromNow()
  });
  /* html += '<path class="axes" d="'
    + 'M' + chart.xAxOrig + ',' + chart.yAxOrig
    + ' l' + chart.xAxLen + ',' + '0'
    + ' M' + chart.xAxOrig + ',' + chart.yAxOrig
    + ' l' + '0' + ',' + -1*chart.yAxLen
    + '"/>'; */
  html += chart.yAxisLabels({ticInc: 25});
  html += chart.xAxisTimeline();
  html += '<g id="chartArea" clip-path="url(#clipToChart)">';
/*   html += TAG.buildTag('path', {class: 'probPrecip atPath',
    d: pop.values.map(function(e,i){return chart.mapPath.call(chart,e,i)}).join('\n')
  });
  html += pop.values.map(function(e){return chart.mapTextLab.call(chart,e)}).join('\n'); */
  skyPts = data.properties.skyCover.values.map(function(e,i){return chart.mapPath.call(chart,e,i)});
  firstPt = data.properties.skyCover.values[0];
  firstPt.value = 0;
  lastPt = data.properties.skyCover.values[data.properties.skyCover.values.length-1];
  lastPt.value=0;
  //console.log(skyPts.join("\n") + chart.mapPath(lastPt,1) + "\n" + chart.mapPath(firstPt,1));
  html += TAG.buildTag('path', {class: 'skyPath', d: skyPts.join("\n") + chart.mapPath(lastPt,1) + "\n" + chart.mapPath(firstPt,1) + "Z"});
  html += pop.values.map(e=>chart.mapPoP.call(chart,e)).join("\n");
  html += quantPrecip.values.filter(function(e){return e.value>0;}).map(function(e,i,a){return chart.mapQuantPrecip.call(chart,e,i,a,'qPbox')}).join('\n');
  html += data.properties.snowfallAmount.values.filter(function(e){return e.value}).map(function(e,i,a){return chart.mapQuantPrecip.call(chart,e,i,a,'snowbox')}).join('\n');
  html += TAG.buildTag('path', {class: 'humPath',
    d: data.properties.relativeHumidity.values.map(function(e,i){return chart.mapPath.call(chart,e,i)}).join('\n')
  });
  html += TAG.buildTag('path', {class: 'dewPath',
    d: data.properties.dewpoint.values.map(e=>{e.value=NWS.degF(e.value,"unit:degC");return e;}).map(function(e,i){return chart.mapPath.call(chart,e,i)}).join('\n')
  });
  html += '</g>';
  html += '</svg>';
  //alert(html);
  $('#wx').html(html);
  //Temp Chart
  html = '';
  C2 = new Chart(chtWid, chtHgt, .05*chtWid, .05*chtWid, .2*chtHgt, .2*chtHgt);
  var at = data.properties.apparentTemperature,
      temp = data.properties.temperature;
      /* tempMinMax = at.values
      	//filter temperature change of 40 deg C in one period (implies data error)
      	.filter(function(e, i, a){return (e.value!==null) && (i===0 ? true : Math.abs(+e.value - +a[i-1].value) < 40)})
      	.reduce(function(m, a) {
        m.min = Math.min(m.min, NWS.degF(a.value, at.uom));
        m.max = Math.max(m.max, NWS.degF(a.value, at.uom));
        return m;
      }, {min: Number.MAX_VALUE, max: Number.MIN_VALUE});
  //console.log('min-max: ' + tempMinMax.min + ', ' + tempMinMax.max);
  C2.yMin = tempMinMax.min-(tempMinMax.min%5);
  C2.yRange = tempMinMax.max+(5-(tempMinMax.max%5)) - C2.yMin; */
  // Test new NWS.extremes(ary, accessor)
  console.log('Temp extremes: ' + NWS.extremes(temp.values.filter(NWS.badTemps), (e)=>NWS.degF(e.value, temp.uom)));
  console.log('Apparent Temp extremes: ' + NWS.extremes(at.values.filter(NWS.badTemps), (e)=>NWS.degF(e.value, at.uom)));
  console.log('O/A Temp extremes: ' + NWS.extremes(at.values.filter(NWS.badTemps).concat(temp.values.filter(NWS.badTemps)), (e)=>NWS.degF(e.value, at.uom)));
  var tempExtremes = NWS.extremes(at.values.filter(NWS.badTemps).concat(temp.values.filter(NWS.badTemps)), (e)=>NWS.degF(e.value, at.uom));
  C2.yMin = tempExtremes[0] - (tempExtremes[0] % 5);
  C2.yRange = tempExtremes[1] + (5 - (tempExtremes[1] % 5)) - C2.yMin;
  C2.xMin = chart.xMin; C2.xRange = chart.xRange;
  html += '<svg id="Temp" version="1.1" width="'+chtWid+'" height="'+chtHgt+'">';
  html += TAG.buildTag('defs', 
  	TAG.buildTag('clipPath', {
  	  id: "clipToChart",
  	  text: TAG.buildTag('rect', {
  	  	width: C2.xAxLen, height: C2.yAxLen, x: C2.xAxOrig, y: C2.topPad
  	  })
  	})
  );
  tempAxTicInc = C2.yRange / 5 > 7 ? 10 : 5;
  html += C2.yAxisLabels({ticInc: tempAxTicInc});
  html += C2.xAxisTimeline();
  html += TAG.text({
    class: 'chartTitle',
    x: C2.xAxOrig + (C2.xAxLen/2),
    y: C2.topPad,
    dy: '-.5em',
    text: [
      TAG.tspan({class: 'appTemp ttlText', text: 'Apparent Temperature'}),
      ', ',
      TAG.tspan({class: 'airTemp ttlText', text: 'Temperature'})
     ]
  });
  html += '<g id="chartArea" clip-path="url(#clipToChart)">';
  html += TAG.buildTag('path', {class: 'airTemp atPath',
    d: temp.values.filter(NWS.badTemps)
       .map(function(e){return {validTime: e.validTime, value: NWS.degF(e.value, at.uom)}})
       .map(function(e,i){return C2.mapPath.call(C2,e,i)}).join('\n')
  });
  html += TAG.buildTag('path', {class: 'appTemp atPath',
    d: at.values.filter(NWS.badTemps)
       .map(function(e){return {validTime: e.validTime, value: NWS.degF(e.value, at.uom)}})
       .map(function(e,i){return C2.mapPath.call(C2,e,i)}).join('\n')
  });
  let tempScale = scaleData().range([C2.yAxOrig, (C2.yAxOrig - C2.yAxLen)]).domain([C2.yMin, (C2.yMin + C2.yRange)]);
  let timeScale = scaleData().range([C2.xAxOrig, (C2.xAxOrig + C2.xAxLen)]).domain([C2.xMin, (C2.xMin + C2.xRange)]);
  let minTemps = data.properties.minTemperature;
  let maxTemps = data.properties.maxTemperature;
  let tempLabs = function(e,options){
  	  let rzlt = '';
  	  let dt = e.validTime.split("/");
  	  let tim = new Date(dt[0]).getTime() + (moment.duration(dt[1]).valueOf() / 2);
  	  let deg = NWS.degF(e.value, minTemps.uom);
  	  let x = timeScale(tim);
  	  let y = tempScale(deg);
  	  let dy = "0em"
  	  if (options.above) {
  	  	  dy = deg > (C2.yMin + C2.yRange - 5) ? "1em" : "0em"
  	  }
  	  else {
  	  	  dy = ".67em"
  	  }
  	  delete options["above"]
  	  let opts = $.extend({}, options, {x: x, y: y, dy: dy, text: deg.toString()});
  	  rzlt += TAG.text(opts);
	  /* rzlt += TAG.buildTag('path', {
		  d: "M" + (x-10) + "," + y + " l20,0 m-10,-10 l0,20",
		  stroke: "brown", fill: "none"
  	  }); */
  	  return rzlt;
  };
  html += maxTemps.values
  		.map(function(e){return tempLabs(e, {'class': 'minTLab', above: true})});
  html += minTemps.values
  		.map(function(e){return tempLabs(e, {'class': 'minTLab', above: false})});
  html += TAG.buildTag('line', { class: 'freezingPoint',
  	x1: C2.xAxOrig, y1 : C2.ypos(32),
  	x2: C2.xAxOrig + C2.xAxLen, y2: C2.ypos(32)
  });
  html += '</g>';
  html += '</svg>';
  //alert(html);
  $('#PoP').after(html);
}
function prcsGrid(data, status, xhdr) {
  //NWS['grid'] = data;
  var html = $('#dta').html();
  var rt = xhdr.responseText;
  var prop;
  html += '<pre>'+rt.substr(rt.indexOf('properties'),2000)+'</pre>';
  $('#dta').empty().html(html);
  html = '';
  prop = 'quantitativePrecipitation';
  html += '<table border=1 id="qp">';
  html += '<caption>' + prop + '</caption>';
  html += data.properties[prop].values
          .map(function(e){return '<tr><td>' + localTime(e.validTime.split('/')[0], -10).toLocaleString() + '</td><td>' + e.value + 'mm</td><td>' + Math.round(100*e.value/25.4)/100 + 'in</td></tr>'})
          .join('\n');
  html += '</table>';
  prop = 'probabilityOfPrecipitation';
  html += '<table border=1 id="pop">';
  html += '<caption>' + prop + '</caption>';
  html += data.properties[prop].values
          .map(function(e){return '<tr><td>' + localTime(e.validTime.split('/')[0], -10).toLocaleString() + '</td><td>' + e.value + '</td></tr>'})
          .join('\n');
  html += '</table>';
  $('#wx').html(html);
}
function processForecast(data,status,hdr){
	var html = '',
		periods = data.properties.periods,
		fper = periods[0];
	NWS['fcst']=data;
	html += TAG.p({
		'class': 'fcst',
		text: TAG.span({'class': 'boldBrown', text: 'Forecast for '+fper.name+': '})
			+ fper.detailedForecast
			+ TAG.span({'class': 'gridUpdtTime', 'text': ('(' + data.properties.generatedAt + ')')})
	});
	html += "<div>" + periods
			.filter(r=>r.isDaytime)
			.map(r=>"<div class='fcsticon'>" + TAG.img({
					src:r.icon,
					alt:r.shortForecast,
					title:r.detailedForecast
				}) + "<p class='iconname'>"+r.name+"</p></div>"
			)
			.join('') + "</div>";

	$("#forecast").empty().html(html);
}

function localTime(dstr,offset) {
  var d = new Date(dstr);
  var locD = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours()+offset);
  return locD;
}
function fmtTime(locD) {
  return (locD.getMonth() + 1) + '/' + locD.getDate() + '/' + lodD.getYear() + ' ';
}
function geoError(err) {
	alert('in geoError: ' + NWS.baseUrl + defaultLatLon);
  var geoErrMsgs = {
		    1: "PERMISSION_DENIED",
		    2: "POSITION_UNAVAILABLE",
		    3: "TIMEOUT"
	};
	alert('ERROR(' + err.code + ') in GeoLocation: [' + ((err.message.length > 0)?(err.message) : ('['+geoErrMsgs[err.code]+']') ) + ']');
  //loadWeather(urlTemplate + defaultLatLon);
	NWS.getData(NWS.baseUrl + defaultLatLon,initWX);
};

function wxAtMyLoc() {
  if (navigator.getgeolocation || "geolocation" in navigator) { //load wx w/ present lat/lng
    navigator.geolocation.getCurrentPosition(function(position) {
      NWS.getData(NWS.baseUrl + position.coords.latitude+','+position.coords.longitude, initWX)
    },geoError);
  } else {
    NWS.getData(NWS.baseUrl + defaultLatLon,initWX);
  }
};
function scaleData() {
	var domain = [0,1],
		range = [0,1];
	function scale(domVal) {
		return (domVal-domain[0])/(domain[1]-domain[0])*(range[1]-range[0])+range[0]
	};
	scale.domain = function(value) {
		if (!arguments.length) { return domain }
		domain = value;
		return scale;
	}
	scale.range = function(value) {
		if (!arguments.length) { return range }
		range = value;
		return scale;
	}
	return scale;
};
