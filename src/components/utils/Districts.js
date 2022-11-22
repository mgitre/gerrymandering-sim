//complete rewrite of Districts.js because it was a mess

import Mouse from './Mouse';

function arrayEquals(arr1, arr2) {
    if(!arr1 || !arr2) return false;
    return arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index]);
}
function arrayIncludes(arr, subarr) {
    return arr.some((val, index) => arrayEquals(val, subarr));
}

class DistrictManager {
    constructor(model){
        this.model = model;
        if(this.model.districts_interactive) {
            this.mouse = new Mouse(0, this.model.canvas, (x, y) => this.mouseMove(x, y), (x, y) => this.mouseDown(x, y), (x, y) => this.mouseUp(x, y));
            this.currently_drawing_district = null;
            this.has_mouse_moved = false;
            this.last_mouse_pos = null;
        }
    }

    activate() {
        if(this.model.districts_interactive) this.mouse.activate();
    }

    deactivate() {
        if(this.model.districts_interactive) this.mouse.deactivate();
    }

    getVoter(row, col) {
        return this.model.voters[row][col];
    }

    getDistrict(row, col) {
        const voter = this.getVoter(row, col);
        for(let district of this.model.districts){
            if(district.voters.includes(voter)){
                return district;
            }
        }
    }

    getDistrictByVoter(voter) {
        for(let district of this.model.districts){
            if(district.voters.includes(voter)){
                return district;
            }
        }
    }

    getPos(x, y) {
        const row = Math.min(Math.max(Math.floor(y / this.model.cell_size), 0), this.model.rows-1);
        const col = Math.min(Math.max(Math.floor(x / this.model.cell_size), 0), this.model.cols-1);
        return [row, col];
    }
    //wanted mouse behavior:
    /*
    if mouse is clicked on an empty cell, create a new district containing that cell
    if mouse is clicked on a cell in a district, build off of that district
    if mouse is moved over a cell, add that cell to the current district (only if valid)
    if mouse is moved over a cell in another district, remove that cell from that district (and split that district if necessary)
    if mouse is clicked on a cell in a district and then let go without moving, remove that cell from that district (and split that district if necessary)
    */

    mouseDown(x, y) {
        console.log(x,y)
        const [row, col] = this.getPos(x, y);
        this.last_mouse_pos = [row, col];
        this.has_mouse_moved = false;
        const voter = this.getVoter(row, col);
        const district = this.getDistrict(row, col);

        //if the cell is not in a district, create a new district with that cell
        if(!district){
            this.currently_drawing_district = new District(this.model, [voter]);
            this.model.districts.push(this.currently_drawing_district);
            this.model.update();
        }
        //if the cell is in a district, build off of that district
        else{
            this.currently_drawing_district = district;
        }
    }
    mouseMove(x, y) {
        //if mouse isn't down, do nothing
        if(!this.mouse.pressed) return;
        const [row, col] = this.getPos(x, y);
        //if the mouse hasn't moved, don't do anything
        if(arrayEquals(this.last_mouse_pos, [row, col])){
            return;
        } else {
            this.has_mouse_moved = true;
            this.last_mouse_pos = [row, col];
        }
        const voter = this.getVoter(row, col);
        //if the cell is in a district, handle
        //if the district containing the cell is static, do nothing
        const district = this.getDistrict(row, col);
        if(district && district.static){
            return;
        }
        //see if cell can be added to the current district
        if(this.currently_drawing_district.canAddVoter(voter)){
            this.currently_drawing_district.addVoter(voter);
        } else {
            //if it cant be added, don't do anything
            return;
        }
        //if the cell is in a district, remove it from that district
        if(district && district !== this.currently_drawing_district){
            district.removeVoter(voter);
        }
        this.model.update();
    }
    mouseUp(x, y) {
        this.currently_drawing_district = null;
        //if mouse hasn't moved, remove the cell from the district
        if(!this.has_mouse_moved){
            const [row, col] = this.getPos(x, y);
            const voter = this.getVoter(row, col);
            const district = this.getDistrict(row, col);
            if(district && !district.static){
                district.removeVoter(voter);
            }
            this.model.update();
        }
    }
}

class District {
    constructor(model, voters, is_static = false) {
        this.model = model;
        this.voters = voters;
        this.min_pop = 1;
        this.static = is_static;
    }
    //this does not do any checking - make sure to check before calling this
    addVoter(voter) {
        this.voters.push(voter);
    }

    canAddVoter(voter) {
        //if the district is static, you can't add voters
        if(this.is_static) return false;
        //if the voter is already in the district, return false
        if(this.voters.includes(voter)){
            return false;
        }
        //if the district is full, return false
        if(this.voters.length >= this.model.district_size){
            return false;
        }
        //if the voter doesn't have any neighbors in the district, return false
        const [row, col] = [voter.row, voter.col];
        const neighbors = this.getNeighbors([row, col]);
        if(neighbors.length === 0){
            return false;
        }
        /*const district_coords = this.voters.map(voter => [voter.row, voter.col]);
        let has_neighbor = false;
        for(let coord of district_coords){
            if(this.areNeighbors(coord, [row, col])){
                has_neighbor = true;
            }
        }
        if(!has_neighbor){
            return false;
        }*/
        return true;
    }

    removeVoter(voter) {
        this.voters = this.voters.filter(v => !v.equals(voter));
        this.postRemove();
    }

    includes(voter) {
        return this.voters.some(v => v.equals(voter));
    }
    areNeighbors(coord1, coord2) {
        return Math.abs(coord1[0]-coord2[0]) + Math.abs(coord1[1]-coord2[1]) === 1
    }
    //get the coordinates of all cells neighboring a cell that are in the district
    getNeighbors(coord) {
        //return all neighbors of a coordinate that are in the district
        const [row, col] = coord;
        const neighbors = [];
        if(row > 0){
            if(this.includes(this.model.voters[row-1][col])){
                neighbors.push([row-1, col]);
            }
        }
        if(row < this.model.rows-1){
            if(this.includes(this.model.voters[row+1][col])){
                neighbors.push([row+1, col]);
            }
        }
        if(col > 0){
            if(this.includes(this.model.voters[row][col-1])){
                neighbors.push([row, col-1]);
            }
        }
        if(col < this.model.cols-1){
            if(this.includes(this.model.voters[row][col+1])){
                neighbors.push([row, col+1]);
            }
        }
        return neighbors;
    }

    getVoter(row, col) {
        return this.model.voters[row][col];
    }

    postRemove() {
        //if the district is empty, remove it
        if(this.voters.length < this.min_pop){
            this.model.districts = this.model.districts.filter(district => !district.equals(this));
        } else {
            //if the district is not empty, split it
            this.split();
        }
    }

    //split the district into two districts if it's no longer contiguous
    split() {
        //wanted behavior:
        /*
        if the district is contiguous, do nothing
        if the district is not contiguous, return 2 lists of voters, each of which is contiguous
        */
        //start with the first voter in the district and find all voters that are connected to it
        console.log("splitting");
        const voters = this.voters;
        const district_coords = voters.map(voter => [voter.row, voter.col]);
        const visited = [];
        const queue = [district_coords[0]];
        while(queue.length > 0){
            const coord = queue.shift();
            visited.push(coord);
            for(let neighbor of this.getNeighbors(coord)){
                if(!arrayIncludes(visited, neighbor) && !arrayIncludes(queue, neighbor)){
                    queue.push(neighbor);
                }
            }
        }
        console.log('splat');
        //if the number of visited voters is the same as the number of voters in the district, the district is contiguous
        if(visited.length === voters.length){
            return;
        }
        //if the district is not contiguous, split it into two districts
        const district1 = new District(this.model, visited.map(coord => this.getVoter(coord[0], coord[1])));
        const district2 = new District(this.model, voters.filter(voter => !district1.includes(voter)));
        this.model.districts.push(district1, district2);
        this.model.districts = this.model.districts.filter(district => !district.equals(this));
    }

    equals(district) {
        if(this===district) return true;
        if(this.voters.length !== district.voters.length) return false;
        for(let voter of this.voters){
            if(!district.includes(voter)) return false;
        }
        return true;
    }

    //drawing functions. kill me now
    draw() {
        const ctx = this.model.ctx;
        const coords = this.voters.map(v => [v.row, v.col]);
        this.drawShape(ctx, coords);
    }

    
    //helper functions for drawing the district shape
    coordToPos(coord) {
        return coord[1]*this.model.rows + coord[0];
    }

    posToCoord(pos) {
        return [Math.floor(pos/this.model.rows), pos%this.model.rows];
    }
    
    //gets color for district
    getColor(solid) {
        const party = this.getWinning();
        //in form #rrggbbaa
        let c = this.model.colors[party];
        //const opacity = this.voters.length === this.model.district_size ? '88' : '55';
        //c = c.slice(0, 7) + opacity;
        if(solid){
            c = c.slice(0, 7) + 'ff';
            return c
        }
        //this is for not-really-opaque colors
        const opacity = this.voters.length === this.model.district_size ? 0.5 : 0.3;
        c = this.opacityToColor(c, '#ffffffff', opacity);
        return c;
    }

    opacityToColor(color, baseColor, opacity) {
        const c = color.slice(1);
        const r = parseInt(c.slice(0, 2), 16);
        const g = parseInt(c.slice(2, 4), 16);
        const b = parseInt(c.slice(4, 6), 16);
        const bc = baseColor.slice(1);
        const br = parseInt(bc.slice(0, 2), 16);
        const bg = parseInt(bc.slice(2, 4), 16);
        const bb = parseInt(bc.slice(4, 6), 16);
        const nr = Math.floor(r*opacity + br*(1-opacity));
        const ng = Math.floor(g*opacity + bg*(1-opacity));
        const nb = Math.floor(b*opacity + bb*(1-opacity));
        return `#${nr.toString(16)}${ng.toString(16)}${nb.toString(16)}ff`;
    }
    //finds all shared edges between voters
    getEdges(coords) {
        const edges = [];
        for(let i = 0; i < coords.length; i++) {
            const coord = coords[i];
            for(let j = i+1; j < coords.length; j++) {
                const other_coord = coords[j];
                if(this.areNeighbors(coord, other_coord)) {
                    edges.push([coord, other_coord]);
                }
            }
        }
        return edges;
    }
    
    //finds all shared corners
    getCorners(edges) {
        const corners = [];
        for(let i=0; i < edges.length; i++) {
            const edge1 = edges[i];
            for(let j=i+1; j < edges.length; j++) {
                const edge2 = edges[j];
                //if the edges share a cell, continue
                if(arrayEquals(edge1[0], edge2[0]) || arrayEquals(edge1[0], edge2[1]) || arrayEquals(edge1[1], edge2[0]) || arrayEquals(edge1[1], edge2[1])) {
                    continue;
                }
                //if the two edges are side by side (order independent), they share a corner
                if((this.areNeighbors(edge1[0], edge2[0]) && this.areNeighbors(edge1[1], edge2[1])) || (this.areNeighbors(edge1[0], edge2[1]) && this.areNeighbors(edge1[1], edge2[0]))) {
                    corners.push([edge1[0], edge1[1], edge2[0], edge2[1]]);
                }
            }
        }
        return corners;
    }

    drawCell(ctx, coord) {
        const cell_size = this.model.cell_size;
        const x = coord[1]*cell_size + cell_size/2;
        const y = coord[0]*cell_size + cell_size/2;
        //ctx.beginPath();
        ctx.arc(x, y, this.model.blob_radius, 0, 2 * Math.PI);
        //ctx.fill();
    }

    drawEdge(ctx, edge) {
        const [coord1, coord2] = edge;
        const [row1, col1] = coord1;
        const [row2, col2] = coord2;
        const edgeWidth = this.model.blob_radius * 2;
        //determine if the edge is horizontal or vertical
        if (row1 === row2) {
            //horizontal edge
            const leftmost = Math.min(col1, col2);
            //draw a rectangle from (col1, row1) to (col2, row1)
            ctx.rect(leftmost*this.model.cell_size+this.model.cell_size/2, row1*this.model.cell_size+this.model.cell_size/2-edgeWidth/2, this.model.cell_size, edgeWidth);
        } else {
            //vertical edge
            const topmost = Math.min(row1, row2);
            //draw a rectangle from (col1, row1) to (col1, row2)
            ctx.rect(col1*this.model.cell_size+this.model.cell_size/2-edgeWidth/2, topmost*this.model.cell_size+this.model.cell_size/2, edgeWidth, this.model.cell_size);
        }
    }

    drawCorner(ctx, corner) {
        const [coord1, coord2, coord3, coord4] = corner;
        const [row1, col1] = coord1;
        const [row2, col2] = coord2;
        const [row3, col3] = coord3;
        const [row4, col4] = coord4;
        const leftmost = Math.min(col1, col2, col3, col4);
        const topmost = Math.min(row1, row2, row3, row4);
        const rightmost = Math.max(col1, col2, col3, col4);
        const bottommost = Math.max(row1, row2, row3, row4);
        ctx.rect(leftmost*this.model.cell_size+this.model.cell_size/2, topmost*this.model.cell_size+this.model.cell_size/2, (rightmost-leftmost)*this.model.cell_size, (bottommost-topmost)*this.model.cell_size);
    }

    drawShape(ctx, coords) {
        this.outlineShape(ctx, coords);
        ctx.fillStyle = this.getColor();
        ctx.beginPath();
        //find all edges between points
        const edges = this.getEdges(coords);
        //find all corners shared by 4 cells
        const corners = this.getCorners(edges);
        //const cornersPos = corners.map(corner => corner.map(coord => this.coordToPos(coord)));
        //iterate over the voters, and draw (and pop) the edges and corners as we go
        for(let coord of coords) {
            this.drawCell(ctx, coord);
            //draw all edges that contain this cell
            for(let edge of edges) {
                if(arrayIncludes(edge, coord)) {
                    this.drawEdge(ctx, edge);
                    //edges.splice(edges.indexOf(edge), 1);
                }
            }
            //draw all corners that contain this cell
            for(let corner of corners) {
                if(arrayIncludes(corner, coord)) {
                    this.drawCorner(ctx, corner);
                    //corners.splice(corners.indexOf(corner), 1);
                }
            }
        }
        ctx.fill()
    }
    outlineShape(ctx, coords) {
        ctx.strokeStyle = this.voters.length == this.model.district_size ? this.getColor(true) : '#ffaa00ff';
        ctx.lineWidth = this.voters.length == this.model.district_size ? 6 : 12;
        
        //find all edges between points
        const edges = this.getEdges(coords);
        //iterate over the voters, and draw (and pop) the edges
        for(let coord of coords) {
            ctx.beginPath();
            this.drawCell(ctx, coord);
            ctx.stroke();
            //draw all edges that contain this cell
            for(let edge of edges) {
                if(arrayIncludes(edge, coord)) {
                    ctx.beginPath();
                    this.drawEdge(ctx, edge);
                    ctx.stroke();
                }
            }
        }
        ctx.stroke()
    }

    getWinning() {
        const voters_per_party = {};
        for (let voter of this.voters) {
            if (voters_per_party[voter.party] === undefined) {
                voters_per_party[voter.party] = 0;
            }
            voters_per_party[voter.party]++;
        }
        //find the party with the most voters, return 2 if there is a tie
        const max = Math.max(...Object.values(voters_per_party));
        const winning_parties = Object.keys(voters_per_party).filter(party => voters_per_party[party] === max);
        if (winning_parties.length > 1) {
            return 'tied';
        }
        return winning_parties[0];
    }

    //return winner for the district for statistics 
    getWinner() {
        if(this.voters.length != this.model.district_size) return null;
        //find the party with the most voters, return 2 if there is a tie
        return this.getWinning();
    }
    
}  

export {DistrictManager, District};