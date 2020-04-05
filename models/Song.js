module.exports = function(sequelize, DataType) {
    var Song = sequelize.define('Song', {
        album: {
            type: DataType.STRING,
            field: 'album'
        },
        title: {
            type: DataType.STRING,
            field: 'title'
        },
        artist: {
            type: DataType.STRING,
            field: 'artist'
        },
        duration: {
            type: DataType.INTEGER,
            field: 'duration'
        }
    }, {
    classMethods: {
      associate: function(models) {
        // Using additional options like CASCADE etc for demonstration
        // Can also simply do Task.belongsTo(models.User);
        Song.belongsToMany(models.Playlist, {
          through: "Songs_Playlists",
          
          onDelete: "CASCADE",
          foreignKey: {
            name: "song_id",
            allowNull: false
          },
          constraints: false
        });
      }
    }
  });

    return Song;
};

