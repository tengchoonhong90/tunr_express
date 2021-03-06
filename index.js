console.log("starting up!!");

const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');

// Initialise postgres client
const configs = {
  user: 'tengchoonhong',
  host: '127.0.0.1',
  database: 'tunr_db',
  port: 5432,
};

const pool = new pg.Pool(configs);

pool.on('error', function (err) {
  console.log('idle client error', err.message, err.stack);
});

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();


app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(methodOverride('_method'));


// Set react-views to be the default view engine
const reactEngine = require('express-react-views').createEngine();
app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', reactEngine);

/**
 * ===================================
 * Routes
 * ===================================
 */

app.get('/', (request, response) => {
  response.redirect('home');
});

app.get('/home', (request, response) => {
  response.render('home');
});

app.get('/home/index', (request, response) => {
  let text = `SELECT * FROM artists;`;

  pool.query(text, (err, indexResult) => {
    response.render('artistsIndex', {obj:indexResult.rows})
  });
})

app.get('/home/artist/:id', (request, response) => {
  let text = `SELECT * FROM artists WHERE id = ${request.params.id};`;

  pool.query(text, (err, indexResult) => {
    response.render('artistsShow', indexResult.rows)
  });
})

app.get('/home/artistnew', (request, response) => {
  response.render('new');
});

app.post('/home/artistnew/new', (request, response) => {
  let text = `INSERT INTO artists (name, photo_url, nationality) VALUES ($1, $2, $3);`;
  const values = [request.body.name, request.body.photo_url, request.body.nationality]

  pool.query(text, values, (err, newArtist) => {
    response.send(newArtist.rows)
  });
});

app.get('/home/artistedit', (request, response) => {
  response.render('artistsEdit');
});

app.put('/home/artist/:id/update', (request, response) => {
  let text = `UPDATE artists SET name = $1 , photo_url = $2, nationlity = $3, where id = $4;`;
  const values = [request.body.name, request.body.photo_url, request.body.nationality, request.params.id]
  pool.query(text, values, (err, result) => {
    response.send(result.rows)
  });
});

app.delete('/home/artist/:id/delete', (request, response) => {
  let text = `DELETE FROM artists WHERE id = ${request.params.id};`;
  pool.query(text, (err, result) => {
    response.redirect("/home/index")
  });
});


/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
const server = app.listen(3000, () => console.log('~~~ Tuning in to the waves of port 3000 ~~~'));

let onClose = function(){
  
  console.log("closing");
  
  server.close(() => {
    
    console.log('Process terminated');
    
    pool.end( () => console.log('Shut down db connection pool'));
  })
};

process.on('SIGTERM', onClose);
process.on('SIGINT', onClose);
