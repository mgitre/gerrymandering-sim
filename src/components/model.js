import React from 'react';
//import ReactDOM from 'react-dom/client';
//import Mouse from './utils/Mouse';
import './model.css'
import DistrictManager from './utils/Districts';
import Voter from './utils/Voter';


class Model extends React.Component {
  //props: size, title, id
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.width = this.props.size*2;
    this.height = this.props.size*2;
    this.district_size = 10;
    this.grid_size = 10;
    this.cell_size = this.width/this.grid_size;
    //let grid = [[1,1,1,0,0], [1,1,1,0,0], [1,1,1,0,0], [1,1,1,0,0], [1,1,1,0,0]];
    //let grid = [[1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0],[1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0], [1,0,1,1,0,0,1,1,0,0]]
    let grid = []
    for(let i = 0; i < this.grid_size; i++) {
      grid[i] = [];
      for(let j = 0; j < this.grid_size; j++) {
        grid[i][j] = Math.floor(Math.random()*2);
      }
    }
    this.colors = {0: 'rgb(255,0,0)', 1: 'rgb(0,0,255)', 2: 'rgb(200, 0, 200)'};
    this.voters = this.getVoters(grid);
    let voter_distribution = {0: 0, 1: 0};
    for(let voter of this.voters) {
      voter_distribution[voter.party] += 1;
    }
    this.state = {
      //districts for 0, districts for 1, tied districts
      districts: {0: 0, 1: 0, 2: 0},
      voters: voter_distribution
    }
  }

  getVoters(grid) {
    let voters = [];
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === 0) {
          voters.push(new Voter(0, this.colors[0], row, col, this.cell_size));
        }
        if (grid[row][col] === 1) {
          voters.push(new Voter(1, this.colors[1], row, col, this.cell_size));
        }
      }
    }
    return voters;
  }
  
  drawBG() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '333';
    for(let i = 1; i < this.grid_size; i++) {
      ctx.beginPath();
      ctx.moveTo(i*this.cell_size, 0);
      ctx.lineTo(i*this.cell_size, this.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i*this.cell_size);
      ctx.lineTo(this.width, i*this.cell_size);
      ctx.stroke();
    }
  }

  componentDidMount() {
    const canvas = this.canvasRef.current;
    this.target = canvas;
    const ctx = canvas.getContext('2d');
    //this.mouse = new Mouse(this.props.id, canvas);
    this.districtManager = new DistrictManager(this);
    ctx.clearRect(0, 0, this.width, this.height);
    this.draw()
  }
  
  draw() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBG();
    this.voters.forEach(voter => voter.draw(ctx));
    this.districtManager.draw(ctx);
  }

  update() {
    const district_winners = this.districtManager.districts.map(district => district.getWinner());
    let winner_counts = {};
    for(let winner of district_winners) {
      winner_counts[winner] = (winner_counts[winner] || 0) + 1;
    };
    this.setState({districts: winner_counts});
    this.draw();
  }

  render() {
    return  (
      <div className="model">
        <div className="title">{this.props.title}</div>
        <canvas className="interactive" ref={this.canvasRef} width={this.width} height={this.height} style={{width: this.width/2, height: this.height/2}}/>
        <Stats data={this.state} colors={this.colors} district_count = {this.grid_size*this.grid_size/this.district_size}/>
      </div>
    )
  }
}

function Stats(props) {
  const districts = props.data.districts;
  const voters = props.data.voters;
  // find total number of voters
  let total_voters = 0;
  for(let party in voters) {
    total_voters += voters[party];
  }
  // create voter display div
  const voter_display = <div className="stat-display">
    <div className="display-title">Voters</div>
    <div className="display-bar">
    {Object.keys(voters).map(party => <div key={party} className="display-bar-party" style={{width: voters[party]/total_voters*100 + '%', backgroundColor: props.colors[party]}}>{voters[party]}</div>)}
    </div>
  </div>
  
  const district_count = props.district_count;
  // create district display div
  const district_display = <div className="stat-display">
    <div className="display-title">Districts</div>
    <div className="display-bar">
    {Object.keys(districts).map(party => <div key={party} className="display-bar-party" style={{width: districts[party]/district_count*100 + '%', backgroundColor: props.colors[party]}}>{districts[party]}</div>)}
    </div>
  </div>
  return (
    <div className="stats">
      {voter_display}
      {district_display}
    </div>
  )
}

export default Model;