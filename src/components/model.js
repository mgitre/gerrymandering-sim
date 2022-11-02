//refactoring model.js since it's a mess

import React from "react";
import Mouse from "./utils/Mouse";
import {Voter, VoterManager} from "./utils/Voter";
import "./model.css";
import { District, DistrictManager } from "./utils/Districts";

class Model extends React.Component {
    /* 
        props: 
        width, (int) width of canvas
        rows, (int) number of rows in grid
        cols, (int) number of columns in grid
        title, (string) title of model
        gridtype: (string) 'random', 'rows', 'checkerboard' - type of grid to generate
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

        //set colors
        this.colors = {0:"#ff0000ff", 1:"#0000ffff", 2: "#ad14c4ff"};

        //initialize voters
        const voter_grid = this.generateVoterGrid(gridtype);
        this.voters = [];
        for (let i = 0; i < this.rows; i++) {
            this.voters.push([]);
            for (let j = 0; j < this.cols; j++) {
                this.voters[i].push(new Voter(voter_grid[i][j], i, j, this));
            }
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
            const half = Math.floor(this.rows * this.cols / 2);
            const ones = Array(half).fill(1);
            const zeros = Array(total-half).fill(0);
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
        }
    }

    getPresetDistricts(shape) {
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
                districts.push(new District(this, voters, true));
            }
        }
        return districts;
    }

    componentDidMount() {
        this.canvas = this.canvasRef.current;
        this.canvas.oncontextmenu = (e) => e.preventDefault();
        this.ctx = this.canvas.getContext("2d");
        this.districts = this.getPresetDistricts([1,9])//[]//new District(this, [this.voters[0][0], this.voters[0][1]])];
        this.district_manager = new DistrictManager(this);
        this.voter_manager = new VoterManager(this);
        this.draw();
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

    update() {
        console.log("updating");
        this.draw();
    }

    render() {
        return (
            <div className="model">
                <div className="title">{this.title}</div>
                <canvas className="interactive" ref={this.canvasRef} width={this.width} height={this.height} style={{width: this.width/2, height: this.height/2}}/>
            </div>
        );
    }
    
}

export default Model;