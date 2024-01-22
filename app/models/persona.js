"use strict";

module.exports = (sequelize, DataTypes) => {
  const persona = sequelize.define(
    "persona",
    {
      //Primero el nombre de la clase y entre llaves sus atributos
      apellidos: { type: DataTypes.STRING(150), defaultValue: "NONE" },
      nombres: { type: DataTypes.STRING(150), defaultValue: "NONE" },
      direccion: { type: DataTypes.STRING, defaultValue: "NONE" },
      celular: { type: DataTypes.STRING(20), defaultValue: "NONE" },
      fecha_nacimiento: { type: DataTypes.DATEONLY },
      external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    },
    { freezeTableName: true }
  ); //para que la tabla tome el nombre que nosotros le damos
  persona.associate = function (models) {
    persona.hasOne(models.cuenta, { foreignKey: "id_persona", as: "cuenta" });
    persona.belongsTo(models.rol, { foreignKey: "id_rol" });
    persona.hasMany(models.anime, { foreignKey: "id_persona", as: "anime"});
    persona.hasMany(models.comentario, { foreignKey: "id_persona", as: "comentario"});
  };
  return persona;
};
