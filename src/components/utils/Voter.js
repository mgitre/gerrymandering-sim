class Voter {
    constructor(party, color, row, col, cell_size) {
        this.party = party;
        this.color = color;
        this.row = row;
        this.col = col;
        this.x = col*cell_size + cell_size/2;
        this.y = row*cell_size + cell_size/2;
    }
    equals(other) {
        return this.row == other.row && this.col == other.col;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25, 0, 2 * Math.PI);
        ctx.fill();
    }
}

export default Voter;