var Sequelize = require("sequelize")


module.exports = function(sequelize, DataType) {
    var Songs_Playlists = sequelize.define('Songs_Playlists', {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
        playlist_id: {
            type: DataType.INTEGER,
            field: 'playlist_id'
        },
    
        song_id: {
            type: DataType.INTEGER,
            field: 'song_id'
        }
  });

    return Songs_Playlists;
};

