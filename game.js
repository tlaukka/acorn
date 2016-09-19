var Game = {};

Game.sequence = null;

// Game.run = function(sequence) {
Game.run = function() {

	var STAGE_WIDTH = 768;//430;
	var STAGE_HEIGHT = 738;//610;
	var STAGE_MARGIN = 64;
	var BOARD_WIDTH = 430;
	var BOARD_HEIGHT = 610;
	var BLOCK_ROW_COUNT = 9; // Last row is the winning row
	var BLOCK_COLUMN_COUNT = 6;

	var stage = new createjs.Stage("canvas");
	stage.canvas.width = STAGE_WIDTH;
	stage.canvas.height = STAGE_HEIGHT;
	stage.enableMouseOver();

	var winningBlock = null;
	var currentWinningsInfo = null;
	var currentDrop = 0;

	var background = createBackground();
	var overlay = createOverlay();
	var blocks = createBlocks(BLOCK_ROW_COUNT, BLOCK_COLUMN_COUNT);
	var paths = createPaths();
	var pads = createPads(paths);
	var ball = createBall();

	var winnings = [0, 5, 0, 200, 1000, 0, 50];
	var acorns = [];
	var acornContainer = createAcorns();
	var labels = createLabels();
	var menu = createMenu();

	ball.visible = false;
	setWinningBlock(0);

	stage.addChild(background);
	stage.addChild(overlay);
	stage.addChild(acornContainer);

	// Pads
	stage.addChild(pads);

	// Labels
	stage.addChild(labels);
	stage.addChild(ball);
	stage.addChild(menu);

	var dbgShape = new createjs.Shape();
	stage.addChild(dbgShape);

	stage.update();

	setupLinks();

	createjs.Ticker.setFPS(60);

	//Update stage will render next frame
	createjs.Ticker.addEventListener("tick", stage);

	//resetRound();

	function resetRound() {
		currentDrop = 0;
		enablePads(true);
		setCurrentWinningsInfo(0);

		for (var i = 0; i < acorns.length; i++) {
			acorns[i].visible = true;
		}
	}

	function createBackground() {
		var background = new createjs.Bitmap(Images["background"]);
		return background;
	}

	function createOverlay() {
		var overlay = new createjs.Bitmap(Images["overlay"]);
		return overlay;
	}

	function createBlocks(rowCount, columnCount) {
		var marginTop = 100 + STAGE_MARGIN;
		var marginLeft = 35 + STAGE_MARGIN;
		var spacing = 60;

		var blocks = initBlocks(rowCount, columnCount);

		for (var i = 0; i < blocks.length; i++) {
			for (var j = 0; j < blocks[i].length; j++) {

				blocks[i][j] = {
					row: i,
					column: j,
					x: (marginLeft + (i % 2) * (spacing / 2)) + j * spacing,
					y: marginTop + i * spacing,
					lbc: 0, // Next left block count
					rbc: 0, // Next right block count
					next: []
				};
			}
		}

		return blocks;
	}

	function initBlocks(rowCount, columnCount) {
		var blocks = new Array(rowCount);
		for (var i = 0; i < rowCount; i++) {
			if (i % 2 == 0) {
				// Extra block for even rows
				blocks[i] = new Array(columnCount + 1);
			}
			else {
				blocks[i] = new Array(columnCount);
			}
		}

		return blocks;
	}

	function createLabels() {
		var labels = new createjs.Container();
		var row = blocks.length - 1;

		for (var i = 0; i < winnings.length; i++) {
			if (winnings[i] == 0) {
				// Skip zero winnings
				continue;
			}

			var border = new createjs.Text(winnings[i].toString() + "€", "20px Arial", "#222222");
			border.x = blocks[row][i].x;
			border.y = blocks[row][i].y;
			border.textAlign = "center";
			border.outline = 4;

			var label = border.clone();
			label.color = "#cccccc";
			label.outline = 0;

			labels.addChild(border, label);
		}

		return labels;
	}

	function createPaths() {
		var paths = [];
		for (var i = 1; i < blocks[0].length - 1; i++) {
			paths.push({
				start: { x: blocks[0][i].x, y: blocks[0][i].y - 60 },
				next: blocks[0][i]
			});
		}

		return paths;
	}

	function createPads(paths) {
		var pads = new createjs.Container();

		for (var i = 0; i < paths.length; i++) {
			var pad = new createjs.Bitmap(Images["pad"]);
			pad.x = paths[i].start.x - Math.floor(pad.image.width / 2);
			pad.y = paths[i].start.y - Math.floor(pad.image.height / 2);

			var hitArea = new createjs.Shape();
			hitArea.graphics.beginFill("#000000").drawRect(0, 0, pad.image.width, pad.image.height);
			pad.hitArea = hitArea;

			pad.on("mouseover", function() {
				this.alpha = 0.8;
			});

			pad.on("mouseout", function() {
				this.alpha = 1;
			});

			pad.on("click", handleClick, null, false, { path: paths[i] });
			function handleClick(evt, data) {
				// Disable buttons during drop
				enablePads(false);
				setWinningBlock(Game.sequence[currentDrop]);
				drop(data.path, winningBlock);
			}

			pads.addChild(pad);
		}

		return pads;
	}

	function createAcorns() {
		var rotation = 14;
		var container = new createjs.Container();
		container.x = 96;
		container.y = 30;

		for (var i = 0; i < 5; i++) {
			var acorn = new createjs.Bitmap(Images["acorn"]);
			acorn.x = i * 94;
			acorn.y = -(i % 2) * 8;
			acorn.regX = acorn.image.width / 2;
			acorn.regY = acorn.image.height / 2;
			acorn.rotation = (i % 2) == 1 ? rotation : -rotation;

			acorns.push(acorn);

			container.addChild(acorn);
		}

		return container;
	}

	function createMenu() {
		var margin = 36;

		var menu = new createjs.Container();
		menu.x = STAGE_MARGIN + BOARD_WIDTH + margin;
		menu.y = STAGE_MARGIN;

		var infoBox = new createjs.Bitmap(Images["infobox"]);
		infoBox.y = 0;

		var labelBorder = new createjs.Text("Voitot", "24px Arial", "#222222");
		labelBorder.x = 100;
		labelBorder.y = 10;
		labelBorder.textAlign = "center";
		labelBorder.textBaseline = "top";
		labelBorder.outline = 4;

		var label = labelBorder.clone();
		label.color = "#cccccc";
		label.outline = 0;

		var infoBorder = new createjs.Text("0 €", "24px Arial", "#222222");
		infoBorder.x = 100;
		infoBorder.y = 38;
		infoBorder.textAlign = "center";
		infoBorder.textBaseline = "top";
		infoBorder.outline = 4;

		var info = infoBorder.clone();
		info.color = "#cccccc";
		info.outline = 0;

		currentWinningsInfo = {
			border: infoBorder,
			label: info,
			value: 0
		};

		menu.addChild(infoBox, labelBorder, label, infoBorder, info);

		return menu;
	}

	function addCurrentWinningsInfo(value) {
		currentWinningsInfo.value += parseInt(value);
		currentWinningsInfo.border.text = currentWinningsInfo.value + " €";
		currentWinningsInfo.label.text = currentWinningsInfo.border.text;
	}

	function setCurrentWinningsInfo(value) {
		currentWinningsInfo.value = value;
		currentWinningsInfo.border.text = currentWinningsInfo.value + " €";
		currentWinningsInfo.label.text = currentWinningsInfo.border.text;
	}

	function setWinningBlock(winning) {
		var indices = getIndices(winnings, winning);
		var index = getRandomInt(0, indices.length);
		winningBlock = blocks[blocks.length - 1][indices[index]];
	}

	function enablePads(enabled) {
		pads.mouseEnabled = enabled;
		pads.alpha = enabled ? 1 : 0.5;
	}

	function createBall() {
		var ball = new createjs.Bitmap(Images["acorn"]);
		ball.regX = Math.floor(ball.image.width / 2);
		ball.regY = Math.floor(ball.image.height / 2);

		return ball;
	}

	function drop(path, end) {
		ball.x = path.start.x;
		ball.y = path.start.y;

		ball.visible = true;

		var tween = createjs.Tween.get(ball);
		tween.to({ x: path.next.x, y: path.next.y - 20 }, 300);

		var route = getRoute(path, end);

		var orient = ["cw", "ccw"];

		for (var i = 0; i < route.length; i++) {
			tween.to(
				{ guide: { path: route[i].points, orient: route[i].orient } },
				route[i].duration,
				createjs.Ease.getPowIn(route[i].pow)
			);
		}

		tween.to({ y: end.y + 20 }, 100);

		// Reached the end of the route
		tween.call(function() {
			ball.visible = false;
			addCurrentWinningsInfo(Game.sequence[currentDrop - 1]);

			// Out of acorns?
			if (currentDrop >= Game.sequence.length) {
				setTimeout(function() {
					roundWinnings = currentWinningsInfo.value;
					resetRound();
					showMenu(true);
				}, 1500);

				return;
			}

			enablePads(true);
		});

		//dbgDrawPath(path, route);

		acorns[currentDrop].visible = false;
		currentDrop++;
	}

	function getRoute(path, end) {
		var route = [];
		var start = path.next;
		var index = 0;

		while (start.next != null) {

			var cd = end.column - start.column;

			if (start.row == blocks.length - 2) {
				// Last row until winning row
				if (cd <= -1 || cd >= 2) {
					// Too far away, have to move sideways
					if (cd < 0) {
						// To the left
						index = 0;
					}
					else {
						// To the right
						index = start.lbc + start.rbc - 1;
					}
				}
				else {
					// Reached the end
					if (cd == 0) {
						// To the bottom left
						index = start.lbc - 1
					}
					else {
						// To the bottom right
						index = start.lbc;
					}
				}
			}
			else if (start.row < 4) {
				// First 4 rows are random
				index = getRandomInt(0, start.next.length);
			}
			else {
				if (cd < 0) {
					// To the left
					index = getRandomInt(0, start.lbc);
				}
				else if (cd > 0) {
					// To the right
					index = getRandomInt(start.lbc, start.lbc + start.rbc);
				}
				else {
					// Doesn't matter
					index = getRandomInt(0, start.next.length);
				}
			}

			var routePoint = {
				points: start.next[index].path,
				orient: start.next[index].orient,
				duration: start.next[index].duration,
				pow: start.next[index].pow
			};

			route.push(routePoint);
			start = start.next[index].block;
		}

		return route;
	}

	function dbgDrawPath(path, route) {
		dbgShape.graphics.clear();
		dbgShape.graphics.beginStroke("#ff00ff").moveTo(path.next.x, path.next.y - 20);
		for (var i = 0; i < route.length; i++) {
			dbgShape.graphics.curveTo(route[i].points[2], route[i].points[3], route[i].points[4], route[i].points[5]);
		}
	}

	function setupLinks() {
		var spacing = 60; // Block spacing
		var br = 20; // Block radius
		var cy = 60 + STAGE_MARGIN; // Control point y

		var vd = 510; // Vertical move duration
		var hd = 380; // Horizontal move duration

		var vpow = 1.2; // Vertical ease power
		var hpow = 1; // Horizontal ease power

		var Even = {
			l: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + 35 + j * spacing, cy + i * spacing, b[i][j - 1].x, b[i][j - 1].y - br];
			},
			bl: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + 25 + j * spacing, cy + i * spacing, b[i + 1][j].x, b[i + 1][j].y - br];
			},
			br: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + 105 + j * spacing, cy + i * spacing, b[i + 1][j + 1].x, b[i + 1][j + 1].y - br];
			},
			r: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + 95 + j * spacing, cy + i * spacing, b[i][j + 1].x, b[i][j + 1].y - br];
			}
		};

		var Odd = {
			l: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + 0 + j * spacing, cy + i * spacing, b[i][j - 1].x, b[i][j - 1].y - br];
			},
			bl: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + -5 + j * spacing, cy + i * spacing, b[i + 1][j - 1].x, b[i + 1][j - 1].y - br];
			},
			br: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + 75 + j * spacing, cy + i * spacing, b[i + 1][j].x, b[i + 1][j].y - br];
			},
			r: function(i, j, b) {
				return [b[i][j].x, b[i][j].y - br, STAGE_MARGIN + 65 + j * spacing, cy + i * spacing, b[i][j + 1].x, b[i][j + 1].y - br];
			}
		};

		var Orient = {
			l: "ccw",
			r: "cw"
		};

		for (var i = 0; i < blocks.length; i++) {
			for (var j = 0; j < blocks[i].length; j++) {

				if (i == blocks.length - 1) {
					// Last row
					blocks[i][j].next = null;
				}
				else if (i % 2 == 1) {
					// Even rows
					if (j == 0) {
						// First column
						blocks[i][j].next.push({ block: blocks[i + 1][j], path: Even.bl(i, j, blocks), orient: Orient.l, duration: vd, pow: vpow }); // Bottom left
						blocks[i][j].next.push({ block: blocks[i + 1][j + 1], path: Even.br(i, j, blocks), orient: Orient.r, duration: vd, pow: vpow }); // Bottom right
						blocks[i][j].next.push({ block: blocks[i][j + 1], path: Even.r(i, j, blocks), orient: Orient.r, duration: hd, pow: hpow }); // Right
						blocks[i][j].lbc = 1;
						blocks[i][j].rbc = 2;
					}
					else if (j == blocks[i].length - 1) {
						// Last column
						blocks[i][j].next.push({ block: blocks[i][j - 1], path: Even.l(i, j, blocks), orient: Orient.l, duration: hd, pow: hpow }); // Left
						blocks[i][j].next.push({ block: blocks[i + 1][j], path: Even.bl(i, j, blocks), orient: Orient.l, duration: vd, pow: vpow }); // Bottom left
						blocks[i][j].next.push({ block: blocks[i + 1][j + 1], path: Even.br(i, j, blocks), orient: Orient.r, duration: vd, pow: vpow }); // Bottom right
						blocks[i][j].lbc = 2;
						blocks[i][j].rbc = 1;
					}
					else {
						// Middle
						blocks[i][j].next.push({ block: blocks[i][j - 1], path: Even.l(i, j, blocks), orient: Orient.l, duration: hd, pow: hpow }); // Left
						blocks[i][j].next.push({ block: blocks[i + 1][j], path: Even.bl(i , j, blocks), orient: Orient.l, duration: vd, pow: vpow }); // Bottom left
						blocks[i][j].next.push({ block: blocks[i + 1][j + 1], path: Even.br(i, j, blocks), orient: Orient.r, duration: vd, pow: vpow }); // Bottom right
						blocks[i][j].next.push({ block: blocks[i][j + 1], path: Even.r(i, j, blocks), orient: Orient.r, duration: hd, pow: hpow }); // Right
						blocks[i][j].lbc = 2;
						blocks[i][j].rbc = 2;
					}
				}
				else {
					// Odd rows
					if (j == 0) {
						// First column
						blocks[i][j].next.push({ block: blocks[i + 1][j], path: Odd.br(i, j, blocks), orient: Orient.r, duration: vd, pow: vpow }); // Bottom right
						blocks[i][j].next.push({ block: blocks[i][j + 1], path: Odd.r(i, j, blocks), orient: Orient.r, duration: hd, pow: hpow }); // Right
						blocks[i][j].lbc = 0;
						blocks[i][j].rbc = 2;
					}
					else if (j == blocks[i].length - 1) {
						// Last column
						blocks[i][j].next.push({ block: blocks[i][j - 1], path: Odd.l(i, j, blocks), orient: Orient.l, duration: hd, pow: hpow }); // Left
						blocks[i][j].next.push({ block: blocks[i + 1][j - 1], path: Odd.bl(i, j, blocks), orient: Orient.l, duration: vd, pow: vpow }); // Bottom left
						blocks[i][j].lbc = 2;
						blocks[i][j].rbc = 0;
					}
					else {
						// Middle
						blocks[i][j].next.push({ block: blocks[i][j - 1], path: Odd.l(i, j, blocks), orient: Orient.l, duration: hd, pow: hpow }); // Left
						blocks[i][j].next.push({ block: blocks[i + 1][j - 1], path: Odd.bl(i, j, blocks), orient: Orient.l, duration: vd, pow: vpow }); // Bottom left
						blocks[i][j].next.push({ block: blocks[i + 1][j], path: Odd.br(i, j, blocks), orient: Orient.r, duration: vd, pow: vpow }); // Bottom right
						blocks[i][j].next.push({ block: blocks[i][j + 1], path: Odd.r(i, j, blocks), orient: Orient.r, duration: hd, pow: hpow }); // Right
						blocks[i][j].lbc = 2;
						blocks[i][j].rbc = 2;
					}
				}
			}
		}
	}

	function getUniqueValues(array) {
		var n = [];
		for(var i = 0; i < array.length; i++) {
			if (n.indexOf(array[i]) == -1) n.push(array[i]);
		}

		return n;
	}

	function getIndices(array, value) {
		var indices = [];
		for (var i = 0; i < array.length; i++) {
			if (array[i] == value) {
				indices.push(i);
			}
		}

		return indices;
	}
};
