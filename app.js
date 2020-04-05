// Import the hettp library
var http = require('http');
var url = require('url')
var fs = require('fs')
var path = require('path')
var baseDirectory = __dirname // or whatever base directory you want
var models = require('./models');
var Sequelize = require("sequelize");
var sequelize = new Sequelize(null, null, null, {
    dialect: 'sqlite',
    storage: 'music.db'
})
var express = require('express');
var crypto = require('crypto');
const bcrypt = require('bcrypt');

const port = process.env.PORT || 3000;


var generateKey = function() {
    var sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');


var mu = require('mu2');
var userPasswords = {}
var userIds = {}
var userPermissions = {}
var sessionManager = {};


// Create new express server
var app = express();
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.use(cookieParser())
var server = require('http').Server(app);
var io = require('socket.io')(server);


app.get('/login', function(request, response) {
    response.sendFile(path.join(__dirname, 'login.html'))
});



app.post('/login', function(request, response) {
    var name = request.body['name'];
    var password = request.body['password'];
    console.log(name, password)
    console.log(request.body)


    models.User.findAll({
            include: [{
            model: models.Playlist
        }]
        })
        .then(function(users) {
            users.forEach(function(user) {
                userPasswords[user.username] = user.password
                userIds[user.username] = user.id
                userPermissions[user.id] = user.Playlists.map(function(playlist) {
                    return playlist.id;
                });
            

               
                // var usr = models.User.build({
                //     id: user.id,
                //     username: user.username,
                // })
                // var array = []
                // usr.getPlaylists().then(function(playlists) {

                //     playlists.forEach(function(playlist) {
                //         array.push(playlist.id)

                //     })
                //     userPermissions[user.id] = array
                // })
                
            
        }); 
            
            console.log(userPermissions, " sadasdasd")




            if (name in userPasswords) {
                bcrypt.compare(password, userPasswords[name], function(err, res) {
                    if (res) {
                        var sessionToken = generateKey()
                        models.Session.create({
                            sessionKey: sessionToken,
                            sessionUser: userIds[name],
                        })
                        sessionManager[sessionToken] = userIds[name];
                        response.statusCode = 200;
                        response.cookie('id', userIds[name])
                        response.cookie('sessionKey', sessionToken)


                        response.setHeader('Location', '/playlists');
                        response.redirect('/playlists');
                    } else {
                        // Passwords don't match
                        response.sendStatus(401);
                    }
                });


            } else {
                response.sendStatus(401);

            }
        })



});

app.use(function(request, response, next) {
    console.log(request.url)
    var sessionToken = request.cookies.sessionKey;
    var id = sessionManager[sessionToken]
    console.log(id)
    if (id !== undefined) {
        request.id = id;
        next();
    } else {
        response.redirect('/login');
    }
});

app.post('/api/playlists', function(request, response) {
    response.statusCode = 200;
    var body = ''
    var name = ''
    filePath = __dirname + "/playlists.json"
    request.on('data', function(chunk) {
        name = 'name: ' + chunk
        models.Playlist.create({

            name: JSON.parse(chunk),

        });
    });


    models.Playlist.count().then(function(c) {

        var id = 'id: ' + c
        body = "{ " + id + ' ' + name + " }"
                                    console.log(body, "asdasd")

        var counter = 0
        var nofp = 0
        models.Playlist.count().then(function(c) {
            nofp = c
        })

        models.Playlist.findAll({
                attributes: ['id', 'name'],
            })
            .then(function(playlists) {
                playlists.forEach(function(playlist) {
                    var plst = models.Playlist.build({
                        id: playlist.id,
                        name: playlist.name,
                    })
                    var array = []
                    plst.getSongs().then(function(songs) {

                        songs.forEach(function(song) {
                            array.push(song.id)
                        })
                        playlist.dataValues.songs = array



                        counter++
                        if (counter === nofp) {
                            var saved = '{ "playlists": ' + JSON.stringify(playlists) + '}'
                            fs.writeFile(filePath, saved, function(err) {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("The file was saved!");
                            });
                            response.end(body);
                        }

                    })
                })
            })
    })
})

app.post('/api/playlists/:id', function(request, response) {
    console.log(request.cookies)
    console.log(typeof(request.cookies) + " request type")
    var sessionToken = request.cookies.sessionKey;
    var id = sessionManager[sessionToken]

    console.log(request.params['id'])
    console.log(id + "id")
    models.User.findOne({
            where: {
                id: id
            }
        })
        .then(function(user) {

            if (id !== undefined && userPermissions[request.id].includes(parseInt(request.params['id']))) {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/x-www-form-urlencoded');
                var body = 'song: ';
                var songid
                filePath = __dirname + "/playlists.json"
                request.on('data', function(chunk) {
                    body += chunk;
                    body = "{" + body + "}"
                    songid = eval('(' + body + ')')

                });
                var counter = 0
                var nofp = 0
                models.Playlist.count().then(function(c) {
                    nofp = c
                })

                models.Playlist.findAll({
                        attributes: ['id', 'name'],
                    })
                    .then(function(playlists) {
                        playlists.forEach(function(playlist) {
                            var plst = models.Playlist.build({
                                id: playlist.id,
                                name: playlist.name,
                            })
                            var array = []
                            plst.getSongs().then(function(songs) {

                                songs.forEach(function(song) {
                                    array.push(song.id)
                                })
                                playlist.dataValues.songs = array

                                if (plst.id == parseInt(request.params['id'])) {
                                    plst.addSong(songid.song)
                                    if (!playlist.dataValues.songs.includes(songid.song)) {
                                        playlist.dataValues.songs.push(songid.song)
                                    }
                                }

                                counter++
                                if (counter === nofp) {
                                    var saved = '{ "playlists": ' + JSON.stringify(playlists) + '}'
                                    fs.writeFile(filePath, saved, function(err) {
                                        if (err) {
                                            return console.log(err);
                                        }
                                        console.log("The file was saved!");
                                    });
                                    response.end(body);
                                }

                            })
                        })
                    })
            } else {
                response.sendStatus(403);
            }

        })


});

app.post('/api/playlists/:id/users', function(request, response) {
    console.log(request.cookies)
    var sessionToken = request.cookies.sessionKey;
    var id = sessionManager[sessionToken]

    console.log(request.params['id'], "request para")
    console.log(id , "id")
    console.log(request.id, "request id")
    models.User.findOne({
            where: {
                id: id
            }
        })
        .then(function(user) {

            if (id !== undefined && userPermissions[request.id].includes(parseInt(request.params['id']))) {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/x-www-form-urlencoded');
                var body = 'user: ';
                var finduser
                filePath = __dirname + "/user.json"
                request.on('data', function(chunk) {
                    body += chunk;
                    body = "{" + body + "}"

                    console.log(body, "data sent")
                    finduser = eval('(' + body + ')')
                    console.log(finduser.user + typeof(finduser.user))
                    models.User.findOne({
                            where: {
                                username: finduser.user
                            }
                        })
                        .then(function(user) {

                            var usr = models.User.build({
                                id: user.id,
                                username: user.username,
                                password: user.password,

                            })

                            usr.addPlaylist(parseInt(request.params['id']))



                            response.end(body);

                        })

                });


            } else {
                response.sendStatus(403);
            }

        })


});


app.delete('/api/playlists/:id', function(request, response) {
    console.log(request.cookies)
    var sessionToken = request.cookies.sessionKey;
    var id = sessionManager[sessionToken]

    console.log(request.params['id'])
    console.log(id + "id")
    models.User.findOne({
            where: {
                id: id
            }
        })
        .then(function(user) {

            if (id !== undefined && userPermissions[request.id].includes(parseInt(request.params['id']))) {
                response.statusCode = 200;
                response.setHeader('Content-Type', 'application/x-www-form-urlencoded');
                var body = 'song: ';
                var songid
                filePath = __dirname + "/playlists.json"
                request.on('data', function(chunk) {
                    body += chunk;
                    body = "{" + body + "}"
                    songid = eval('(' + body + ')')
                    console.log(songid.song)
                });
                var counter = 0
                var nofp = 0
                models.Playlist.count().then(function(c) {
                    nofp = c
                })

                models.Playlist.findAll({
                        attributes: ['id', 'name'],
                    })
                    .then(function(playlists) {
                        playlists.forEach(function(playlist) {
                            var plst = models.Playlist.build({
                                id: playlist.id,
                                name: playlist.name,
                            })
                            var array = []
                            plst.getSongs().then(function(songs) {

                                songs.forEach(function(song) {
                                    array.push(song.id)
                                })
                                playlist.dataValues.songs = array

                                if (plst.id == parseInt(request.params['id'])) {
                                    plst.removeSong(songid.song)
                                    var index = playlist.dataValues.songs.indexOf(parseInt(songid.song));
                                    console.log("index" + index + playlist.dataValues.songs + songid.song)
                                    if (index > -1) {
                                        playlist.dataValues.songs.splice(index, 1);
                                    }
                                }

                                counter++
                                if (counter === nofp) {
                                    var saved = '{ "playlists": ' + JSON.stringify(playlists) + '}'
                                    fs.writeFile(filePath, saved, function(err) {
                                        if (err) {
                                            return console.log(err);
                                        }
                                        console.log("The file was saved!");
                                    });
                                    response.end(body);
                                }

                            })
                        })
                    })
            } else {
                response.sendStatus(403);
            }

        })


});

app.get('/api/users', function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/json; charset=UTF-8');
    models.User.findAll({
            attributes: ['id', 'username'],
        })
        .then(function(users) {
            response.end('{ "users":' + JSON.stringify(users.map(function(user) {
                return user.get({
                    plain: true
                })
            })) + ' }');
        })

})

app.get('/api/playlists', function(request, response) {

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/json; charset=UTF-8');
    var counter = 0
    var nofp = 0
    models.Playlist.count({
        where: {
            id: {
                $in: userPermissions[request.id]
            }

        }
    }).then(function(c) {
        nofp = c
    })

    models.Playlist.findAll({
            where: {
                id: {
                    $in: userPermissions[request.id]
                }

            },
            attributes: ['id', 'name'],
        })
        .then(function(playlists) {


            playlists.forEach(function(playlist) {


                var plst = models.Playlist.build({
                    id: playlist.id,
                    name: playlist.name,
                })
                var array = []
                plst.getSongs().then(function(songs) {
                    songs.forEach(function(song) {

                        array.push(song.id)
                    })

                    playlist.dataValues.songs = array
                    counter++
                    console.log(nofp + "nop")
                    if (counter === nofp) {
                        response.end('{ "playlists":' + JSON.stringify(playlists) + ' }');
                    }

                })


            })



        })
})

function getCookie(cookie, cname) {
    var name = cname + "=";
    var ca = cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

io.use(function(socket, next) {

    var sessionToken = getCookie(socket.request.headers.cookie, "sessionKey");
    var id = sessionManager[sessionToken]
    console.log(id)
    if (id !== undefined) {
        socket.request.headers.id = id;
        console.log(socket.request.headers.id + "header id")
        next();
    } else {
        next(new Error('Authentication error'));
    }
});




io.on('connection', function(socket) {
    console.log('a user connected!');



    // When a user requests songs for a playlist, send it.
    socket.on('addNewSongToPlaylist', function(data) {
        var sessionToken = getCookie(socket.request.headers.cookie, "sessionKey");
        var id = sessionManager[sessionToken]
        var playlistId = data.playlist

        models.User.findOne({
                where: {
                    id: id
                }
            })
            .then(function(user) {

                if (id !== undefined && userPermissions[socket.request.headers.id].includes(playlistId)) {

                    socket.broadcast.emit('receiveSongsForPlaylist', JSON.stringify(data));
                    socket.emit('receiveSongsForPlaylist', JSON.stringify(data));
                } else {
                    console.log("user not authorized")
                }
            })

    });
    socket.on('deleteSongFromPlaylist', function(data) {
        var sessionToken = getCookie(socket.request.headers.cookie, "sessionKey");
        var id = sessionManager[sessionToken]
        var playlistId = data.playlist

        models.User.findOne({
                where: {
                    id: id
                }
            })
            .then(function(user) {

                if (id !== undefined && userPermissions[socket.request.headers.id].includes(playlistId)) {

                    socket.broadcast.emit('removeSongsFromPlaylist', JSON.stringify(data));
                    socket.emit('removeSongsFromPlaylist', JSON.stringify(data));
                } else {
                    console.log("user not authorized")
                }
            })



    });
});
// Create a server and provide it a callback to be executed for every HTTP request
// coming into localhost:3000.
app.use(function(request, response) {
    console.log(request.url);

    if ((request.url === '/playlists' || request.url === '/search' || request.url === '/library') && request.method === 'GET') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html');
        response.setHeader('Cache-Control', 'max-age=1800');
        fs.readFile(__dirname + '/playlist.html', function(err, data) {
            response.end(data);
        });

        // } else if (request.url === '/api/playlists' && request.method === 'POST') {
        //     response.statusCode = 200;
        //     var body = '"playlists": ';
        //     filePath = __dirname + "/playlists.json"
        //     request.on('data', function(chunk) {

        //         body += chunk;
        //         body = "{" + body +"}"
        //     });
        //     request.on('end', function() {
        //         fs.writeFile(filePath, body, function(err) {
        //             if(err) {
        //                 return console.log(err);
        //             }

        //             console.log("The file was saved!");
        //         }); 
        //         response.end(body);
        //     });




        // } else if (request.url != '/api/playlists' && request.method === 'POST') {
        //     response.statusCode = 404;
        //     response.end('Page Not Found');

    } else if (request.url === '/playlist.css') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/css');
        response.setHeader('Cache-Control', 'max-age=1800');
        fs.readFile(__dirname + '/playlist.css', function(err, data) {
            response.end(data);
        });
    } else if (request.url === '/music-app.js') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        response.setHeader('Cache-Control', 'max-age=1800');
        fs.readFile(__dirname + '/music-app.js', function(err, data) {
            response.end(data);
        });
    } else if (request.url === '/api/songs' && request.method === 'GET') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/json; charset=UTF-8');
        models.Song.findAll({
                attributes: ['album', 'duration', 'title', 'id', 'artist'],
            })
            .then(function(songs) {
                response.end('{ "songs":' + JSON.stringify(songs.map(function(song) {
                    return song.get({
                        plain: true
                    })
                })) + ' }');
            })

    } else if (request.url === '/gray.png') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'image/png');
        response.setHeader('Cache-Control', 'max-age=1800');
        fs.readFile(__dirname + '/gray.png', function(err, data) {
            response.end(data);
        });
    } else if (request.url === '/' || request.url === '/playlist') {
        response.statusCode = 301;
        response.setHeader('Location', '/playlists');
        response.setHeader('Cache-Control', 'max-age=1800');
        response.end('redirecting to playlists');
    } else {
        response.setHeader('Content-Type', 'text/plain');
        response.end('Amazing playlist');
    }
});

// Start the server on port 3000

models.sequelize.sync().then(function() {
    server.listen(port, function() {
        console.log('Amazing music app server listening on port 3000!')
    })
});