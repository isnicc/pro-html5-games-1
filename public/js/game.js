/**
 * Created by jeffersonwu on 4/11/17.
 */

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
        game.ended = false;
        game.animation_frame = window.requestAnimationFrame(game.animate, game.canvas);
    },

    handle_panning: function() {
        game.offset_left++; // temporary placeholder - keeps panning to the right
    },

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
            entities: []
        },
        {   // second level
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
// MAIN LOOP ====================
// ==============================
window.addEventListener('load', function(e) {
    game.init();
});