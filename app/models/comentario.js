"use strict";

module.exports = (sequelize, DataTypes) => {
  const comentario = sequelize.define(
    "comentario",
    {
      cuerpo: { type: DataTypes.TEXT, defaultValue: "NONE" },
      estado: { type: DataTypes.BOOLEAN },
      fecha: { type: DataTypes.DATE },
      longitud: {type: DataTypes.DOUBLE},
      latitud: {type: DataTypes.DOUBLE},
      external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    },
    { freezeTableName: true }
  );
  comentario.associate = function (models) { 
    comentario.belongsTo(models.anime, { foreignKey: "id_anime" });
    comentario.belongsTo(models.persona, { foreignKey: "id_persona" });
  };
  return comentario;
};
