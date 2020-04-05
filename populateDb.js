var fs = require('fs');
var models = require('./models');
const bcrypt = require('bcrypt');
var plst, usr


models.sequelize.sync({force: true}).then(function() {

    fs.readFile('./songs.json', function(err, data) {
        var music_data = JSON.parse(data);
        var songs = music_data['songs'];

        songs.forEach(function(song) {
            console.log(song);
            models.Song.create({
                title: song.title,
                album: song.album,
                artist: song.artist,
                duration: song.duration,
            });
        });
    });

     fs.readFile('./playlists.json', function(err, data) {
        var music_data = JSON.parse(data);
        var playlists = music_data['playlists'];

        playlists.forEach(function(playlist) {
            console.log(playlist);
            models.Playlist.create({
                
                name: playlist.name,
                
            });
            plst =  models.Playlist.build({
                id: playlist.id,
                name: playlist.name,
            })
            playlist.songs.forEach(function(song){
                console.log(song);
                plst.addSong(song)
                
            })
        });
    });

      fs.readFile('./users.json', function(err, data) {
        var music_data = JSON.parse(data);
        var users = music_data['users'];

        users.forEach(function(user) {
            console.log(user);
            bcrypt.hash(user.password, 10, function(err, hash) {
              // Store hash in database
              models.User.create({
                id: user.id,
                username: user.username,
                password: hash,
                
            });
            });
            
            usr =  models.User.build({
                id: user.id,
                username: user.username,
                password: user.password,
            })
            user.playlists.forEach(function(playlist){
                console.log(playlist);
                usr.addPlaylist(playlist)
                
            })
        });
    });

     


});
