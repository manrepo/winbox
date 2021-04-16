/**
 * WinBox.js
 * Copyright 2021 Nextapps GmbH
 * Author: Thomas Wilkerling
 * Licence: Apache-2.0
 * https://github.com/nextapps-de/winbox
 */

import template from "./template.js";
import { addListener, removeListener, getByClass, setStyle, setText, preventEvent } from "./helper.js";

//const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window["MSStream"];
const stack = [];
const stack_min = [];
let index = 0;
let id_counter = 0;
let last_focus;
let prefix_request;
let prefix_exit;
let body;

/**
 * @param {string|Object|Element=} root
 * @param {string|Object=} params
 * @constructor
 * @this WinBox
 */

function WinBox(root, params){

    if(!(this instanceof WinBox)) {

        return new WinBox(root, params);
    }

    index || setup();

    if(!root || !root.nodeType){

        params = root;
        root = body;
    }

    this.dom = template();
    this.body = getByClass(this.dom, "winbox-body");
    this.init();

    let id,
        title,
        mount,
        html,
        url,
        width,
        height,
        x,
        y,
        top,
        left,
        bottom,
        right,
        onclose,
        onfocus,
        onblur,
        onmove,
        onresize,
        color,
        border,
        classname;

    if(params){

        if(typeof params === "string"){

            title = params;
        }
        else{

            id = params["id"];
            title = params["title"];
            mount = params["mount"];
            html = params["html"];
            url = params["url"];
            width = params["width"];
            height = params["height"];
            x = params["x"];
            y = params["y"];
            top = params["top"];
            left = params["left"];
            bottom = params["bottom"];
            right = params["right"];
            onclose = params["onclose"];
            onfocus = params["onfocus"];
            onblur = params["onblur"];
            onmove = params["onmove"];
            onresize = params["onresize"];
            color = params["color"];
            border = params["border"];

            if(color){

                this.setColor(color);
            }

            if(border){

                setStyle(this.body, "margin", border + "px");
            }

            if((classname = params["class"])){

                this.dom.className = "winbox " + classname;
            }
        }

        if(title){

            this.setTitle(title);
        }
    }

    let max_width = this.root_w;
    let max_height = this.root_h;

    top = top ? parse(top, max_height) : 0;
    bottom = bottom ? parse(bottom, max_height) : 0;
    left = left ? parse(left, max_width) : 0;
    right = right ? parse(right, max_width) : 0;

    max_width -= left + right;
    max_height -= top + bottom;

    width = width ? parse(width, max_width) : max_width / 2;
    height = height ? parse(height, max_height) : max_height / 2;
    id || (id = ("winbox-" + ++id_counter));

    x = x ? parse(x, max_width, width) : left;
    y = y ? parse(y, max_height, height) : top;

    this.x = x;
    this.y = y;
    //this.last = {};
    this.width = width;
    this.height = height;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;

    this.dom.id = id;
    this.id = id;
    this.border = border;
    this.class = classname;
    this.min = false;
    this.max = false;
    this.full = false;

    this.onclose = onclose;
    this.onfocus = onfocus;
    this.onblur = onblur;
    this.onmove = onmove;
    this.onresize = onresize;

    this.move().resize().focus();

    if(mount){

        this.mount(mount);
    }
    else if(html){

        this.body.innerHTML = html;
    }
    else if(url){

        this.setUrl(url);
    }

    register(this);
    root.appendChild(this.dom);
    stack.push(this);
}

WinBox["new"] = function(root, params){

    return new WinBox(root, params);
};

export default WinBox;

/**
 * @param {number|string} num
 * @param {number} base
 * @param {number=} center
 * @return number
 */

function parse(num, base, center){

    if(num === "center"){

        num = (base - center) / 2;
    }
    else if(typeof num === "string"){

        const value = "" + parseFloat(num);
        const unit = (value !== num) && num.substring(value.length);

        if(unit === "%"){

            num = base / 100 * value;
        }
        else{

            num = value;
        }
    }
    // else if(!num && (num !== 0)){
    //
    //     num = current || 0;
    // }

    return num;
}

function setup(){

    body = document.body;

    body[prefix_request = "requestFullscreen"] ||
    body[prefix_request = "msRequestFullscreen"] ||
    body[prefix_request = "webkitRequestFullscreen"] ||
    body[prefix_request = "mozRequestFullscreen"] ||
    (prefix_request = "");

    prefix_exit = prefix_request && (

        prefix_request.replace("request", "exit")
                      .replace("mozRequest", "mozCancel")
                      .replace("Request", "Exit")
    );

    addListener(window, "resize", function(){

        for(let i = 0; i < stack.length; i++){

            stack[i].init();
        }
    });
}


function register(self){

    addWindowListener(self, "winbox-title");
    addWindowListener(self, "bar-n");
    addWindowListener(self, "bar-s");
    addWindowListener(self, "bar-w");
    addWindowListener(self, "bar-e");
    addWindowListener(self, "bar-nw");
    addWindowListener(self, "bar-ne");
    addWindowListener(self, "bar-se");
    addWindowListener(self, "bar-sw");

    addListener(getByClass(self.dom, "icon-min"), "click", function(event){

        self.minimize();
        preventEvent(event);
    });

    addListener(getByClass(self.dom, "icon-max"), "click", function(event){

        self.maximize();
        preventEvent(event);
    });

    if(prefix_request){

        addListener(getByClass(self.dom, "icon-fullscreen"), "click", function(event){

            self.fullscreen();
            preventEvent(event);
        });
    }
    else{

        setStyle(getByClass(self.dom, "icon-fullscreen"), "display", "none");
    }

    addListener(getByClass(self.dom, "icon-close"), "click", function(event){

        self.close();
        self = null;

        preventEvent(event);
    });

    addListener(self.dom, "mousedown", function(event){

        self.focus();
    });
}

function remove_min_stack(self){

    stack_min.splice(stack_min.indexOf(self), 1);

    for(let i = 0; i < stack_min.length; i++){

        stack_min[i].move(self.left + i * 250, self.root_h - self.bottom - (/*self.preserve ? 0 :*/ 35), true);
    }

    self.min = false;
}

function disable_animation(self){

    setStyle(self.dom, "transition", "none");
}

function enable_animation(self){

    setStyle(self.dom, "transition", "");
}

function addWindowListener(self, dir){

    const node = getByClass(self.dom, dir);
    let x, y;

    addListener(node, "mousedown", mousedown);
    addListener(node, "touchstart", mousedown);

    function mousedown(event){

        preventEvent(event);

        if(event.touches){

            event = event.touches[0] || event;
        }

        if(!self.min && !self.max && !self.full){

            disable_animation(self);

            addListener(window, "mousemove", handler_mousemove);
            addListener(window, "mouseup", handler_mouseup);
            addListener(window, "touchmove", handler_mousemove);
            addListener(window, "touchend", handler_mouseup);

            x = event.pageX;
            y = event.pageY;

            // appearing scrollbars on the root element does not trigger "window.onresize",
            // force refresh window size via init()

            self.init().focus();
        }
    }

    function handler_mousemove(event){

        if(event.touches){

            event = event.touches[0] || event;
        }
        else{

            preventEvent(event);
        }

        const offsetX = event.pageX - x;
        const offsetY = event.pageY - y;

        let resize_w, resize_h, move_x, move_y;

        if(dir === "winbox-title"){

            self.x += offsetX;
            self.y += offsetY;
            move_x = move_y = 1;
        }
        else{

            if(dir === "bar-e" || dir === "bar-se" || dir === "bar-ne"){

                self.width += offsetX;
                resize_w = 1;
            }
            else if(dir === "bar-w" || dir === "bar-sw" || dir === "bar-nw"){

                self.x += offsetX;
                self.width -= offsetX;
                resize_w = 1;
                move_x = 1;
            }

            if(dir === "bar-s" || dir === "bar-se" || dir === "bar-sw"){

                self.height += offsetY;
                resize_h = 1;
            }
            else if(dir === "bar-n" || dir === "bar-ne" || dir === "bar-nw"){

                self.y += offsetY;
                self.height -= offsetY;
                resize_h = 1;
                move_y = 1;
            }
        }

        if(resize_w || resize_h){

            if(resize_w){

                self.width = Math.max(Math.min(self.width, self.root_w - self.x - self.right), 250);
            }

            if(resize_h){

                self.height = Math.max(Math.min(self.height, self.root_h - self.y - self.bottom - 1), 35);
            }

            self.resize();
        }

        if(move_x || move_y){

            if(move_x){

                self.x = Math.max(Math.min(self.x, self.root_w - self.width - self.right), self.left);
            }

            if(move_y){

                self.y = Math.max(Math.min(self.y, self.root_h - self.height - self.bottom - 1), self.top);
            }

            self.move();
        }

        x = event.pageX;
        y = event.pageY;
    }

    function handler_mouseup(event){

        enable_animation(self);

        removeListener(window, "mousemove", handler_mousemove);
        removeListener(window, "mouseup", handler_mouseup);
        removeListener(window, "touchmove", handler_mousemove);
        removeListener(window, "touchend", handler_mouseup);

        preventEvent(event);
    }
}

/**
 * @this WinBox
 */

WinBox.prototype.init = function(){

    if(!this.full){

        const doc = document.documentElement || body;
        //const rect = doc.getBoundingClientRect();

        this.root_w = doc.clientWidth; //rect.width || (rect.right - rect.left);
        this.root_h = doc.clientHeight; //rect.height || (rect.top - rect.bottom);

        // if(ios){
        //
        //     this.root_h = window.innerHeight * (this.root_w / window.innerWidth);
        // }
    }

    return this;
};

/**
 * @param {Element=} src
 * @this WinBox
 */

WinBox.prototype.mount = function(src){

    src._backstore || (src._backstore = src.parentNode);
    this.body.textContent = "";
    this.body.appendChild(src);

    return this;
};

/**
 * @param {Element=} dest
 * @this WinBox
 */

WinBox.prototype.unmount = function(dest){

    const node = this.body.firstChild;

    if(node){

        const root = dest || node._backstore;

        root && root.appendChild(node);
        node._backstore = dest;
    }

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.setTitle = function(title){

    setText(getByClass(this.dom, "winbox-title").firstChild, title);

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.setColor = function(color){

    setStyle(this.dom, "background", color);

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.setUrl = function(url){

    setStyle(this.body, "overflow", "hidden");
    this.body.innerHTML = '<iframe src="' + url + '"></iframe>';

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.focus = function(){

    if(last_focus !== this){

        setStyle(this.dom, "z-index", ++index);

        if(last_focus && last_focus.onblur){

            last_focus.onblur();
        }

        last_focus = this;

        this.onfocus && this.onfocus();
    }

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.minimize = function(state){

    let has_changed;

    if(!state && this.min){

        remove_min_stack(this);
        has_changed = true;
    }
    else if((state !== false) && !this.min){

        stack_min.push(this);
        this.min = has_changed = true;
    }

    if(has_changed){

        const full = this.full;

        if(full){

            cancel_fullscreen(this);
        }

        this.resize(

            (this.min ? 250 : this.width),
            (this.min ? 35: this.height),
            true

        ).move(

            (this.min ? this.left + (stack_min.length - 1) * 250 : this.x),
            (this.min ? this.root_h - this.bottom - (/*this.preserve ? 0 :*/ 35) : this.y),
            true
        );

        this.max = false;
    }

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.maximize = function(state){

    const full = this.full;

    if(full){

        cancel_fullscreen(this);

        if(this.max){

            return this;
        }
    }

    this.resize(

        (this.max ? this.width : this.root_w - this.left - this.right),
        (this.max ? this.height : this.root_h - this.top - this.bottom - 1),
        true

    ).move(

        (this.max ? this.x : this.left),
        (this.max ? this.y : this.top),
        true
    );

    if(this.min){

        remove_min_stack(this);
    }

    this.max = !this.max;

    return this;
};

/**
 * @this WinBox
 */

WinBox.prototype.fullscreen = function(state){

    if((typeof state !== "undefined") && (state === this.full)){

        return this;
    }

    if(!this.full || !cancel_fullscreen(this)){

        this.dom[prefix_request]();
        this.full = true;
    }

    if(this.min){

        this.resize().move();
        remove_min_stack(this);
    }
    // else{
    //
    //     this.onresize && this.onresize(this.width, this.height);
    // }

    return this;
};

function cancel_fullscreen(self){

    self.full = false;

    if(document["fullscreen"] ||
       document["fullscreenElement"] ||
       document["webkitFullscreenElement"] ||
       document["mozFullScreenElement"]) {

        document[prefix_exit]();
        return true;
    }
}

/**
 * @this WinBox
 */

WinBox.prototype.close = function(){

    if(this.min){

        remove_min_stack(this);
    }

    this.onclose && this.onclose();
    this.unmount();
    this.dom.parentNode.removeChild(this.dom);

    if(last_focus === this){

        last_focus = null;
    }

    stack.splice(stack.indexOf(this), 1);

    //return this;
};

/**
 * @param {number|string=} x
 * @param {number|string=} y
 * @param {boolean=} _skip_update
 * @this WinBox
 */

WinBox.prototype.move = function(x, y, _skip_update){

    if(typeof x === "undefined"){

        x = this.x;
        y = this.y;
    }
    else if(!_skip_update){

        this.x = x ? x = parse(x, this.root_w - this.left - this.right, this.width) : 0;
        this.y = y ? y = parse(y, this.root_h - this.top - this.bottom, this.height) : 0;
    }

    setStyle(this.dom, "transform", "translate(" + x + "px," + y + "px)");

    this.onmove && this.onmove(x, y);

    return this;
};

/**
 * @param {number|string=} w
 * @param {number|string=} h
 * @param {boolean=} _skip_update
 * @this WinBox
 */

WinBox.prototype.resize = function(w, h, _skip_update){

    if(typeof w === "undefined"){

        w = this.width;
        h = this.height;
    }
    else if(!_skip_update){

        this.width = w ? w = parse(w, this.root_w - this.left - this.right) : 0;
        this.height = h ? h = parse(h, this.root_h - this.top - this.bottom) : 0;
    }

    setStyle(this.dom, "width", w + "px");
    setStyle(this.dom, "height", h + "px");

    this.onresize && this.onresize(w, h);

    return this;
};