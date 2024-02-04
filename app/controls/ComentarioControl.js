"use strict";

var formidable = require("formidable");
var fs = require("fs");
var models = require("../models");
var persona = models.persona;
var anime = models.anime;
var comentario = models.comentario;

class ComentarioControl {
  async listar(req, res) {
    var lista = await comentario.findAll({
      include: [
        {
          model: models.anime,
          as: "anime",
          attributes: ["titulo", "fecha"],
        },
        {
          model: models.persona,
          as: "persona",
          attributes: ["apellidos", "nombres"],
        },
      ],
      attributes: [
        "cuerpo",
        ["external_id", "id"],
        "estado",
        "fecha",
        "longitud",
        "latitud",
      ],
    });
    res.status(200);
    res.json({ msg: "OK", code: 200, datos: lista });
  }

  async obtener(req, res) {
    const external = req.params.external;
    var lista = await comentario.findOne({
      where: { external_id: external },
      include: [
        {
          model: models.persona,
          as: "persona",
          attributes: ["apellidos", "nombres"],
        },
      ],
      attributes: [
        "titulo",
        ["external_id", "id"],
        "cuerpo",
        "tipo_archivo",
        "tipo_anime",
        "fecha",
        "archivo",
        "estado",
      ],
    });
    if (lista === undefined || lista == null) {
      res.status(404);
      res.json({
        msg: "Error",
        tag: "Comentario no encontrado",
        code: 404,
        datos: {},
      });
    } else {
      res.status(200);
      res.json({ msg: "OK", code: 200, datos: lista });
    }
  }

  async guardar(req, res) {
    if (
      req.body.hasOwnProperty("cuerpo") &&
      req.body.hasOwnProperty("fecha") &&
      req.body.hasOwnProperty("longitud") &&
      req.body.hasOwnProperty("latitud") &&
      req.body.hasOwnProperty("persona") &&
      req.body.hasOwnProperty("anime")
    ) {
      var uuid = require("uuid");
      var perA = await persona.findOne({
        where: { external_id: req.body.persona },
        include: [{ model: models.rol, as: "rol", attributes: ["nombre"] }],
      });

      var animeA = await anime.findOne({
        where: { external_id: req.body.anime },
      });

      if (
        perA == undefined ||
        perA == null ||
        animeA == undefined ||
        animeA == null
      ) {
        res.status(401);
        res.json({
          msg: "ERROR",
          tag: "El admin o anime a buscar no existe",
          code: 401,
        });
      } else {
        var data = {
          cuerpo: req.body.cuerpo,
          external_id: uuid.v4(),
          fecha: req.body.fecha,
          longitud: req.body.longitud,
          latitud: req.body.latitud,
          id_persona: perA.id,
          id_anime: animeA.id,
          estado: true,
        };
        if (perA.rol.nombre == "admin") {
          var result = await comentario.create(data);
          if (result === null) {
            res.status(401);
            res.json({ msg: "OKdnt", tag: "no se puede crear", code: 401 });
          } else {
            res.status(200);
            res.json({ msg: "OK", code: 200 });
          }
        } else {
          res.status(400);
          res.json({
            msg: "ERROR",
            tag: "La persona no es un admin",
            code: 400,
          });
        }
      }
    } else {
      res.status(400);
      res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
    }
  }

  async modificar(req, res) {
    // Obtener el comentario a modificar
    const external = req.params.external;

    if (!external) {
      res.status(400);
      res.json({
        msg: "ERROR",
        tag: "Falta el anime a modificar, por favor ingresar su id",
        code: 400,
      });
      return;
    }

    let transaction;
    try {
      // Iniciar transacción
      transaction = await models.sequelize.transaction();

      // Buscar el anime a modificar
      let comentarioModificar = await comentario.findOne({
        where: { external_id: external },
        include: [
          {
            model: models.anime,
            as: "anime",
            attributes: ["titulo", "fecha"],
          },
          {
            model: models.persona,
            as: "persona",
            attributes: ["nombres", "apellidos"],
          },
        ],
        transaction,
      });

      // Verificar si el anime existe
      if (!comentarioModificar) {
        res.status(404);
        res.json({ msg: "ERROR", tag: "Comentario no encontrado", code: 404 });
        return;
      }

      var uuid = require("uuid");
      var perA = comentarioModificar.persona;
      var animeA = comentarioModificar.anime;

      if (!perA && !animeA) {
        res.status(401);
        res.json({
          msg: "ERROR",
          tag: "El admin o anime a buscar no existe",
          code: 401,
        });
      } else {
        // Actualizar los campos si se proporcionan en la solicitud
        if (
          req.body.hasOwnProperty("cuerpo") &&
          req.body.hasOwnProperty("fecha") &&
          req.body.hasOwnProperty("longitud") &&
          req.body.hasOwnProperty("latitud") &&
          req.body.hasOwnProperty("estado")
        ) {
          comentarioModificar.cuerpo = req.body.cuerpo;
          comentarioModificar.fecha = req.body.fecha;
          comentarioModificar.longitud = req.body.latitud;
          comentarioModificar.estado = req.body.estado;
          comentarioModificar.external_id = uuid.v4();
        } else {
          res.status(400);
          res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
          return;
        }

        // Guardar los cambios y confirmar la transacción
        await comentarioModificar.save({ transaction });
        await transaction.commit();

        res.status(200);
        res.json({ msg: "OK", code: 200 });
      }
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(500);
      res.json({ msg: "ERROR", code: 500, error_msg: error.message });
    }
  }
}

module.exports = ComentarioControl;
