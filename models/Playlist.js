module.exports = function(sequelize, DataType) {
    var Playlist = sequelize.define('Playlist', {
        name: {
            type: DataType.STRING,
            field: 'name'
        }
    }, {
    classMethods: {
      associate: function(models) {
        // Using additional options like CASCADE etc for demonstration
        // Can also simply do Task.belongsTo(models.User);
        Playlist.belongsToMany(models.Song, {
          through: "Songs_Playlists",
          
          onDelete: "CASCADE",
          foreignKey: {
            name: 'playlist_id',
            allowNull: false
          },
          constraints: false
        });

        Playlist.belongsToMany(models.User, {
          through: "Users_Playlists",
          
          onDelete: "CASCADE",
          foreignKey: {
            name: 'playlist_id',
            allowNull: false
          },
          constraints: false
        });
      }
    }
  });

    return Playlist;
};

