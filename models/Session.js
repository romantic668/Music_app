module.exports = function(sequelize, DataType) {
    var Session = sequelize.define('Session', {
        sessionKey: {
            type: DataType.STRING,
            field: 'sessionKey'
        },
        sessionUser: {
            type: DataType.INTEGER,
            field: 'sessionUser'
        },
    }, {
    classMethods: {
      associate: function(models) {
       
        Session.belongsTo(models.User, {foreignKey: 'sessionUser'});
        
      }
    }
  });

    return Session;
};
