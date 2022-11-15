import Mouse from "./Mouse";

class Voter {
    constructor(party, row, col, model) {
        this.party = party;
        this.model = model;
        this.color = this.model.colors[party];
        this.row = row;
        this.col = col;
        this.x = col*this.model.cell_size + this.model.cell_size/2;
        this.y = row*this.model.cell_size + this.model.cell_size/2;

    }

    updateParty(party) {
        this.party = party;
        this.color = this.model.colors[party];
    }

    equals(other) {
        return this.row == other.row && this.col == other.col;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.model.voter_radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class VoterManager {
    constructor(model) {
        this.model = model;
        this.voters = this.model.voters;
        if(this.model.voters_interactive) {
            this.mouse = new Mouse(0, this.model.canvas, (x, y) => {}, (x, y) => this.mouseDown(x, y), (x, y) => {}, 2);
        }
    }
    mouseDown(x, y) {
        const row = Math.min(Math.max(Math.floor(y / this.model.cell_size), 0), this.model.rows-1);
        const col = Math.min(Math.max(Math.floor(x / this.model.cell_size), 0), this.model.cols-1);
        const voter = this.model.voters[row][col];
        voter.updateParty((voter.party + 1) % 2);
        this.model.update();
    }
}

export {Voter, VoterManager};