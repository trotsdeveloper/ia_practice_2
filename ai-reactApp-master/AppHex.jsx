import React, { Component } from 'react';

import { observable, action, computed, decorate } from 'mobx';
import { observer } from 'mobx-react';
import { render } from 'react-dom';

import random from 'lodash/random';
import Hex, { midpointRadius, sideLength } from './modelHex/Hex';
import Board from './modelHex/Board';
import Map from './components/Map.jsx';

import passedClickThreshold from './utils/passedClickThreshold';

import problemContainer from './modelHex/problemContainer';
import HextAgent from './modelHex/HexAgent';
import CustomtAgent from './modelHex/CustomAgent';

problemContainer.addAgent("1", HextAgent, { play: true });
problemContainer.addAgent("2", CustomtAgent, { play: false });

const App = observer(class App extends Component {
    constructor(props) {
        super(props);
        let gridSize = props.gridSize;
        let viewport = props.viewport;
        let size = 7;
        let map = new Array(size);
        for (let i = 0; i < map.length; i++) {
            map[i] = new Array(size);
            for (let k = 0; k < map.length; k++) {
                map[i][k] = 0;
            }
        }

        this.state = { board: new Board({ board: map }), status: 'Player 1' };
        let that = this;

        this.iterator = problemContainer.interactiveSolve(map, {
            onFinish: (result) => {
                let board = JSON.parse(JSON.stringify(result.data.world));
                let actions = result.actions;
                that.setState({ board: new Board({ board }), status: 'Winner: ' + actions[actions.length - 1].agentID });
            },
            onTurn: (result) => {
                let board = JSON.parse(JSON.stringify(result.data.world));
                let actions = result.actions;
                that.setState({ board: new Board({ board }), status: 'Player ' + (actions[actions.length - 1].agentID == '1' ? '2' : '1') });
            }
        });
    }

    nextMove() {
        this.iterator.next();
    }

    render() {
        let appState = this.state;
        return (
            <div className="game">
                <table>
                    <tr>
                        <td></td>
                        <td style={{ 'background-color': 'TEAL', 'color': 'TEAL' }}>I</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td style={{ 'background-color': 'LIGHTCORAL', 'color': 'LIGHTCORAL' }}>__</td>
                        <td><div style={{ 'background-color': 'SILVER' }}>
                            <Map app={appState.board} /></div>
                        </td>
                        <td style={{ 'background-color': 'LIGHTCORAL', 'color': 'LIGHTCORAL' }}>__</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td style={{ 'background-color': 'TEAL', 'color': 'TEAL' }}>I</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td><div className="game-info">
                            <div><button onClick={() => this.nextMove()}>{appState.status}</button></div>
                        </div>
                        </td>
                        <td></td>
                    </tr>
                </table>
            </div >
        );
    }
});

export default App;

decorate(App, {
    viewport: observable,
    gridSize: observable,
    scale: observable,
    lastMouse: observable,
    isDragging: observable,
    didMove: observable,
    cells: observable.shallow,
    selected: observable,
    gridWidth: computed,
    gridHeight: computed,
    setSelected: action.bound,
    centerOnSelected: action.bound,
    mouseDown: action.bound,
    mouseUp: action.bound,
    mouseMove: action.bound

});
