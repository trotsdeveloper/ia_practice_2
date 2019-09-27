const Agent = require('ai-agents').Agent;

class CustomAgent extends Agent {
    constructor(value) {
        super(value);
    }
    
    /**
     * return a new move. The move is an array of two integers, representing the
     * row and column number of the hex to play. If the given movement is not valid,
     * the Hex controller will perform a random valid movement for the player
     * Example: [1, 1]
     */
    send() {
        let board = this.perception;
        let size = board.length;
        let available = getEmptyHex(board);
        let nTurn = size * size - available.length;
	console.log('Custom agent playing');	
	console.log('Turn '+nTurn);
	if (nTurn < 4) { // First move
		let oneThird = Math.floor(available.length-1);
		let move = available[Math.round(Math.random() * ( available.length -1 ))];
		console.log('Random move ' + move);
		let totally_random = [Math.floor (move / board.length), move % board.length];
		return totally_random;
        } else {
		let tree = new Tree(board, this.getID());
		let move = tree.evaluate().move;
		console.log('Predicted move '+move);
       		return move;
	}
	
    }
}


class HexBoard {
	constructor(board, agentId) {
		// A matrix 
		this._board = JSON.parse(JSON.stringify(board));
		this._agentId = agentId;
	}
	get board() {
		return this._board	
	}
	set board(x) {
		this._board = x;	
	}
	get agentId() {
		return this._agentId;
	}
	set agentId(x) {
		return this._agentId;	
	}

	changePlayer() {
		if (this._agentId == "1") {
			this._agentId = "2";
		} else {
			this._agentId = "1";
		}
		
	}
	
	inRange(row, col) {
		let nRows = this._board.length;
		let nCols = this._board[0].length;

		return (row >= 0 && row < nRows) && (col >= 0 && col < nCols);		
	}

	isAvailable(row, col) {
		let self = this; let available = false;
		if(self.inRange(row, col)) {
			available = (self._board[row][col] == 0);		
		}
		return available		
	}

	markedBy(row, col, playerId) {
		let self = this; let marked = false;
		if(self.inRange(row, col)) {
			marked = (self._board[row][col] == playerId);
		}
		return marked
	}
		
	markByMe(row, col) {
		this._board[row][col] = this._agentId;
	}

	markedByMe(row, col) {
		return this.markedBy(row, col, this._agentId);
	}
	markedByOther(row, col) {		
		return !this.markedByMe(row, col) && !this.isAvailable(row, col);
	}

	allAvailable() {
		let self = this; let l = [];
		let nRows = self._board.length;
		let nCols = self._board[0].length;
		let i; let j;
		for(i = 0; i < nRows; i++) {
			for(j = 0; j < nCols; j++) {
				if(self.isAvailable(i,j)) {
					l.push([i, j]);			
				}
			}					
		}
		return l;		
	}

	notMarkedByOther() {
		let self = this; let l = [];
		let nRows = self._board.length;
		let nCols = self._board[0].length;
		let i; let j;
		for(i = 0; i < nRows; i++) {
			for(j = 0; j < nCols; j++) {
				if(self.markedByMe(i, j) || self.isAvailable(i,j)) {
					l.push([i, j]);			
				}
			}					
		}
		return l;
	}

	neightbours(row, col) {
		let self = this; let l = []; let i;
		let rows = [row-1, row-1, row, row, row+1, row+1];
		let cols = [col, col+1, col-1, col+1, col-1, col];		
		
		for (i = 0; i < rows.length; i++) {
			if(!this.markedByOther(rows[i], cols[i])) {
				l.push([rows[i], cols[i]]);			
			}
		}		
		return l;	
	}

	srepr(a) {
		let self = this;
		let row = a[0]; let col = a[1];
		let nCols = self._board[0].length;
		let num = row*nCols + col;		
		return num.toString();
	}

	arepr(s) {
		let self = this;
		let n = parseInt(s, 10);				
		let nCols = self._board[0].length;
		let row = Math.floor(n/nCols);
		let col = n % nCols;
		return [row, col];	
	}

	getAdjacencyList() {
		let self = this; 
		let nRows = self._board.length;
		let nCols = self._board[0].length;		
		let playerNodes = self.notMarkedByOther();
		let i; let j; 
		let adjacencyList = {};

		// Generate nodes for adjacency list.
		for(i = 0; i < playerNodes.length; i++) {
			let code = self.srepr(playerNodes[i]);
			adjacencyList[code] = []
		}

		// Generate edges for adjacency list.
		for(let code in adjacencyList) {
			let edges = adjacencyList[code];
			let acode = self.arepr(code);
			let row = acode[0]; let col = acode[1];
			let neightbours = self.neightbours(row, col);
			let i;
			for(i = 0; i < neightbours.length; i++) {
				let scode = self.srepr(neightbours[i]);
				let nr = neightbours[i][0];
				let nc = neightbours[i][1];				
				var score = 2;	
				if(self.markedByMe(nr, nc)) {
					score = 1;		
				}
				if(!self.markedByOther(nr, nc)) {
					edges.push([scode, score]);
				}		
			}
			adjacencyList[code] = edges;			
		}
		return adjacencyList;		
	}	
	
	getUpperLimit() {
		let i; let nCols = this._board[0].length;
		let upperLimit = [];		

		for(i = 0; i<nCols; i++) {
			upperLimit.push([0, i]);
		}
		return upperLimit;
	}

	getLowerLimit() {
		let i; let nRows = this._board.length;
		let nCols = this._board[0].length;
		let lowerLimit = [];
		for (i = 0; i<nCols; i++) {
			lowerLimit.push([nRows-1, i]);
		}
		return lowerLimit;				
	}

	getLeftLimit() {
		let i; let nRows = this._board.length;
		let leftLimit = [];
		for (i = 0; i<nRows; i++) {
			leftLimit.push([i, 0]);
		}
		return leftLimit;	
	}

	getRightLimit() {
		let i; let nRows = this._board.length;
		let nCols = this._board[0].length;
		let rightLimit = [];
		for (i = 0; i<nRows; i++) {
			rightLimit.push([i, nCols-1]);
		}
		return rightLimit;
	}

	explorePath(path) {
		let self = this; let i;
		let nPlayerBoxes = 0;		
		for (i = 0; i<path.length; i++) {
			let a = self.arepr(path[i]);
			let r = a[0]; let c = a[1];
			if(self.markedByMe(r, c)) {
				nPlayerBoxes += 1;				
			}			
		}
		return path.length - nPlayerBoxes;
	}

	filterLimit(limit) {
		let i; let newLimit = []
	
		for (i = 0; i<limit.length; i++) {
			let row = limit[i][0]; let col = limit[i][1];	
			if(this.markedByMe(row, col) || this.isAvailable(row, col)) {
				newLimit.push([row, col]);
			}		
		}
					
		return newLimit;
	}

	getShortestPath() {
		let self = this;
		let playerAL = self.getAdjacencyList();
		let playerG = new Graph(playerAL);
		let initLimit; let endLimit;
		if(this._agentId == "1") {
			initLimit = self.getLeftLimit();
			endLimit = self.getRightLimit();						
		} else if(this._agentId == "2") {			
			initLimit = self.getUpperLimit();
			endLimit = self.getLowerLimit();
		}
		initLimit = self.filterLimit(initLimit);
		endLimit = self.filterLimit(endLimit);

		let i; let j; let paths = [];
		for(i = 0; i<initLimit.length; i++) {
			let iBox = self.srepr(initLimit[i]);
			for(j = 0; j<endLimit.length; j++) {
				let jBox = self.srepr(endLimit[j]);
				let path = playerG.aStarAlgorithm(iBox, jBox);
				if (path != null) {
					paths.push(path);
				}
			}
		}
		
		if(paths.length == 0) {
			return null;		
		} else {
			let minValue = self.explorePath(paths[0]);
			let minPath = paths[i];
			let k;
			for(k = 1; k<paths.length; k++) {
				let boxesToEnd = self.explorePath(paths[k]);
				if(boxesToEnd < minValue) {
					minValue = boxesToEnd;
					minPath = paths[k];			
				}				
			}
			return minValue;
		}		
	}

	isWinner() {
		return(this.getShortestPath() == 0);
	}

	getHeuristic() {
		let alliedHexes = this.getShortestPath();
		this.changePlayer();
		let opponentHexes = this.getShortestPath();
		this.changePlayer();	
		return opponentHexes - alliedHexes;			
	}		
}


class Node {
	constructor(hexBoard, father, move) {
		this._hexBoard = hexBoard;
		this._sons = [];
		this._depth = 0;
		if(father != null) {
			this._depth = father.depth + 1;
			this._father = father;
		} else {
			this._father = father;
		}
		this._move = move;				
	}

	get move() {
		return this._move;	
	}
	set move(x) {
		this._move = x;
	}
	
	get depth() {
		return this._depth;	
	}
	set depth(x) {
		this._depth = x;
	}
	get father() {
		return this._father;
	}
	set father(x) {
		this._father = x;
	}

	get sons() {
		return this._sons;	
	}
	set sons(x) {
		this._sons = x;	
	}
	get hexBoard() {
		return this._hexBoard;
	}
	set hexBoard(x) {
		this._hexBoard = x;	
	}
	get father() {
		return this._father;	
	}
	set father(x) {
		this._father = x;
	}

	isWinner() {
		return this._hexBoard.isWinner();
	}
	haveSons() {
		return this._sons.length != 0;
	}
	isTerminal() {
		return this.isWinner || !this.haveSons();
	}
	getHeuristic() {
		if(this.isWinner()) {
			return 10;

		} else {
			return this._hexBoard.getHeuristic();	
		}	
	}

	expand(limitDepth) {
		if(this._depth == limitDepth) {
			return [];
		}
		let self = this;
		let availablePositions = this._hexBoard.allAvailable();
		let oldBoard = this._hexBoard.board;
		let oldAgentId = this._hexBoard.agentId;
		let sons = [];
		let i;
		for(i = 0; i<availablePositions.length; i++) {
			let r = availablePositions[i][0];
			let c = availablePositions[i][1];
			
			let newHexBoard = new HexBoard(oldBoard, oldAgentId);
			newHexBoard.changePlayer();
			newHexBoard.markByMe(r, c);
			let children = new Node(newHexBoard, self, [r, c]);			
			sons.push(children);	
		}
		return sons;		
	}
}

class Pile {
	constructor() {
		this._internalList = [];
	}
	isEmpty() {
		return this._internalList.length == 0;
	}
	retry() {
		let len = this._internalList.length;
		let element = this._internalList[0];
		this._internalList = this._internalList.slice(1, len);		
		return element;
	}
	addTo(l) {
		let i;
		for(i = 0; i<l.length; i++) {		
			this._internalList.push(l[i]);
		}
	}
	
}

class Tree {
	constructor(board, playerId) {
		let hexBoard = new HexBoard(board, playerId);
		this._initNode = new Node(hexBoard, null, null);
		this._bestMove = null;
		this._maxDepth = 2;
	}
	get node() {
		return this._initNode;
	}
	set node(x) {
		this._initNode = x;
	}
	get bestMove() {
		return this._bestMove;
	}
	set bestMove(x) {
		this._bestMove = x;
	}

	//moveAsS()
	generate() {
		let self = this;
		let pile = new Pile();
		let initNode = this._initNode;
		pile.addTo([initNode]);
		let limitDepth = this._maxDepth;

		let k = 0;
		console.log("Generando nodos...");
		while(!pile.isEmpty()) {
			let node = pile.retry();
			if(node.isWinner()) {
				node.sons = [];
			} else {
				node.sons = node.expand(limitDepth)
				pile.addTo(node.sons);
				k += 1;
			}
		}
		console.log("Numero de nodos generados: "+k);
	}

	minimax(node, depth, maximizingPlayer) {
		let self = this;
		let maxDepth = this._maxDepth;
		if(depth == 0 || !node.haveSons() || node.isWinner()) {
			let h = node.getHeuristic();
			return node.getHeuristic();
		}

		let i; let children = node.sons;
		let minMaxInd = 0; let value;
		if(maximizingPlayer) {
			value = -Infinity;			
			for(i = 0; i<children.length; i++) {
				let minMaxInChild = self.minimax(children[i], depth-1, false);
				if(depth == maxDepth) {					
					if(minMaxInChild > value) {
						minMaxInd = i;
					}					
				}				
				value = Math.max(value, minMaxInChild);
				
			}
		} else {
			value = Infinity;			
			for(i = 0; i<children.length; i++) {
				let minMaxInChild = self.minimax(children[i], depth-1, true);
				if(depth == maxDepth) {					
					if(minMaxInChild < value) {
						minMaxInd = i;
					}					
				}				
				value = Math.min(value, minMaxInChild);
			}

		}
		if(maxDepth == depth) {
			self.bestMove = children[minMaxInd];
		}
		return value;
	}

	evaluate() {
		this.generate()
		let node = this._initNode;
		let depth = this._maxDepth;
		console.log("Evaluando mini max... ");
		let value = this.minimax(node, depth, true);
		console.log("Min max value: "+value);
		return this.bestMove;
	}

	
}

class MyMap extends Map {
 	get(key) {
    		return super.get(key) || this.default;
  	}
  
  	constructor(defaultValue) {
    		super();
		this.default = defaultValue;
  	}
}


class Graph {
	constructor(adjacencyList) {
		this.adjacencyList = adjacencyList;
	}
	getNeighbors(v) {
		return this.adjacencyList[v];
	}
	h() {
		return 1;	
	}
	aStarAlgorithm(startNode, stopNode) {
		var self = this;
		// open_list is a list of nodes which have been visited, but who's neighbors
        	// haven't all been inspected, starts off with the start node
        	// closed_list is a list of nodes which have been visited
        	// and who's neighbors have been inspected		
		var openList = new Set();
		openList.add(startNode);
		var closedList = new Set();

		// open_list is a list of nodes which have been visited, but who's neighbors
        	// haven't all been inspected, starts off with the start node
        	// closed_list is a list of nodes which have been visited
        	// and who's neighbors have been inspected

		var g = new MyMap(Infinity);
		g.set(startNode, 0);

		// parents contains an adjacency map of all nodes
		var parents = new Map();
		parents.set(startNode, startNode);

		while(openList.size > 0) {
			var n = null;
			
			// find a node with the lowest value of f() - evaluation function	
			var values = openList.values();
			for(let v of values) {
				if(n == null) {
					n = v;
				} else if (g.get(v) + self.h() < g.get(n) + self.h()) {
					n = v;				
				}
			}

			if(n == null) {
				//console.log("Problems");
				return null;
			}

            		// if the current node is the stop_node
           		// then we begin reconstructin the path from it to the start_node
			if(n == stopNode) {
				let reconstPath = [];
				while (parents.get(n) != n) {
					reconstPath.push(n);
					n = parents.get(n);
				}
				reconstPath.push(startNode);
				let reversedPath = reconstPath.reverse();
				return reversedPath;				
			}

			// for all neighbors of the current node do
			//console.log(n);
			var edges = self.getNeighbors(n);
			for(let edge of edges) {
				// if the current node isn't in both open_list and closed_list
                		// add it to open_list and note n as it's parent
				var m = edge[0]; let weight = edge[1];
				
				if(!openList.has(m) && !closedList.has(m)) {
					openList.add(m);
					parents.set(m, n);
					g.set(m, g.get(n)+weight);			
				}
				// otherwise, check if it's quicker to first visit n, then m
                		// and if it is, update parent data and g data
                		// and if the node was in the closed_list, move it to open_list
				else {
					if(g.get(m) > g.get(n) + weight) {
						g.set(m, g.get(n) + weight);
						parents.set(m, n);
						if(closedList.has(m)) {
							closedList.delete(m);
							openList.add(m);								
						}
						
					}

				}

			}
			openList.delete(n);
			closedList.add(n);		
		}
		//console.log('Path does not exist!');
		return null;			
	}	
}

module.exports = CustomAgent;

/**
 * Return an array containing the id of the empty hex in the board
 * id = row * size + col;
 * @param {Matrix} board 
 */
function getEmptyHex(board) {
    let result = [];
    let size = board.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (board[k][j] === 0) {
                result.push(k * size + j);
            }
        }
    }
    return result;
}
