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