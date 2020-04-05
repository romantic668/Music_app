var Sequelize = require("sequelize")


module.exports = function(sequelize, DataType) {
    var Users_Playlists = sequelize.define('Users_Playlists', {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
        user_id: {
            type: DataType.INTEGER,
            field: 'user_id'
        },
    
        playlist_id: {
            type: DataType.INTEGER,
            field: 'playlist_id'
        }
  });

    return Users_Playlists;
};
