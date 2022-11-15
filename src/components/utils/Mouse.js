class Mouse {
    constructor(id, target, moveCallback, downCallback, upCallback, button) {
        this.id = id;
        this.target = target;
        this.button = button || 1;
        this.x=0;
        this.y=0;
        this.pressed=false;
        this.moveCallback = moveCallback;
        this.downCallback = downCallback;
        this.upCallback = upCallback;
        this.target.addEventListener('mousemove', this.onmousemove.bind(this));
        this.target.addEventListener('mousedown', this.onmousedown.bind(this));
        window.addEventListener('mouseup', this.onmouseup.bind(this));
    }
    onmousemove(e) {
        this.x = e.offsetX*2;
        this.y = e.offsetY*2;
        /*if(this.pressed) {
        console.log('mouse move', this.id, this.x, this.y);
        }*/
        this.moveCallback(this.x, this.y);
    }

    onmousedown(e) {
        if(e.buttons == this.button) {
            this.onmousemove(e);
            this.pressed=true;
            //console.log('mouse down', this.id, this.x, this.y);
            this.downCallback(this.x, this.y);
        }
    }

    //TODO: make this work with multiple buttons
    onmouseup(e) {
        //if(e.buttons == this.button) {
            this.pressed=false;
            this.upCallback(this.x, this.y);
        //}
    }
    
}

export default Mouse;