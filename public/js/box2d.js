/**
 * Created by jeffersonwu on 4/16/17.
 */

// declare all the commonly used object as variables for convenience
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;


var world;
var scale = 30; //30 pixels = 1 meter in box2d world.
function init (){
    //setup the box2d world that will calculate the physics.
    var gravity = new b2Vec2(0, 9.8);   // declare gravity
    var allow_sleep = true;             // allow objects at rest to be excluded from sim
    world = new b2World(gravity, allow_sleep);

    // create floor
    create_floor();

    // create dynamic objects
    create_rectangular_body();
    create_circular_body();
    create_simple_polygon_body();

    // using 2 shapes...
    create_complex_body();

    // Join two bodies using a revolute joint
    create_revolute_joint();

    // create a body with special user data (for health, etc)
    create_special_body();

    // create contact listeners & track events
    listen_for_contact();

    // initialize debug Draw
    setup_debug_draw();

    // run animation
    animate();
}

var time_step = 1/60;
// box2d happy defaults for iterations
var velocity_iterations = 8;
var position_iterations = 3;

function animate() {
    world.Step(time_step, velocity_iterations, position_iterations);
    world.ClearForces();

    world.DrawDebugData();

    // draw custom body
    if (special_body)

    // Kill Special Body if Dead
    if (special_body && special_body.GetUserData().life <= 0) {
        world.DestroyBody(special_body);
        special_body = undefined;
        console.log('The special body was destroyed. ');
    }

    setTimeout(animate, time_step); //TODO: replace with reqAnimFrame
}

function create_floor() {
    //body def holds all the data needed to construct a rigid body
    var body_def = new b2BodyDef;
    body_def.type = b2Body.b2_staticBody;
    body_def.position.x = 640/2/scale;  // horizontal center, divided by scale
    body_def.position.y = 450/scale;    // 30px offset from bottom

    // fixture is used to attach a shape to a body for collision detection.
    // fixtureDef is the blueprint used to create a fixture.
    var fixture_def = new b2FixtureDef;
    fixture_def.density = 1.0;
    fixture_def.friction = 0.5;
    fixture_def.restitution = 0.2;  // bounce

    fixture_def.shape = new b2PolygonShape;
    fixture_def.shape.SetAsBox(320/scale, 10/scale);    // box shape, 640px wide, 20px tall.

    var body = world.CreateBody(body_def);
    var fixture = body.CreateFixture(fixture_def);
}

var context;
function setup_debug_draw() {
    context = document.getElementById('canvas').getContext('2d');
    var debug_draw = new b2DebugDraw();

    // use context to draw debug info:
    debug_draw.SetSprite(context);

    // set the scale
    debug_draw.SetDrawScale(scale);

    // fill boxes with an alpha transparency of 0.3
    debug_draw.SetFillAlpha(0.3);

    // draw line thickness of 1
    debug_draw.SetLineThickness(1.0);

    // display all shapes and joints
    debug_draw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);

    // start using debug draw in the world
    world.SetDebugDraw(debug_draw);
}

function create_rectangular_body() {
    var body_def = new b2BodyDef;
    body_def.type = b2Body.b2_dynamicBody;
    body_def.position.x = 40/scale;
    body_def.position.y = 100/scale;

    var fixture_def = new b2FixtureDef;
    fixture_def.density = 1.0;
    fixture_def.friction = 0.5;
    fixture_def.restitution = 0.3;

    fixture_def.shape = new b2PolygonShape;
    fixture_def.shape.SetAsBox(30/scale, 50/scale);

    var body = world.CreateBody(body_def);
    var fixture = body.CreateFixture(fixture_def);
}

function create_circular_body() {
    var body_def = new b2BodyDef;
    body_def.type = b2Body.b2_dynamicBody;
    body_def.position.x = 130/scale;
    body_def.position.y = 100/scale;

    var fixture_def = new b2FixtureDef;
    fixture_def.density = 1.0;
    fixture_def.friction = 0.5;
    fixture_def.restitution = 0.7;
    fixture_def.shape = new b2CircleShape(30/scale);

    var body = world.CreateBody(body_def);
    var fixture = body.CreateFixture(fixture_def);
}

function create_simple_polygon_body() {
    var body_def = new b2BodyDef;
    body_def.type = b2Body.b2_dynamicBody;
    body_def.position.x = 230/scale;
    body_def.position.y = 50/scale;

    var fixture_def = new b2FixtureDef;
    fixture_def.density = 1.0;
    fixture_def.friction = 0.5;
    fixture_def.restitution = 0.2;
    fixture_def.shape = new b2PolygonShape;

    // create an array of b2Vec2 points in CLOCKWISE direction.
    var points = [
        new b2Vec2(0,0),
        new b2Vec2(40/scale, 50/scale),
        new b2Vec2(50/scale, 100/scale),
        new b2Vec2(-50/scale, 100/scale),
        new b2Vec2(-40/scale, 50/scale)
    ];

    // use SetAsArray to define the shape using the points array
    fixture_def.shape.SetAsArray(points, points.length);

    var body = world.CreateBody(body_def);
    var fixture = body.CreateFixture(fixture_def);
}

function create_complex_body() {
    var body_def = new b2BodyDef;
    body_def.type = b2Body.b2_dynamicBody;
    body_def.position.x = 350/scale;
    body_def.position.y = 50/scale;

    var body = world.CreateBody(body_def);

    // Create first fixture and attach a circular shape to the body
    var fixture_def = new b2FixtureDef;
    fixture_def.density = 1.0;
    fixture_def.friction = 0.5;
    fixture_def.restitution = 0.7;
    fixture_def.shape = new b2CircleShape(40/scale);
    body.CreateFixture(fixture_def);

    // Create second fixture and attach a polygon shape to the body
    fixture_def.shape = new b2PolygonShape;

    var points = [
        new b2Vec2(0,0),
        new b2Vec2(40/scale, 50/scale),
        new b2Vec2(50/scale, 100/scale),
        new b2Vec2(-50/scale, 100/scale),
        new b2Vec2(-40/scale, 50/scale)
    ];

    fixture_def.shape.SetAsArray(points, points.length);
    body.CreateFixture(fixture_def);
}

function create_revolute_joint() {

    // ==================
    // define body first
    // ==================
    var body_def_1 = new b2BodyDef;
    body_def_1.type = b2Body.b2_dynamicBody;
    body_def_1.position.x = 480/scale;
    body_def_1.position.y = 50/scale;
    var body_1 = world.CreateBody(body_def_1);

    // create first fixture and attach retangular shape to the body
    var fixture_def_1 = new b2FixtureDef;
    fixture_def_1.density = 1.0;
    fixture_def_1.friction = 0.5;
    fixture_def_1.restitution = 0.5;
    fixture_def_1.shape = new b2PolygonShape;
    fixture_def_1.shape.SetAsBox(50/scale, 10/scale);

    body_1.CreateFixture(fixture_def_1);

    // ===================
    // define second body
    // ===================
    var body_def_2 = new b2BodyDef;
    body_def_2.type = b2Body.b2_dynamicBody;
    body_def_2.position.x = 470/scale;
    body_def_2.position.y = 50/scale;
    var body_2 = world.CreateBody(body_def_2);

    // create second fixture and attach a polygon shape to the body
    var fixture_def_2 = new b2FixtureDef;
    fixture_def_2 = new b2FixtureDef;
    fixture_def_2.density = 1.0;
    fixture_def_2.friction = 0.5;
    fixture_def_2.restitution = 0.5;
    fixture_def_2.shape = new b2PolygonShape;

    var points = [
        new b2Vec2(0,0),
        new b2Vec2(40/scale, 50/scale),
        new b2Vec2(50/scale, 100/scale),
        new b2Vec2(-50/scale, 100/scale),
        new b2Vec2(-40/scale, 50/scale)
    ];

    fixture_def_2.shape.SetAsArray(points, points.length);
    body_2.CreateFixture(fixture_def_2);

    // Create a joint between body1 and body2
    var joint_def = new b2RevoluteJointDef;
    var joint_center = new b2Vec2(470/scale, 50/scale);
    joint_def.Initialize(body_1, body_2, joint_center);
    world.CreateJoint(joint_def);
}

var special_body;      // important: so we can refer to it outside of function.
function create_special_body() {
    var body_def = new b2BodyDef;
    body_def.type = b2Body.b2_dynamicBody;
    body_def.position.x = 450/scale;
    body_def.position.y = 0/scale;

    special_body = world.CreateBody(body_def);
    special_body.SetUserData({name: 'special', life: 250}); //TODO: set user data

    // create a fixture to attach a circular shape to the body
    var fixture_def = new b2FixtureDef;
    fixture_def.density = 1.0;
    fixture_def.friction = 0.5;
    fixture_def.restitution = 0.5;

    fixture_def.shape = new b2CircleShape(30/scale);

    var fixture = special_body.CreateFixture(fixture_def);
}

function listen_for_contact() {
    var listener = new Box2D.Dynamics.b2ContactListener;
    // PostSolve override.
    listener.PostSolve = function(contact, impulse) {
        var body_1 = contact.GetFixtureA().GetBody();
        var body_2 = contact.GetFixtureB().GetBody();

        // if either of the bodies is the special body, reduce it's life.
        if (body_1 == special_body || body_2 == special_body) {
            var impulse_along_normal = impulse.normalImpulses[0];
            special_body.GetUserData().life -= impulse_along_normal;

            console.log('The special body was in a collision with impulse ' + impulse_along_normal + ' and its life has now become ' + special_body.GetUserData().life);
        }
    };

    world.SetContactListener(listener); // required, otherwise isn't registered.
}

// finally draw our own sprite on top of special_body.
function draw_special_body() {
    // get position and angle
    var position = special_body.GetPosition();
    var angle = special_body.GetAngle();

    // translate and rotate axis to body position and angle
    context.translate(position.x * scale, position.y * scale);  //position * global scale
    context.rotate(angle);

    // draw a filled circular face
    context.fillStyle = 'rgb(200, 150, 250);';
    context.beginPath();
    context.arc(0, 0, 30, 0, 2*Math.PI, false);
    context.fill();

    // draw two rectangular eyes
    context.fillStyle = 'rgb(255,255,255);';
    context.fillRect(-15, -15, 10, 5);
    context.fillRect(5, -15, 10, 5);

    // draw an upward or downward arc for a smile depending on life
    context.strokeStyle = 'rgb(255,255,255);';
    context.beginPath();

    if (special_body.GetUserData().life > 100) {
        context.arc(0, 0, 10, Math.PI, 2*Math.PI, true);
    } else {
        context.arc(0, 10, 10, Math.PI, 2*Math.PI, false);
    }

    context.stroke();

    // Translate and rotate axis back to original position and angle
    context.rotate(-angle);
    context.translate(-position.x * scale, -position.y * scale);
}