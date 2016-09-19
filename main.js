var Images = {};

// 0, 5, 50, 200, 1000
var WinningTable = {
	0: [0, 0],
	5: [1, 5],
	10: [2, 5],
	65: [3, 5, 1, 50],
	100: [2, 50],
	200: [1, 200],
	500: [2, 50, 2, 200],
	1000: [1, 1000],
	5000: [5, 1000],
};

var roundWinnings = null;

function showMenu(show) {
	populateWinnings();
	var menu = document.getElementById("menu");
	menu.style.display = show ? "block" : "none";

	var roundW = document.getElementById("round-winnings");
	if (roundWinnings != null) {
		roundW.innerHTML = "Voitto: " + roundWinnings + "€";
		roundW.style.visibility = "visible";
	}
}

function populateWinnings() {
	var winningsSelect = document.getElementById("winnings");

	while (winningsSelect.firstChild) {
		winningsSelect.removeChild(winningsSelect.firstChild);
	}

	for (key in WinningTable) {
		var opt = document.createElement("option");
		opt.value = key;
		opt.innerHTML = key + " €";

		winningsSelect.appendChild(opt);
	}
}

function init() {
	showMenu(true);
	run();
}

function start() {
	var winning = document.getElementById("winnings").value;
	var values = WinningTable[winning];

	Game.sequence = getSequence(values);

	showMenu(false);
}

function getSequence(values) {
	var pool = [0, 1, 2, 3, 4]; // Drop indices
	var indices = [];
	var sequence = [];

	for (var i = 0; i < values.length; i += 2) {
		var count = values[i];

		for (var j = 0; j < count; j++) {
			var index = Math.floor(pool.length * Math.random());
			var drawn = pool.splice(index, 1);
			indices.push({
				index: drawn[0],
				value: values[i + 1]
			});
		}
	}

	var notFound;
	for (var i = 0; i < 5; i++) {
		notFound = true;

		for (var j = 0; j < indices.length; j++) {
			if (i == indices[j].index) {
				sequence.push(indices[j].value);
				notFound = false;
			}
		}

		if (notFound) {
			sequence.push(0);
		}
	}

	return sequence;
}

function run() {

	createjs.MotionGuidePlugin.install();

	var queue = new createjs.LoadQueue(false);
	queue.on("fileload", handleFileLoad, this);
	queue.on("complete", handleComplete, this);

	var manifest = [
		{ id: "background", src: "images/Background.png" },
		{ id: "overlay", src: "images/Overlay.png" },
		{ id: "pad", src: "images/Pad.png" },
		{ id: "btnwinning", src: "images/BtnWinning.png" },
		{ id: "acorn", src: "images/Acorn.png" },
		{ id: "cursor", src: "images/Cursor.png" },
		{ id: "infobox", src: "images/InfoBox.png" }
	];

	queue.loadManifest(manifest);

	function handleFileLoad(event) {
		Images[event.item.id] = event.result;
	}

	function handleComplete() {
		Game.run();
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
