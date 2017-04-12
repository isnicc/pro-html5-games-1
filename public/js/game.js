/**
 * Created by jeffersonwu on 4/11/17.
 */


// main game object
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
    }
};

// main levels object
var levels = {
    // level data
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

        // load the background, foreground, and slingshot images
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

// LOADER object
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


// MAIN LOOP
window.addEventListener('load', function(e) {
    game.init();
});