import Mouse from './Mouse';

class District {
    constructor(voters, cell_size, district_size, colors) {
        this.voters = voters;
        this.colors = colors;
        this.color = 'rgba(0,0,0,0.3)';
        this.district_size = district_size;
        this.cell_size = cell_size;
    }


    getWinner() {
        const parties = this.voters.map(v => v.party);
        // return the party that appears most often, or 2 if there is a tie
        const party_counts = parties.reduce((acc, party) => {
            acc[party] = acc[party] + 1 || 1;
            return acc;
        }, {});
        const max_count = Math.max(...Object.values(party_counts));
        const winners = Object.keys(party_counts).filter(party => party_counts[party] === max_count);
        if (winners.length === 1) {
            return winners[0];
            
        } else {
            return 2;
        }
    }

    findSplit() {
        //find the two districts that would be created if a voter were removed
        let voters = this.voters;
        let visited = [];
        let queue = [];
        let district1 = [];
        let num_voters = voters.length;
        let num_visited = 0;

        //first, find the district of all voters neighboring the first one
        queue.push(voters[0]);
        while (queue.length > 0) {
            let voter = queue.shift();
            if (visited.includes(voter)) {
                continue;
            }
            visited.push(voter);
            num_visited += 1;
            district1.push(voter);
            for (let neighbor of this.getNeighbors(voter)) {
                if (!visited.includes(neighbor) && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
        //if all voters were visited, then there is no split
        if (num_visited === num_voters) {
            return null;
        }
        //otherwise, the remaining voters are in the second district
        let district2 = voters.filter(v => !district1.includes(v));
        return [district1, district2];
    }

    draw(ctx) {
        const all_coords = this.voters.map(v => [v.row, v.col]);
        this.color = this.getColor(this.voters);
        this.drawShape(ctx, all_coords, this.color); 
    }
    
    getNeighbors(voter) {
        let neighbors = [];
        let row = voter.row;
        let col = voter.col;
        let voters = this.voters;
        for (let i = 0; i < voters.length; i++) {
            let other = voters[i];
            if (other.equals(voter)) {
                continue;
            }
            if (Math.abs(other.row - row) <= 1 && Math.abs(other.col - col) <= 1) {
                neighbors.push(other);
            }
        }
        return neighbors;
    }

    //drawing functions. please forgive me. i don't know how to do this better
    addOpacity(color, opacity) {
        const [r, g, b] = color.slice(4, -1).split(',').map(c => parseInt(c));
        return `rgba(${r},${g},${b},${opacity})`;
    }

    getColor(voters) {
        //return grey if there aren't exactly 5 voters
        if (voters.length !== this.district_size) {
            return 'rgba(128,128,128,0.3)';
        } else {
            return this.addOpacity(this.colors[this.getWinner()], 0.3);
        }
    }

    getEdges(coords) {
        let shared_edges = [];
        //see if any of the coordinates neighbor one another
        for (let i = 0; i < coords.length; i++) {
            for (let j = i+1; j < coords.length; j++) {
                if (this.areNeighbors(coords[i], coords[j])) {
                    shared_edges.push([coords[i], coords[j]]);
                }
            }
        }
        return shared_edges;
    }

    drawShape(ctx, coords, color) {
        let shared_edges = this.getEdges(coords);

        let shared_corners = [];
        //see if any two edges are side-by-side to find shared corners
        for (let i = 0; i < shared_edges.length; i++) {
            for (let j = i+1; j < shared_edges.length; j++) {
                let [edge1, edge2] = [shared_edges[i], shared_edges[j]];
                //if the two edges share a cell, skip 
                if(edge1[0] == edge2[0] || edge1[0] == edge2[1] || edge1[1] == edge2[0] || edge1[1] == edge2[1]) { continue; }
                if ((this.areNeighbors(edge1[0], edge2[0]) && this.areNeighbors(edge1[1], edge2[1])) || (this.areNeighbors(edge1[0], edge2[1]) && this.areNeighbors(edge1[1], edge2[0]))) {
                    shared_corners.push([edge1[0], edge2[0], edge1[1], edge2[1]]);
                }
            }
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let coord of coords) {
            this.drawCell(ctx, coord);
            
            let neighboring_edges = shared_edges.filter(edge => edge.includes(coord));
            for (let edge of neighboring_edges) {
                this.drawEdge(ctx, edge[0], edge[1]);
            }
            let neighboring_corners = shared_corners.filter(corner => corner.includes(coord));
            for (let corner of neighboring_corners) {
                this.drawCorner(ctx, corner[0], corner[1], corner[2], corner[3]);
            }
            
        }
        ctx.fill();
    }

    drawEdge(ctx, coord1, coord2, width) {
        const [row1, col1] = coord1;
        const [row2, col2] = coord2;
        const edgeWidth = width || 80;
        //determine if the edge is horizontal or vertical
        if (row1 === row2) {
            //horizontal edge
            const leftmost = Math.min(col1, col2);
            //draw a rectangle from (col1, row1) to (col2, row1)
            ctx.rect(leftmost*this.cell_size+this.cell_size/2, row1*this.cell_size+this.cell_size/2-edgeWidth/2, this.cell_size, edgeWidth);
        } else {
            //vertical edge
            const topmost = Math.min(row1, row2);
            //draw a rectangle from (col1, row1) to (col1, row2)
            ctx.rect(col1*this.cell_size+this.cell_size/2-edgeWidth/2, topmost*this.cell_size+this.cell_size/2, edgeWidth, this.cell_size);
        }
    }
    drawCorner(ctx, coord1, coord2, coord3, coord4) {
        //draw a rectangle with the given coordinates as the corners
        const [row1, col1] = coord1;
        const [row2, col2] = coord2;
        const [row3, col3] = coord3;
        const [row4, col4] = coord4;
        const leftmost = Math.min(col1, col2, col3, col4);
        const topmost = Math.min(row1, row2, row3, row4);
        const rightmost = Math.max(col1, col2, col3, col4);
        const bottommost = Math.max(row1, row2, row3, row4);
        ctx.rect(leftmost*this.cell_size+this.cell_size/2, topmost*this.cell_size+this.cell_size/2, (rightmost-leftmost)*this.cell_size, (bottommost-topmost)*this.cell_size);
    }
    drawCell(ctx, coord, r) {
        const radius = r || 40;
        const [row, col] = coord;
        ctx.arc(col*this.cell_size+this.cell_size/2, row*this.cell_size+this.cell_size/2, radius, 0, 2.1*Math.PI);
    }
    areNeighbors(coord1, coord2) {
        const [row1, col1] = coord1;
        const [row2, col2] = coord2;
        return (row1 === row2 && Math.abs(col1 - col2) === 1) || (col1 === col2 && Math.abs(row1 - row2) === 1);
    }


    addVoter(voter) {
        this.voters.push(voter);
    }
    removeVoter(voter) {
        this.voters = this.voters.filter(v => !voter.equals(v));
    }
    contains(voter) {
        return this.voters.some(v => voter.equals(v));
    }
    equals(other) {
        return this.voters.length == other.voters.length && this.voters.every(v => other.contains(v));
    }
}

class DistrictManager {
    constructor(model) {
        this.model = model;
        this.mousetarget = model.canvasRef.current;
        this.mouse = new Mouse(model.props.id, this.mousetarget, (x, y) => this.mouseMove(x, y), (x, y) => this.mouseDown(x, y), (x, y) => this.mouseUp(x, y));
        this.districts = [];
        this.currently_drawing = new District([], this.model.cell_size, this.model.district_size, this.model.colors);
        this.currently_drawing_path = [];
        this.voters = this.model.voters;
    }

    getDistrict(row, col) {
        //see if (row, col) is in any district
        for (let i = 0; i < this.districts.length; i++) {
            const district = this.districts[i];
            if (district.contains(this.getVoter(row, col))) {
                return district;
            }
        }
    }

    getVoter(row, col) {
        return this.voters[row*this.model.grid_size + col];
    }

    mouseDown(x, y) {
        
        //find the district that contains the currently clicked cell
        
        //get row and col of the cell clicked (make sure between 0 and 4)
        const row = Math.min(Math.max(Math.floor(y / this.model.cell_size), 0), this.model.grid_size-1);
        const col = Math.min(Math.max(Math.floor(x / this.model.cell_size), 0), this.model.grid_size-1);

        const district = this.getDistrict(row, col);
        if (district) {
            //remove the district from the list of districts
            this.districts = this.districts.filter(d => d !== district);
        }
        //add the district to the currently drawing list
        this.currently_drawing.addVoter(this.voters[col+row*this.model.grid_size]);
        this.currently_drawing_path.push(row*this.model.grid_size+col);
        this.model.update();
    }
    mouseUp(x, y) {
        //see if the currently drawing district is valid
        if (this.currently_drawing.voters.length == this.model.district_size) {
            //add the district to the list of districts
            this.districts.push(this.currently_drawing);
        }
        //clear the currently drawing district
        this.currently_drawing = new District([], this.model.cell_size, this.model.district_size, this.model.colors);
        this.currently_drawing_path = [];
        this.model.update();
    }
    mouseMove(x, y) {
        if(!this.mouse.pressed) return;
        //find the cell that the mouse is currently over
        const row = Math.min(Math.max(Math.floor(y / this.model.cell_size), 0), this.model.grid_size-1);
        const col = Math.min(Math.max(Math.floor(x / this.model.cell_size), 0), this.model.grid_size-1);
        const voter = this.getVoter(row, col);

         //if the cell doesn't neighbor any other cell in the currently drawing district, skip
         if (this.currently_drawing.voters.length!= 0 && !this.currently_drawing.voters.some(v => this.currently_drawing.areNeighbors([v.row, v.col], [row, col]))) {
            return;
        }
        //handle backtracking
        //see if cell is previous in currently drawing path
        /*if (this.currently_drawing_path[this.currently_drawing_path.length-2] == row*5+col) {
            //remove the last cell from the currently drawing path
            const pos = this.currently_drawing_path.pop();
            //remove the last cell from the currently drawing district if it is not anywhere else in the path
            if(!this.currently_drawing_path.includes(pos)) {
                this.currently_drawing.removeVoter(this.voters[pos]);
            }
            //return
            return;
        }*/

        //if the district is already full, skip
        if (this.currently_drawing.voters.length == this.model.district_size) {
            return;
        }
        //if the cell overlaps an existing district, remove the district
        const district = this.getDistrict(row, col);
        if (district) {
            //remove the district from the list of districts
            this.districts = this.districts.filter(d => d !== district);
        }
        //if the cell is not in the currently drawing list, add it
        if (!this.currently_drawing.contains(voter)) {
            this.currently_drawing.addVoter(voter);
        }
        //see if cell is previous in currently drawing path
        if (this.currently_drawing_path[this.currently_drawing_path.length-1] != row*this.model.grid_size+col) {
            this.currently_drawing_path.push(row*this.model.grid_size+col);
        }
        this.model.update();
    }
    draw(ctx) {
        //draw each district
        for (let i = 0; i < this.districts.length; i++) {
            const district = this.districts[i];
            district.draw(ctx);
        }
        //draw the currently drawing district
        this.currently_drawing.draw(ctx);
    }

}

export default DistrictManager;