module.exports = function(sequelize, DataType) {
    var User = sequelize.define('User', {
        username: {
            type: DataType.STRING,
            field: 'username'
        },
        password: {
            type: DataType.STRING,
            field: 'password'
        },
    }, {
    classMethods: {
      associate: function(models) {
        // Using additional options like CASCADE etc for demonstration
        // Can also simply do Task.belongsTo(models.User);
        User.belongsToMany(models.Playlist, {
          through: "Users_Playlists",
          
          onDelete: "CASCADE",
          foreignKey: {
            name: 'user_id',
            allowNull: false
          },
          constraints: false
        });
      }
    }
  });

    return User;
};
