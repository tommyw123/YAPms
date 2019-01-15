var states = [];
var lands = [];
var buttons = [];

// list of candidates
var candidates = {};

// data for the chart
var chart;
var chartData = {
	labels:[],
	datasets: [{
		label: "",
		backgroundColor: [],
		borderColor: chartBorderColor,
		borderWidth: chartBorderWidth,
		data:[]
	}, {}, {}, {}]
}
var chartOptions;
var chartType;
var chartPieScales;
var chartBarScales;
var chartPolarScales;
var chartRadarScales;

var chartLeans = true;

// paint data
var paintIndex = 'Tossup';
var maxColorValue = 2;

var chartBorderWidth = 2;
var chartBorderColor = '#000000';

var mode = 'paint';

var mapType = 'presidential';
var blockPresets = false;

var legendCounter = true;

var loadConfig = {
	filename: '', 
	dataid: '', 
	fontsize: 16, 
	senatefile: ''
};

var previousPalette = function() {
	lightPalette();	
};

// loads the svg element into the HTML
function loadMap(filename, dataid, fontsize, senatefile) {
	loadConfig = {
		filename: filename,
		dataid: dataid,
		fontsize: fontsize,
		senatefile: senatefile
	}

	console.log('Loading ' + filename);
	map = dataid;
	$('#map-div').load(filename, function() {
		console.log('Done loading ' + filename);

		var textHTML = document.getElementById('text');
		textHTML.style.fontSize = fontsize;

		initData(dataid);

		countVotes();
		updateChart();
		updateLegend();

		previousPalette();
		
		mapType = 'presidential';
		blockPresets = false;

		if(senatefile != null) {
			console.log('Loading ' + senatefile);
			loadSenateFile(senatefile);
		}
	});
}

function loadSenateFile(senatefile) {
	setMode('paint');
	mapType = 'senate';

	if(senatefile.includes('open') == false) {
		blockPresets = true;
	}

	initCandidates();

	var candidateNames = {};

	$.get(senatefile, function(data) {
		console.log('Done loading ' + senatefile);
	
		var loadMode = 'candidate';
		var lines = data.split('\n');
		for(var index = 0; index < lines.length; ++index) {
			var line = lines[index].trim();
			if(loadMode === 'candidate') {
				if(line === '!') {
					loadMode = 'disable';
				} else {
					var split = line.split(' ');
					candidateNames[split[0]] = split[1];
					var candidate = new Candidate(split[1], [split[2], split[3], split[4]]);
					candidates[split[1]] = candidate;
				}

			} else if(loadMode === 'disable') {
				var split = line.split(' ');
				var state = states.find(state => state.name === split[0]);
				var special = states.find(state => state.name === split[0] + '-S');
				var senatorA = candidateNames[split[1]];
				var senatorB = candidateNames[split[2]];

				if(typeof state !== 'undefined') {
					if(split[1] === 'o') {
						state.setColor('Tossup', 2);
					} else {
						state.setColor(senatorA, 0);
						state.toggleDisable();
					}
				} else {
					console.log(split[0]);
				}
				if(typeof special !== 'undefined') {
					if(split[2] === 'o') {
						special.setColor('Tossup', 2);
					} else {
						special.setColor(senatorB, 0);
						special.toggleDisable();
					}
				} else {
					console.log(split[0] + '-S');
				}
			}
		}

		verifyMap();
		verifyPaintIndex();
		chart.generateLegend();
		countVotes();
		updateChart();
		updateLegend();
		verifyTextToggle();
	});
}

// reads through the SVG and sets up states and buttons
function initData(dataid) {
	// clear any previously loaded data
	states = [];
	buttons = [];
	lands = [];

	// get list of all html state elements
	var htmlElements = document.getElementById('outlines').children;

	// iterate over each element
	for(var index = 0; index < htmlElements.length; ++index) {
		var htmlElement = htmlElements[index];
		var name = htmlElement.getAttribute('id');
		if(name.includes('text')) {
			// dont include text as states
			// make sure you can't click them
			//htmlElement.style.pointerEvents = 'none';
		} else if(name.includes('button')) {
			// don't include buttons as states
			htmlElement.setAttribute('onclick',
				'buttonClick(this)');
			htmlElement.style.fill = '#bbb7b2';
			buttons.push(htmlElement);

		} else if(name.includes('land')) {
			htmlElement.setAttribute('onclick', 'landClick(this)');
			htmlElement.style.fill = '#bbb7b2';
			lands.push(htmlElement);
		} else if(name.includes('-D') || name.includes('-A')) {
			htmlElement.setAttribute('onclick', 'districtClick(this)');
			htmlElement.style.fill = '#bbb7b2';
			states.push(new State(name, htmlElement, dataid));

		} else if(name.length == 2) {
			// set click function
			htmlElement.setAttribute('onclick', 
				'stateClick(this)');
			htmlElement.style.fill = '#bbb7b2';

			var state = new State(name, htmlElement, dataid);

			// add the state to the list
			states.push(state);
		}
	}

	var special = document.getElementById('special');
	var specialChildren;
	if(special != null) {
		specialChildren = special.children;

		for(var index = 0; index < specialChildren.length; ++index) {
			var htmlElement = specialChildren[index];
			htmlElement.setAttribute('onclick',
				'specialClick(this)');
			var name = htmlElement.id;
			var state = new State(name, htmlElement, dataid);
			states.push(state);
		}
	}
}

function initChart() {
	chartOptions = {
		// This basically inserts HTML into the legend-div div
		// it's a WIP
		legendCallback: function(chart) {
			console.log("Generating Legend...");
			var legendDiv = document.getElementById('legend-div');
			legendDiv.innerHTML = '';
			var index = -1;
			for(var key in candidates) {
				var candidate = candidates[key];
				++index;
				var legendElement = document.createElement('div');
				legendElement.setAttribute('id', candidate.name);
				legendElement.setAttribute('class', 'legend-button');
				legendElement.setAttribute(
					'onclick', 'legendClick("' + key + '", this); selectCandidateDisplay(this);');
				legendElement.style.backgroundColor = candidate.colors[0];

				// if its the 0th candidate, make sure its purple
				if(index == 0) {
					var color = candidate.colors[tossupColor];
					legendElement.style.backgroundColor = color;
					if(color === '#000000' ||
						color === 'black') {
						legendElement.style.color = 'white';
					} else {
						legendElement.style.color = 'black';

					}
				}
				legendElement.style.padding = 5;
				legendDiv.appendChild(legendElement);

				var legendText = document.createElement('div');
				legendText.setAttribute('id', candidate.name + '-text');	
				legendText.setAttribute('class', 'legend-button-text');
				legendText.innerHTLM = candidate.name;
				legendElement.appendChild(legendText);

				if(typeof candidate.img !== 'undefined') { 
					var img = document.createElement('IMG');
					var reader = new FileReader();

					reader.onload = function(event) {
						url = event.target.result;
						img.src = url;
						img.style.width = '60';
						img.style.height = '60';
						legendElement.append(img);
					}

					reader.readAsDataURL(candidate.img);
				}
			}
		},
		// do not display the build in legend for the chart
		legend: {
			display: false
		},
		tooltips: {
			display: true,
			position: 'average',
			titleFontColor: 'black',
			bodyFontColor: 'black',
			backgroundColor: 'white',
			borderColor: 'black',
			borderWidth: 2,
			caretSize: 0,
			cornerRadius: 0
		},
		// turn off animation
		animation: {
			animateRotate: false,
			animateScale: true
		},
		plugins: {
			datalabels: {
				//display: 'auto',
				display: function(context) {
					return context.dataset.data[context.dataIndex] !== 0;
				},
				backgroundColor: 'white',
				borderColor: 'black',
				borderRadius: 5,
				borderWidth: 2,
				color: 'black',
				font: {
					family: 'Roboto',
					size: 15,
					weight: 700
				}
			}
		},
		barStrokeWidth: 0
	}
//Chart.defaults.global.barPercentage = 0;
//Chart.defaults.global.categoryPercentage = 0;

	chartBarScales = {
		yAxes: [{
			stacked: true,
			gridLines: {
				display: false,
				drawBorder: false
			},
			ticks: {
				fontSize: 15,
				fontColor: '#ffffff',
				fontFamily: 'Roboto',
				fontStyle: 500
			}
		}],
		xAxes: [{
			stacked: true,
			gridLines: {
				display: false,
				drawBorder: false
			},
			ticks: {
				beginAtZero: true,
				fontSize: 15,
				fontColor: '#ffffff',
				fontStyle: 500,
				fontFamily: 'Roboto'
			}
		}]
	}

	chartPieScales = {
		yAxes: [{
			display: false
		}],
		xAxes: [{
			display: false
		}]
	}
	
	chartPolarScales = {
		display: false
	}

	chartRadarScales = {
		display: false
	}

	chartOptions.scales = chartPieScales;

	Chart.defaults.global.elements.rectangle.borderWidth = 2;
	
	// get the context
	var ctx = document.getElementById('chart').getContext('2d');
	ctx.height = 600;

	// create the chart
	chart = new Chart(ctx, {
		type: 'pie',
		data: {
			labels:[],
			datasets: [{
				label: "",
				backgroundColor: '#ffffff',
				borderColor: '#ffffff',
				borderWidth: 0,
				data:[]
			}, {}, {}, {}],
		},
		options: chartOptions,
		maintainAspectRatio: true
	});

	chart.generateLegend();
	
	var htmldiv = document.getElementById('chart-div');
	var html = document.getElementById('chart');
	htmldiv.style.position = 'absolute';
	html.style.display = 'none';
}

// empty the list of candidates and insert the tossup candidate
function initCandidates() {
	candidates = {};
	candidates['Tossup'] = TOSSUP;
	//new Candidate('Tossup', ['#000000', '#ff00ff', '#bbb7b2']);
}

function setCandidate(e) {
	// hide the popup window
	e.parentElement.style.display = 'none';

	var candidateid = e.parentElement.querySelector('#candidate-originalName').value;
	var newname = e.parentElement.querySelector('#candidate-name').value;
	var solidColor = e.parentElement.querySelector('#candidate-solid').value;
	var likelyColor = e.parentElement.querySelector('#candidate-likely').value;
	var leanColor = e.parentElement.querySelector('#candidate-lean').value;

	// only rename the property if the name changed
	if(newname !== candidateid) {
		Object.defineProperty(candidates, newname,
			Object.getOwnPropertyDescriptor(candidates, candidateid));
		delete candidates[candidateid];
	}

	var candidate = candidates[newname];
	candidate.name = newname;
	candidate.colors[0] = solidColor;
	candidate.colors[1] = likelyColor;
	candidate.colors[2] = leanColor;

	chart.generateLegend();
	countVotes();
	updateLegend();
	verifyMap();
	updateChart();
}

function setEC(e) {
	// hide the popup window
	e.parentElement.style.display = 'none';

	// get the stateId and input value
	var stateId = e.parentElement.querySelector('#state-id').value;
	var input = e.parentElement.querySelector('#state-ec').value;

	// get the state and set its new vote count
	states.forEach(function(element) {
		if(element.getName() === stateId) {
			element.voteCount = parseInt(input);
		}
	});


	// update the html text display
	var stateText = document.getElementById(stateId + '-text');
	// if the id has a dash then remove it
	if(stateId.includes('-')) {
		var split = stateId.split('-');
		stateId = split[0] + split[1];
	}
	var text = stateId + ' ' + input;
	stateText.innerHTML = text;

	// recount the votes
	countVotes();
	updateChart();
	updateLegend();
}

// dynamically change the chart from one form to another
function setChart(type) {
	var htmldiv = document.getElementById('chart-div');
	var html = document.getElementById('chart');
	var ctx = html.getContext('2d');

	if(type === 'none') {
		htmldiv.style.position = 'absolute';
		html.style.display = 'none';
		return;
	}
	
	chartData = {
		labels:[],
		datasets: [{
			borderColor: chartBorderColor,
			borderWidth: chartBorderWidth,
			data:[]
		}]
	};

	chartType = type;

	htmldiv.style.position = 'relative';
	html.style.display = 'inline-block';

	// set the proper scales
	if(type === 'horizontalBar') {
		chartOptions.scales = chartBarScales;
		delete chartOptions.scale;
		// horizontal bar needs multiple datasets
		for(var i = 0; i < 3; ++i) {
			chartData.datasets.push({
				borderColor: chartBorderColor,
				borderWidth: chartBorderWidth,
				data:[]
			});
		}
	} else if(type === 'pie' || type === 'doughnut') {
		chartOptions.scales = chartPieScales;
		delete chartOptions.scale;
	} else if(type === 'polarArea') {
		chartOptions.scales = chartPolarScales;	
		chartOptions.scale =  {
			display: false
		}
	} else if(type === 'radar') {
		chartOptions.scale = chartRadarScales;	
	}

	// first destroy the chart
	chart.destroy();
	// then rebuild
	chart = new Chart(ctx, {type: type, data: chartData, options: chartOptions});
	countVotes();
	updateChart();
}

function rebuildChart() {
	var html = document.getElementById('chart');
	var ctx = html.getContext('2d');
	// save type
	var type = chart.config.type;
	chart.destroy();
	chart = new Chart(ctx, {type: type, data: chartData, options: chartOptions});
	updateChart();
}

function toggleLegendCounter() {
	legendCounter = !legendCounter;
	updateLegend();
}

function toggleChartLabels() {

	if(chartOptions.plugins.datalabels.display != false) {
		chartOptions.plugins.datalabels.display = false;
	} else {
		chartOptions.plugins.datalabels.display = function(context) {
			return context.dataset.data[context.dataIndex] !== 0;
		}
	}

	rebuildChart();
	//setChart(chart.config.type);
}

function toggleChartLeans() {
	chartLeans = !chartLeans;
	//rebuildChart();
	updateChart();
}

function setMode(set) {
	// if editing a senate map disble delete ec and candidte
	if(mapType === 'senate' && (set === 'ec' || set === 'candidate' ||
		set === 'delete')) {
		var notification = document.getElementById('notification');
		notification.style.display = 'inline';
		var message = notification.querySelector('#notification-message');
		
		var notificationText = 'This mode is not available while editing a senate map';
		message.innerHTML = notificationText;
		var title = notification.querySelector('#notification-title');
		title.innerHTML = 'Sorry';

		return;
	}
	mode = set;

	var modeHTML = document.getElementById('menu-middle');
	var modeText;
	var notificationText;
	if(set == 'paint') {
		modeText = 'Mode - Paint';
	} else if(set == 'ec') {
		modeText = 'Mode - EC Edit';
		notificationText = "Click on a state to set its electoral college";
	} else if(set == 'delete') {
		modeText = 'Mode - Delete';
		notificationText = "Click on a state to delete it";
	} else if(set == 'candidate') {
		modeText = 'Mode - Candidate Edit';
		notificationText = "Click on a candidate in the legend to edit its name and color";
	}

	modeHTML.innerHTML = modeText;

	var notification = document.getElementById('notification');
	if(mode === 'paint') {
		notification.style.display = 'none';
	} else if(mode !== 'paint') {
		notification.style.display = 'inline';
		var title = notification.querySelector('#notification-title');
		title.innerHTML = modeText;
		var message = notification.querySelector('#notification-message');
		message.innerHTML = notificationText;
	}
}

function closeNotification(e) {
	e.parentElement.style.display = 'none';
}

// add candidate to the list
// update map, chart and legend
function addCandidate() {
	var name = document.getElementById('name').value;

	// ignore white space candidates
	if(name.trim() === '') {
		return;
	}

	var solid = document.getElementById('solid').value;
	var likely = document.getElementById('likely').value;
	var leaning = document.getElementById('leaning').value;

	var img = document.getElementById('image-upload').files[0];

	var candidate = new Candidate(name, [solid, likely, leaning], img);
	candidates[name] = candidate;

	verifyMap();
	verifyPaintIndex();
	countVotes();
	updateChart();
	chart.generateLegend();
	updateLegend();
	verifyTextToggle();
}


// if paint index is invalid, change it to tossup
// ( WORK IN PROGRESS)
function verifyPaintIndex() {
	if(typeof candidates[paintIndex] === 'undefined') {
		paintIndex = 'Tossup';
	}
}

// make sure states are proper colors
// if states have invalid colors, turn them white
function verifyMap() {
	states.forEach(function(state) {
		state.verifyDisabledColor();
		if(typeof candidates[state.candidate] === 'undefined') {
			// if the current color is out of bounds set it to white
			state.setColor('Tossup', tossupColor);
		} else { 
			// the candidate the state thinks its controled by
			var currentCandidate = state.getCandidate();
			// the candidate the state should be controle by
			var shouldCandidate = candidates[state.getCandidate()].name;

			// if these values differ, change the state to tossup
			if(currentCandidate !== shouldCandidate) {
				state.setColor('Tossup', tossupColor);
			} else if(state.getCandidate() === 'Tossup') {
				state.setColor('Tossup', 2);	
			}else {
				state.setColor(state.getCandidate(), state.getColorValue());
			}
		}
	});
				
}

// sets all states to white
function clearMap() {
	loadMap(loadConfig.filename, loadConfig.dataid, loadConfig.fontsize, loadConfig.senatefile);
}

// iterate over each state and delegate votes to the candidate
function countVotes() {
	// iterate over every candidate
	//candidates.forEach(function(candidate, candidateIndex) {
	var candidateIndex = -1;
	for(var key in candidates) {
		var candidate = candidates[key];
		++candidateIndex;
		candidate.voteCount = 0;
		candidate.probVoteCounts = [0,0,0];
		// iterate over every state
		for(var stateIndex = 0; 
			stateIndex < states.length; ++stateIndex) {

			var state = states[stateIndex];

			// if the candidate value of the state
			// equals the index value of the candidate
			// add the vote count to the candidate 
			if(state.candidate === key) {
				candidate.voteCount += state.voteCount;
				candidate.probVoteCounts[state.colorValue] += state.voteCount;
			}
		}
	}
}

// updates the information of the chart (so the numbers change)
function updateChart() {

	if(chartType === 'horizontalBar') {
		updateBarChart();
	} else {
		updateNonRadarChart();	
	}

	chart.config.data = chartData;
	chart.update();
}

function updateBarChart() {
	chartData.labels = [];
	chartData.datasets[0].data = [];
	chartData.datasets[0].backgroundColor = [];
	chartData.datasets[1].data = [];
	chartData.datasets[1].backgroundColor = [];
	chartData.datasets[2].data = [];
	chartData.datasets[2].backgroundColor = [];
	
	// each label is a candidate
	for(var key in candidates) {
		chartData.labels.push(key);
	}

	for(var probIndex = 0; probIndex < 3; ++probIndex) {
		for(var key in candidates) {
			var candidate = candidates[key];
			var name = candidate.name;
			var count = candidate.probVoteCounts[probIndex];
			chartData.datasets[probIndex].data.push(count);

			var color = candidate.colors[probIndex];
			chartData.datasets[probIndex].backgroundColor.push(color);
		}
	}
}

function updateNonRadarChart() {
	// reset the chart data
	/*chartData = {
		labels:[],
		datasets: [{
			label: "",
			backgroundColor: [],
			borderColor: chartBorderColor,
			borderWidth: chartBorderWidth,
			data:[]
		}]
	};*/
	chartData.labels = [];

	chartData.datasets[0].data = [];
	chartData.datasets[0].backgroundColor = [];
	chartData.datasets[0].borderColor = chartBorderColor;
	chartData.datasets[0].borderWidth = chartBorderWidth;

	// loop though candidates
	var candidateIndex = -1;
	for(var key in candidates) {
		++candidateIndex;
		var candidate = candidates[key];
		var name = candidate.name;
		var voteCount = candidate.voteCount;
		var color = candidate.colors[0];
		if(candidateIndex == 0) {
			color = candidates['Tossup'].colors[tossupColor];
			// append the candidate label
			chartData.labels[0] = 'Tossup';
			// append the vote count
			chartData.datasets[0].data[0] = voteCount;
			// change the background color of the visual
			chartData.datasets[0].backgroundColor.push(color);
		} else if(chartLeans) {

			for(var probIndex = 0; probIndex < 3; ++probIndex) {
				var count = candidate.probVoteCounts[probIndex];
				color = candidate.colors[probIndex];
				var index = (probIndex + (candidateIndex * 3)) - 2;
				chartData.labels[index] = name;
				chartData.datasets[0].data[index] = count;
				chartData.datasets[0].backgroundColor.push(color);
			}
		} else {
			var count = candidate.voteCount;
			color = candidate.colors[0];
			chartData.labels[candidateIndex] = name;
			chartData.datasets[0].data[candidateIndex] = count;
			chartData.datasets[0].backgroundColor.push(color);
		}
	}
}

// displays the vote count on the legend
// makes sure that the selected candidate is highlighted
function updateLegend() {
	var index = -1;
	for(var key in candidates) {
		var candidate = candidates[key];
		++index;
		var html = document.getElementById(candidate.name + '-text');

		var newHTML = candidate.name;

		if(legendCounter == true) {
			newHTML += ' ' + candidate.voteCount;
		}

		html.innerHTML = newHTML;

		if(key === paintIndex) {
			selectCandidateDisplay(html.parentElement);
		}
	}
}

function start() {
	initCandidates();
	initChart();
	loadMap('../presidential.svg', 'usa_ec', 16);
}

start();
