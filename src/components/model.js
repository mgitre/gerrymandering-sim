//refactoring model.js since it's a mess

import React from "react";
import Mouse from "./utils/Mouse";
import {Voter, VoterManager} from "./utils/Voter";
import "./model.css";
import { District, DistrictManager } from "./utils/Districts";
import {BarIndicator, OneBar} from "./BarIndicator";
class Model extends React.Component {
    /* 
        props: 
        width, (int) width of canvas
        rows, (int) number of rows in grid
        cols, (int) number of columns in grid
        title, (string) title of model
        gridtype: (string) 'random', 'rows', 'checkerboard', 'defined' - type of grid to generate
        grid: (2d array) voter grid, only used if gridtype is 'defined'
        district_size: (int) number of voters per district
        districts_interactive: (bool) whether districts are interactive
        voters_interactive: (bool) whether voters are interactive
    */

    /* class variables 
        title: (string) title of model

        rows, (int) number of rows in grid
        cols, (int) number of columns in grid
        
        width, (int) width of canvas
        height, (int) height of canvas

        cell_size, (int) size of each cell in grid

        voter_radius, (int) radius of each voter
        blob_radius, (int) radius of each district blob

        voters, (2d array) array of voters in grid

        canvasRef, (ref) reference to canvas element
        canvas, (element) canvas element
        ctx, (context) context of canvas element

        district_size, (int) number of voters per district
        districts, (array) array of districts
        districts_interactive, (bool) whether districts are interactive
        voters_interactive, (bool) whether voters are interactive

    */
   /* state variables
        districts_per_party, (object) number of districts per party
        voters_per_party, (object) number of voters per party
   */
    constructor(props) {
        super(props);

        //default values for essential props
        this.rows = this.props.rows || 9;
        this.cols = this.props.cols || 9;

        //initialize size variables
        this.width = (this.props.width || 500)*2;
        this.cell_size = this.width / this.cols;
        this.height = this.cell_size * this.rows;
       
        this.voter_radius = this.cell_size / 5;
        this.blob_radius = this.cell_size / 3;

        //default values for other props
        this.title = this.props.title || "Model";
        const gridtype = this.props.gridtype || "random";
        this.district_size = this.props.district_size || 9;
        this.districts_interactive = this.props.districts_interactive || false;
        this.voters_interactive = this.props.voters_interactive || false;

        //initialize canvas ref
        this.canvasRef = React.createRef();

        //set colors and names
        this.colors = {0:"#ff0000ff", 1:"#0000ffff", 'tied': "#ad14c4ff", null: "#33333333"};
        this.names = {0:"Red", 1:"Blue", 'tied': "Tied", null: "None"};

        //initialize voters
        const voter_grid = this.generateVoterGrid(gridtype);
        this.initial_voter_grid = voter_grid;
        this.voters = [];
        for (let i = 0; i < this.rows; i++) {
            this.voters.push([]);
            for (let j = 0; j < this.cols; j++) {
                this.voters[i].push(new Voter(voter_grid[i][j], i, j, this));
            }
        }

        this.state = {
            voters_per_party: {0: 0, 1: 0},
            districts_per_party: {0: 0, 1: 0}
        }
    }

    generateVoterGrid(gridtype) {
        if (gridtype === "random") {
            //return grid of randomly ordered but even 0s and 1s
            const shuffle = (array) => {
                for(let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            };
            let grid = [];
            const total = this.rows * this.cols;
            let ones, zeros;
            //use props.random_distribution to determine distribution of voters, or default to 50/50
            if(this.props.random_distribution && this.props.random_distribution.length === 2 && this.props.random_distribution[0] + this.props.random_distribution[1] === total) {
                ones = Array(this.props.random_distribution[1]).fill(1);
                zeros = Array(this.props.random_distribution[0]).fill(0);
            } else{
                const half = Math.floor(this.rows * this.cols / 2);
                ones = Array(half).fill(1);
                zeros = Array(total-half).fill(0);
            }
            const arr = ones.concat(zeros);
            shuffle(arr);
            for (let i = 0; i < this.rows; i++) {
                let row = [];
                for (let j = 0; j < this.cols; j++) {
                    row.push(arr.pop());
                }
                grid.push(row);
            }
            return grid;

        } else if (gridtype === "rows") {
            let current = 0;
            let grid = [];
            for (let i = 0; i < this.rows; i++) {
                let row = Array(this.cols).fill(current);
                grid.push(row);
                current = (current + 1) % 2;
            }
            return grid;
        } else if (gridtype === "checkerboard") {
            let grid = [];
            for (let i = 0; i < this.rows; i++) {
                let row = [];
                for (let j = 0; j < this.cols; j++) {
                    row.push((i+j) % 2);
                }
                grid.push(row);
            }
            return grid;
        } else if (gridtype === "diagonalsplit") {
            //1s on top left, 0s on bottom right
            let grid = [];
            for (let i = 0; i < this.rows; i++) {
                let row = [];
                for (let j = 0; j < this.cols; j++) {
                    if(i+j < this.rows-1) {
                        row.push(1);
                    } else if (i+j > this.rows-1) {
                        row.push(0);
                    } else {
                        row.push((j<this.cols/2) ? 1 : 0);
                    }
                }
                grid.push(row);
            }
            return grid;
        } else if (gridtype === "defined") {
            return this.props.grid;
        }
    }

    getPresetDistricts(shape, is_static=true) {
        //shape is an array: [rows, cols]
        if(shape[0]*shape[1] !== this.district_size) {
            return null;
        }
        if(this.rows % shape[0] !== 0 || this.cols % shape[1] !== 0) {
            return null;
        }
        let districts = [];
        for(let i = 0; i < this.rows; i += shape[0]) {
            for(let j = 0; j < this.cols; j += shape[1]) {
                let voters = [];
                for(let k = 0; k < shape[0]; k++) {
                    for(let l = 0; l < shape[1]; l++) {
                        voters.push(this.voters[i+k][j+l]);
                    }
                }
                districts.push(new District(this, voters, is_static));
            }
        }
        return districts;
    }

    componentDidMount() {
        this.canvas = this.canvasRef.current;
        this.canvas.oncontextmenu = (e) => e.preventDefault();
        this.ctx = this.canvas.getContext("2d");
        this.districts = this.props.preset_district_shape ? this.getPresetDistricts(this.props.preset_district_shape) : []//this.getPresetDistricts([1,9])//[]//new District(this, [this.voters[0][0], this.voters[0][1]])];
        this.district_manager = new DistrictManager(this);
        this.voter_manager = new VoterManager(this);
        this.update();
    }

    drawBG() {
        //draw gridlines
        this.ctx.strokeStyle = "#606060ff";
        this.ctx.lineWidth = 5;
        for(let i=1; i<this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i*this.cell_size);
            this.ctx.lineTo(this.width, i*this.cell_size);
            this.ctx.stroke();
        }
        for(let i=1; i<this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i*this.cell_size, 0);
            this.ctx.lineTo(i*this.cell_size, this.height);
            this.ctx.stroke();
        }
    }
    draw() {
        //clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        //draw background
        //this.drawBG();

        //draw districts
        for (let i = 0; i < this.districts.length; i++) {
            this.districts[i].draw(this.ctx);
        }

        //draw voters
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.voters[i][j].draw(this.ctx);
            }
        }

        //draw background
        this.drawBG();
    }

    getVotersPerParty() {
        //iterate over this.voters and return an object with the number of voters per party
        let voters_per_party = {0:0, 1:0};
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                voters_per_party[this.voters[i][j].party] += 1;
            }
        }
        return voters_per_party;
    }

    getDistrictsPerParty() {
        //iterate over this.districts and return an object with the number of districts per party
        let districts_per_party = {0:0, 1:0, 'tied':0};
        for(let district of this.districts) {
            const party = district.getWinner();
            if(party === null) {
                continue;
            }
            districts_per_party[party] += 1;
        }
        return districts_per_party;
    }

    get_winner(dist) {
        //distribution: {party: number of votes}
        //pop tied out of distribution into a separate variable
        const distribution = {...dist};
        let tied = distribution['tied'];
        delete distribution['tied'];

        const max = Math.max(...Object.values(distribution));
        if(max==0) {
            return (tied===0) ? null : 'tied';
        }
        const winning_parties = Object.keys(distribution).filter(party => distribution[party] === max);
        if (winning_parties.length > 1) {
            return 'tied';
        }
        return winning_parties[0];
    }

    update() {
        console.log("updating");
        const vpp = this.getVotersPerParty();
        const dpp = this.getDistrictsPerParty();
        const district_winner = this.get_winner(dpp);
        this.setState({voters_per_party: vpp, districts_per_party: dpp, district_winner: district_winner});
        this.draw();
    }

    reset() {
        this.districts = this.props.preset_district_shape ? this.getPresetDistricts(this.props.preset_district_shape) : [];
        this.voters = [];
        for (let i = 0; i < this.rows; i++) {
            this.voters.push([]);
            for (let j = 0; j < this.cols; j++) {
                this.voters[i].push(new Voter(this.initial_voter_grid[i][j], i, j, this));
            }
        }
        this.update();
    }

    render() {
        return (
            <div className="model">
                <div className="model_header">
                    <div className="title">{this.title}</div>
                    <div className="model_reset" onClick={() => this.reset()}>Reset</div>
                </div>
                <canvas className="interactive" ref={this.canvasRef} width={this.width} height={this.height} style={{width: this.width/2, height: this.height/2}}/>
                <Stats label="Voters" data={this.state.voters_per_party} colors={this.colors}/>
                <Stats label="Districts" data={this.state.districts_per_party} colors={this.colors} total={Math.floor(this.rows*this.cols/this.district_size)} />
                <OneBar label="Winner" to_show={this.state.district_winner} colors={this.colors} names={this.names}/>
            </div>
           
        );
    }
}

function Stats(props) {
    //props: label, data, colors, total?
    let pass_to_bar = {}
    let total = 0;
    for(let party in props.data) {
        pass_to_bar[props.colors[party]] = props.data[party];
        total += props.data[party];
    }

    //get winner of districts, 2 if tied
    return (
        <BarIndicator label={props.label} total={props.total||total} values={pass_to_bar}/>
    )
}



export default Model;