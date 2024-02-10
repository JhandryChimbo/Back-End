"use strict";

module.exports = (sequelize, DataTypes) => {
  const anime = sequelize.define(
    "anime",
    {
      titulo: { type: DataTypes.STRING(150), defaultValue: "NONE" },
      cuerpo: { type: DataTypes.TEXT, defaultValue: "NONE" },
      archivo: { type: DataTypes.STRING(150), defaultValue: "NONE" },
      tipo_archivo: {type: DataTypes.ENUM(['VIDEO', 'IMAGEN']), defaultValue : "IMAGEN"},
      tipo_anime: {type: DataTypes.ENUM(['ACCION', 'TERROR', 'ROMANCE', 'DEPORTIVO', 'COMEDIA']), defaultValue: "ACCION"},
      fecha: { type: DataTypes.DATEONLY },
      estado: { type: DataTypes.BOOLEAN, defaultValue: true },
      external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    },
    { freezeTableName: true }
  );
  anime.associate = function (models) {
    anime.belongsTo(models.persona, { foreignKey: "id_persona" });
    anime.hasMany(models.comentario, { foreignKey: "id_anime", as: "comentario" });     
  };
  return anime;
};
