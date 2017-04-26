/**
 * Created by jeffersonwu on 4/11/17.
 */

// Box2D Declarations
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;


// TODO: requestAnimationFrame polyfill (invokes immediately)
(function(){
    //TODO: continue here
    var last_time = 0;
    var vendors = ['ms','moz','webkit', 'o'];

    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelRequestAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var curr_time = new Date().getTime();
            var time_to_call = Math.max(0, 16 - (curr_time - last_time));

            var id = window.setTimeout(function() {
                callback(curr_time + time_to_call);
            }, time_to_call);

            last_time = curr_time + time_to_call;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());

// ==============================
// MAIN GAME OBJECT =============
// ==============================
var game = {
    // start initializing objects, preload, and start screen.
    init: function() {
        //initialize levels object
        levels.init();

        //initialize loader object
        loader.init();

        //initialize mouse listeners
        mouse.init();

        //Hide all game layers, display start screen.
        $('.game_layer').hide();
        $('#game_start_screen').show();

        //get handle for game canvas and content.
        game.canvas = document.getElementById('game_canvas');
        game.context = game.canvas.getContext('2d');
    },
    show_level_screen: function() {
        $('.game_layer').hide();
        $('#level_select_screen').show('slow');
    },

    mode: 'intro',
    // X & Y coordinates of the slingshots
    slingshot_x: 140,
    slingshot_y: 280,

    start: function() {
        $('.game_layer').hide();
        // Display the game canvas and score
        $('#game_canvas').show();
        $('#score_screen').show();

        game.mode = 'intro';
        game.offset_left = 0;
        game.ended = false;     // used to stop animation
        game.animation_frame = window.requestAnimationFrame(game.animate, game.canvas);
    },

    // ==============================
    // GAME STATES ==================
    // ==============================
    // TODO: game states
    max_speed: 3,
    min_offset: 0,
    max_offset: 300,
    offset_left: 0, // current panning offset
    score: 0,        // the game score

    //pan the screen to center on new_center
    pan_to: function(new_center) {
        if (Math.abs(new_center - game.offset_left - game.canvas.width / 4) > 0 && game.offset_left <= game.max_offset && game.offset_left >= game.min_offset) {
            var delta_x = Math.round(( new_center - game.offset_left - game.canvas.width / 4) / 2);

            if (delta_x && Math.abs(delta_x) > game.max_speed) {
                delta_x = game.max_speed * Math.abs(delta_x) / (delta_x);
            }
            game.offset_left += delta_x;
        } else {
            return true;
        }

        if (game.offset_left < game.min_offset) {
            game.offset_left = game.min_offset;
            return true;
        }
        else if (game.offset_left > game.max_offset) {
            game.offset_left = game.max_offset;
            return true;
        }

        return false;
    },

    count_heroes_and_villains: function() {
        game.heroes = [];
        game.villains = [];

        // TODO: magic loop to get all bodies in the scene.
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();

            if (entity) {
                if (entity.type == 'hero') {
                    game.heroes.push(body);
                }
                else if (entity.type == 'villain') {
                    game.villains.push(body);
                }
            }
        }
    },
    handle_panning: function() {
        //game.offset_left++; // temporary placeholder - keeps panning to the right

        if (game.mode == 'intro') {
            if (game.pan_to(700)) {
                game.mode = 'load-next-hero';
            }
        }

        if (game.mode == 'wait-for-firing') {

            if(mouse.dragging) {
                if (game.mouse_on_current_hero()) {
                    game.mode = 'firing';
                } else {
                    game.pan_to(mouse.x + game.offset_left);
                }
            } else {
                game.pan_to(game.slingshot_x);
            }
        }

        if (game.mode == 'firing') {
            if (mouse.down) {
                game.pan_to(game.slingshot_x);
                game.current_hero.SetPosition({x: (mouse.x + game.offset_left)/box2d.scale, y: mouse.y/box2d.scale});
            } else {
                game.mode = 'fired';
                var impulse_scale_factor = 0.75;
                var impulse = new b2Vec2((game.slingshot_x + 35 - mouse.x - game.offset_left) + impulse_scale_factor, (game.slingshot_y + 25 - mouse.y) * impulse_scale_factor);
                game.current_hero.ApplyImpulse(impulse, game.current_hero.GetWorldCenter());
            }
        }

        if (game.mode == 'load-next-hero') {
            //TODO: continue here
            game.count_heroes_and_villains();

            // check if any villains are alive, if not, end the level (success)
            if (game.villains.length == 0) {
                game.mode = 'level-success';
                return;
            }

            // check if any more heroes left to load, if not, end the level (failure)
            if (game.heroes.length == 0) {
                game.mode = 'level-failure';
                return;
            }

            // load the hero and set mode to wait-for-firing
            if (!game.current_hero) {
                game.current_hero = game.heroes[game.heroes.length - 1];
                game.current_hero.SetPosition({x: 180/box2d.scale, y: 200/box2d.scale });
                game.current_hero.SetLinearVelocity({x: 0, y: 0});
                game.current_hero.SetAngularVelocity(0);
                game.current_hero.SetAwake(true);
            } else {
                // wait for hero to stop bouncing and fall asleep and then switch to wait-for-firing.
                game.pan_to(game.slingshot_x);

                if (!game.current_hero.IsAwake()) {
                    game.mode = 'waiting-for-firing';
                }
            }




            game.mode = 'wait-for-firing';
        }

        if (game.mode == 'firing') {
            game.pan_to(game.slingshot_x);
        }

        if (game.mode == 'fired') {
            //TODO:
            // Pan to wherever the hero currently is
        }
    },

    /**
     * Handles animation in the game.
     */
    animate: function() {
        // animate background
        game.handle_panning();

        // TODO: animate the characters
        var current_time = new Date().getTime();
        var time_step;

        if(game.last_update_time) {
            time_step = (current_time - game.last_update_time)/1000;
            box2d.step(time_step);
        }
        game.last_update_time = current_time;


        // TODO: draw background with parallax scrolling
        game.context.drawImage(game.current_level.background_image, game.offset_left/4, 0, 640, 480, 0, 0, 640, 480);
        game.context.drawImage(game.current_level.foreground_image, game.offset_left, 0, 640, 480, 0, 0, 640, 480);

        // Draw slingshot
        game.context.drawImage(game.slingshot_image, game.slingshot_x - game.offset_left, game.slingshot_y);

        // Draw all bodies
        game.draw_all_bodies();

        // draw front of slingshot
        game.context.drawImage(game.slingshot_front_image, game.slingshot_x - game.offset_left, game.slingshot_y);


        if (!game.ended) {
            game.animation_frame = window.requestAnimationFrame(game.animate, game.canvas);
        }
    },

    draw_all_bodies: function() {
        box2d.world.DrawDebugData();

        //iterate through all bodies and draw them on the game canvas.
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();

            if(entity) {
                entities.draw(entity, body.GetPosition(), body.GetAngle());
            }
        }
    },

    mouse_on_current_hero: function() {
        if (!game.current_hero) {
            return false;
        }

        var position = game.current_hero.GetPosition();
        var distance_squared = Math.pow(position.x * box2d.scale - mouse.x -game.offset_left, 2) + Math.pow(position.y*box2d.scale - mouse.y, 2);
        var radius_squared = Math.pow(game.current_hero.GetUserData().radius, 2);

        return (distance_squared <= radius_squared);
    }
};

// ==============================
// LEVELS OBJECT ================
// ==============================
var levels = {
    // level data object
    data :  [
        {   // first level
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                {type: 'ground', name: 'dirt', x:500, y: 440, width: 1000, height: 20, isStatic: true},
                {type: 'ground', name: 'wood', x:180, y: 390, width: 40, height: 80, isStatic: true},

                {type: 'block', name: 'wood', x: 520, y: 375, angle: 90, width: 100, height: 25},
                {type: 'block', name: 'glass', x: 520, y: 275, angle: 90, width: 100, height: 25},
                {type: 'villain', name: 'burger', x: 520, y: 200, calories: 590},

                {type: 'block', name: 'wood', x: 620, y: 375, angle: 90, width: 100, height: 25},
                {type: 'block', name: 'glass', x:620, y: 275, angle: 90, width: 100, height: 25},
                {type: 'villain', name: 'fries', x: 620, y: 200, calories: 420},

                {type: 'hero', name: 'orange', x: 90, y: 410},
                {type: 'hero', name: 'apple', x: 150, y: 410}
            ]
        },
        {   // second level

            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                {type: 'ground', name: 'dirt', x: 500, y: 440, width: 1000, height: 20, isStatic: true},
                {type: 'ground', name: 'wood', x: 180, y: 390, width: 40, height: 80, isStatic: true},
                {type: 'block', name: 'wood', x: 820, y: 325, angle: 90, width: 100, height: 25},
                {type:"block", name:"wood", x:720,y:375,angle:90,width:100,height:25},
                {type:"block", name:"wood", x:620,y:375,angle:90,width:100,height:25},
                {type:"block", name:"glass", x:670,y:310,width:100,height:25},
                {type:"block", name:"glass", x:770,y:310,width:100,height:25},

                {type:"block", name:"glass", x:670,y:248,angle:90,width:100,height:25},
                {type:"block", name:"glass", x:770,y:248,angle:90,width:100,height:25},
                {type:"block", name:"wood", x:720,y:180,width:100,height:25},

                {type:"villain", name:"burger",x:715,y:160,calories:590},
                {type:"villain", name:"fries",x:670,y:400,calories:420},
                {type:"villain", name:"sodacan",x:765,y:395,calories:150},

                {type:"hero", name:"strawberry",x:40,y:420},
                {type:"hero", name:"orange",x:90,y:410},
                {type:"hero", name:"apple",x:150,y:410}
            ]
        }
    ],
    // initialize level select screen
    init: function() {

        var html = '';

        for (var i = 0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="' + (i+1) + '">';
        }

        document.getElementById('level_select_screen').innerHTML = html;

        // set button click handlers
        $('#level_select_screen input').click(function(e){
            levels.load(this.value-1);
            $('#level_select_screen').hide();
        });
    },

    //load all data and images for the specific level.
    load: function(number) {

        //initialize box2D
        box2d.init();

        // TODO: continue here.
        // declare a new current level object

        game.current_level = {
            number: number,
            hero: []
        };

        game.score = 0;

        $('#score').html('Score: ' + game.score);
        var level = levels.data[number];

        // load the background, foreground, and slingshot images (objects added on the fly to the 'game' object)
        game.current_level.background_image = loader.load_image('../images/backgrounds/' + level.background + '.png');
        game.current_level.foreground_image = loader.load_image('../images/backgrounds/' + level.foreground + '.png');
        game.slingshot_image = loader.load_image('../images/slingshot.png');
        game.slingshot_front_image = loader.load_image('../images/slingshot-front.png');

        // TODO: load all entities
        for (var i = level.entities.length - 1; i >= 0; i--) {
            var entity = level.entities[i];
            entities.create(entity);
        }

        // call game.start() once the assets have loaded.
        if(loader.loaded) {
            game.start();
        } else {
            loader.onload = game.start;
        }
    }
};

// =============================
// LOADER OBJECT ===============
// =============================
var loader = {
    loaded: true,
    loaded_count: 0,    // assets loaded so far
    total_count: 0,     // total that needs to be loaded

    init: function() {
        // check for sound support.
        var mp3_support, ogg_support;

        var audio = document.createElement('audio');

        if (audio.canPlayType) {
            //'', 'maybe', 'probably'
            mp3_support = '' != audio.canPlayType('audio/mpeg');
            ogg_support = '' != audio.canPlayType('audio/ogg; codecs="vorbis"');

        } else {
            // The audio tag is not supported
            mp3_support = false;
            ogg_support = false;
        }

        // check for ogg, then mp3, then finally set sound_file_extn to undefined
        loader.sound_file_extn = ogg_support ? ".ogg" : mp3_support ? ".mp3" : undefined;
    },

    load_image: function(url) {
        this.total_count++;
        this.loaded = false;
        $('#loading_screen').show();

        var image = new Image();
        image.src = url;
        image.onload = loader.item_loaded;
        return image;
    },

    sound_file_extn: '.ogg',

    load_sound: function(url) {
        this.total_count++;
        this.loaded = false;
        $('#loading_screen').show();

        var audio = new Audio();
        audio.src = url + loader.sound_file_extn;
        audio.addEventListener('canplaythrough', loader.item_loaded, false);
        return audio;
    },
    item_loaded: function() {
        loader.loaded_count++;
        $('#loading_message').html('Loaded ' + loader.loaded_count + ' of ' + loader.total_count);

        if (loader.loaded_count === loader.total_count) {
            // Loader has loaded completely...
            loader.loaded = true;

            // Hide the loading screen
            $('#loading_screen').hide();

            // and call the loader.onload method if it exists
            if(loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
};

// ==============================
// MOUSE OBJECT =================
// ==============================
var mouse = {
    x: 0,
    y: 0,
    down: false,
    init: function() {
        $('#game_canvas').mousemove(mouse.mouse_move_handler);
        $('#game_canvas').mousedown(mouse.mouse_down_handler);
        $('#game_canvas').mouseup(mouse.mouse_up_handler);
    },

    mouse_move_handler: function(ev) {
        var offset = $('#game_canvas').offset();    // equiv to get-bounding-client-rect

        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;

        if (mouse.down) {
            mouse.dragging = true;
        }
    },

    mouse_down_handler: function(ev) {
        mouse.down = true;
        mouse.down_x = mouse.x;
        mouse.down_y = mouse.y;
        ev.originalEvent.preventDefault();
    },

    mouse_up_handler: function(ev) {
        mouse.down = false;
        mouse.dragging = false;
    }
};

// ==============================
// ENTITIES OBJECT ==============
// ==============================
var entities = {
    definitions: {
        "glass": {
            full_health: 100,
            density: 2.4,
            friction: 0.4,
            restitution: 0.15
        },
        "wood": {
            full_health: 500,
            density: 0.7,
            friction: 0.4,
            restitution: 0.4
        },
        "dirt": {
            density: 3.0,
            friction: 1.5,
            restitution: 0.2
        },
        "burger": {
            shape: 'circle',
            full_health: 40,
            radius: 25,
            density: 1,
            friction: 0.5,
            restitution: 0.4
        },
        "sodacan": {
            shape: 'rectangle',
            full_health: 80,
            width: 40,
            height: 60,
            density: 1,
            friction: 0.5,
            restitution: 0.7
        },
        "fries": {
            shape: 'rectangle',
            full_health: 50,
            width: 40,
            height: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6
        },
        "apple": {
            shape: 'circle',
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4
        },
        "strawberry": {
            shape: 'circle',
            radius: 15,
            density: 2.0,
            friction: 0.5,
            restitution: 0.4
        }
    },

    // take entity, create a Box2D body, add it to the world.
    create: function(entity) {
        var definition = entities.definitions[entity.name];

        if(!definition) {
            console.log ('Undefined entity name ' + entity.name);
            return;
        }

        switch (entity.type) {
            case 'block':
                entity.health = definition.full_health;
                entity.full_health = definition.full_health;
                entity.shape = 'rectangle';
                entity.sprite = loader.load_image('images/entities/' + entity.name + '.png');
                box2d.create_rectangle(entity, definition);
                break;
            case 'ground':
                // no need for health. these are indestructible
                entity.shape = 'rectangle';
                // no need for sprites. these won't be drawn. background art includes the ground.
                box2d.create_rectangle(entity, definition);
                break;
            case 'hero':
            case 'villain':
                entity.health = definition.full_health;
                entity.full_health = definition.full_health;
                entity.sprite = loader.load_image('/images/entities/' + entity.name + '.png');
                entity.shape = definition.shape;

                if (definition.shape == 'circle') {
                    entity.radius = definition.radius;
                    box2d.create_circle(entity, definition);
                }
                else if (definition.shape == 'rectangle') {
                    entity.width = definition.width;
                    entity.height = definition.height;
                    box2d.create_rectangle(entity, definition);
                }
                break;
            default:
                console.log('Undefined entity type', entity.type);
                break;

        }

    },

    // take entity, its position, and its angle and draw it on the game canvas.
    draw: function(entity, position, angle) {
        // TODO: continue here
        game.context.translate(position.x * box2d.scale - game.offset_left, position.y * box2d.scale);
        game.context.rotate(angle);

        switch (entity.type) {
            case 'block':
                game.context.drawImage(entity.sprite, 0, 0, entity.sprite.width, entity.sprite.height,
                    -entity.width / 2 - 1, -entity.height / 2 - 1, entity.width + 2, entity.height + 2);
                break;
            case 'villain':
            case 'hero':
                if (entity.shape == 'circle') {
                    game.context.drawImage(entity.sprite, 0, 0, entity.sprite.width, entity.sprite.height, -entity.radius - 1, -entity.radius - 1, entity.radius * 2 + 2, entity.radius * 2 + 2);
                }

                // TODO: continue here
                else if (entity.shape == 'rectangle') {
                    game.context.drawImage(entity.sprite, 0, 0, entity.sprite.width, entity.sprite.height, -entity.width / 2 - 1, -entity.height / 2 - 1, entity.width + 2, entity.height + 2);
                }
                break;
            case 'ground':
                // do nothing... draw objects like slingshot and ground separately
                break;
        }

        // returns context to original position and rotation
        game.context.rotate(-angle);
        game.context.translate(-position.x * box2d.scale + game.offset_left, -position.y * box2d.scale);
    }

};

// ==============================
// BOX2D OBJECT =================
// ==============================
var box2d = {
    scale: 30,
    init: function() {
        // set up the Box2D world that will do most of the physics calculation
        var gravity = new b2Vec2(0, 9.8);   // declare gravity
        var allow_sleep = true;  // allow objects to go to sleep
        box2d.world = new b2World(gravity, allow_sleep);

        // setup debug-draw
        var debug_context = document.getElementById('debugcanvas').getContext('2d');
        var debug_draw = new b2DebugDraw();
        debug_draw.SetSprite(debug_context);
        debug_draw.SetDrawScale(box2d.scale);
        debug_draw.SetFillAlpha(0.3);
        debug_draw.SetLineThickness(1.0);
        debug_draw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        box2d.world.SetDebugDraw(debug_draw);
    },

    create_rectangle: function(entity, definition) {
        var body_def = new b2BodyDef;
        if (entity.isStatic) {
            body_def.type = b2Body.b2_staticBody;
        } else {
            body_def.type = b2Body.b2_dynamicBody;
        }

        body_def.position.x = entity.x / box2d.scale;
        body_def.position.y = entity.y / box2d.scale;

        if (entity.angle) {
            body_def.angle = Math.PI * entity.angle / 180;
        }

        var fixture_def = new b2FixtureDef;
        fixture_def.density = definition.density;
        fixture_def.friction = definition.friction;
        fixture_def.restitution = definition.restitution;

        fixture_def.shape = new b2PolygonShape;
        fixture_def.shape.SetAsBox(entity.width / 2 / box2d.scale, entity.height / 2 / box2d.scale);

        var body = box2d.world.CreateBody(body_def);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixture_def);
        return body;
    },

    create_circle: function(entity, definition) {
        var body_def = new b2BodyDef;

        if (entity.isStatic) {
            body_def.type = b2Body.b2_staticBody;
        } else {
            body_def.type = b2Body.b2_dynamicBody;
        }

        body_def.position.x = entity.x / box2d.scale;
        body_def.position.y = entity.y / box2d.scale;

        if (entity.angle) {
            body_def.angle = Math.PI*entity.angle / 180;
        }

        var fixture_def = new b2FixtureDef;
        fixture_def.density = definition.density;
        fixture_def.friction = definition.friction;
        fixture_def.restitution = definition.restitution;

        fixture_def.shape = new b2CircleShape(entity.radius / box2d.scale);

        var body = box2d.world.CreateBody(body_def);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixture_def);
        return body;
    },

    // capped Step() function wrapper
    step: function(time_step) {
        // velocity iterations = 8
        // position iterations = 3

        if (time_step > 2/60) {
            time_step = 2/60;
        }

        box2d.world.Step(time_step, 8, 3);
    }
};

// ==============================
// MAIN LOOP ====================
// ==============================
window.addEventListener('load', function(e) {
    game.init();
});