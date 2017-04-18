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

    handle_panning: function() {
        //game.offset_left++; // temporary placeholder - keeps panning to the right

        if (game.mode == 'intro') {
            if (game.pan_to(700)) {
                game.mode = 'load-next-hero';
            }
        }

        if (game.mode == 'wait-for-firing') {
            if(mouse.dragging) {
                game.pan_to(mouse.x + game.offset_left);
            } else {
                game.pan_to(game.slingshot_x);
            }
        }

        if (game.mode == 'load-next-hero') {
            //TODO:
            // check if any villains are alive, if not, end the level (success)
            // check if any more heroes left to load, if not, end the level (failure)
            // load the hero and set mode to wait-for-firing
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

        // TODO: draw background with parallax scrolling
        game.context.drawImage(game.current_level.background_image, game.offset_left/4, 0, 640, 480, 0, 0, 640, 480);
        game.context.drawImage(game.current_level.foreground_image, game.offset_left, 0, 640, 480, 0, 0, 640, 480);

        // TODO: draw slingshot
        game.context.drawImage(game.slingshot_image, game.slingshot_x - game.offset_left, game.slingshot_y);
        game.context.drawImage(game.slingshot_front_image, game.slingshot_x - game.offset_left, game.slingshot_y);

        if (!game.ended) {
            game.animation_frame = window.requestAnimationFrame(game.animate, game.canvas);
        }

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

            //TODO: continue here.
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: []
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
    }
};

// ==============================
// MAIN LOOP ====================
// ==============================
window.addEventListener('load', function(e) {
    game.init();
});