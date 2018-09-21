//.  app.js
var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    cfenv = require( 'cfenv' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    settings = require( './settings' ),
    app = express();
var appEnv = cfenv.getAppEnv();

app.use( multer( { dest: './tmp/' } ).single( 'data' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.static( __dirname + '/public' ) );

app.get( '/', function( req, res ){
  var template = fs.readFileSync( __dirname + '/public/index.ejs', 'utf-8' );
  res.write( ejs.render( template, {} ) );
  res.end();
});

app.post( '/compare', function( req, res ){
  var question = req.body.question;
  var answer = req.body.answer;
  var score = 0.0;

  var qs = question.split( ' ' );
  var as = answer.split( ' ' );

  //. question に使われている単語のどれだけを認識させることができたか？
  var q_count = 0;
  for( var i = 0; i < qs.length; i ++ ){
    var q = as[i];
    if( q.endsWith( '.' ) || q.endsWith( '!' ) || q.endsWith( '?' ) ){
      q = q.substring( 0, q.length - 1 );
    }
    var b = false;
    for( var j = 0; j < as.length && !b; j ++ ){
      var a = as[j];
      if( a.endsWith( '.' ) || a.endsWith( '!' ) || a.endsWith( '?' ) ){
        a = a.substring( 0, a.length - 1 );
      }
      b = ( a.toLowerCase() == q.toLowerCase() );
    }
    if( b ){
      q_count ++;
    }
  }
  score = 100.0 * q_count / qs.length;

  //. answer に使われている単語のどれだけが誤認識だったか？
  var a_count = 0;
  for( var i = 0; i < as.length; i ++ ){
    var a = as[i];
    if( a.endsWith( '.' ) || a.endsWith( '!' ) || a.endsWith( '?' ) ){
      a = a.substring( 0, a.length - 1 );
    }
    var b = false;
    for( var j = 0; j < qs.length && !b; j ++ ){
      var q = as[j];
      if( q.endsWith( '.' ) || q.endsWith( '!' ) || q.endsWith( '?' ) ){
        q = q.substring( 0, q.length - 1 );
      }
      b = ( a.toLowerCase() == q.toLowerCase() );
    }
    if( !b ){
      a_count ++;
    }
  }
  score -= score * a_count / as.length;

  console.log( 'question = ' + question + ', answer = ' + answer );
  console.log( 'q_count = ' + q_count + ', qs.length = ' + qs.length );
  console.log( 'a_count = ' + a_count + ', as.length = ' + as.length );
  console.log( ' score = ' + score );

  res.write( JSON.stringify( { status: true, score: score }, 2, null ) );
  res.end();
});

var port = appEnv.port || 3000;
app.listen( port );
console.log( "server starting on " + port + " ..." );
