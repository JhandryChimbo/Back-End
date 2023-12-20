"use strict";

var formidable = require("formidable");
var fs = require("fs");
var models = require("../models");
var persona = models.persona;
var anime = models.anime;
var extensionesImagen = ["jpg", "png"];
var extensionesVideo = ["mp4"];
var maxTamanio = 2 * 1024 * 1024;

class AnimeControl {
  async listar(req, res) {
    var lista = await anime.findAll({
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
    res.status(200);
    res.json({ msg: "OK", code: 200, datos: lista });
  }

  async obtener(req, res) {
    const external = req.params.external;
    var lista = await anime.findOne({
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
      res.status(200);
      res.json({ msg: "OK", code: 200, datos: {} });
    } else {
      res.status(200);
      res.json({ msg: "OK", code: 200, datos: lista });
    }
    res.status(200);
    res.json({ msg: "OK", code: 200, datos: lista });
  }

  async guardar(req, res) {
    if (
      req.body.hasOwnProperty("titulo") &&
      req.body.hasOwnProperty("cuerpo") &&
      req.body.hasOwnProperty("tipo_anime") &&
      req.body.hasOwnProperty("fecha") &&
      req.body.hasOwnProperty("persona")
    ) {
      var uuid = require("uuid");
      var perA = await persona.findOne({
        where: { external_id: req.body.persona },
        include: [{ model: models.rol, as: "rol", attributes: ["nombre"] }],
      });

      //TODO VALIDAR EL TAMANIO, TIPO DE DATO, ETC
      if (perA == undefined || perA == null) {
        res.status(401);
        res.json({
          msg: "ERROR",
          tag: "El editor a buscar no existe",
          code: 401,
        });
      } else {
        var data = {
          cuerpo: req.body.cuerpo,
          external_id: uuid.v4(),
          titulo: req.body.titulo,
          fecha: req.body.fecha,
          tipo_anime: req.body.tipo_anime,
          id_persona: perA.id,
          estado: false,
          archivo: "anime.png",
        };
        if (perA.rol.nombre == "editor") {
          var result = await anime.create(data);
          if (result === null) {
            res.status(401);
            res.json({ msg: "OKdnt", tag: "no se puede crear", code: 401 });
          } else {
            perA.external_id = uuid.v4();
            await perA.save();
            res.status(200);
            res.json({ msg: "OK", code: 200 });
          }
        } else {
          res.status(400);
          res.json({
            msg: "ERROR",
            tag: "La persona no es un editor",
            code: 400,
          });
        }
      }
    } else {
      res.status(400);
      res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
    }
  }

  //GUARDAR FOTO
  async guardarFoto(req, res) {
    const external = req.params.externalA;

    if (!external) {
      res.status(400);
      res.json({
        msg: "ERROR",
        tag: "Falta el anime a modificar, por favor ingresar su id",
        code: 400,
      });
    }

    var form = new formidable.IncomingForm(),
      files = [];
    form
      .on("file", function (field, file) {
        //Siempre enviar este dato como file en el formulario, si es archivo, acá también será archivo inputFile
        files.push(file);
      })
      .on("end", function () {
        console.log("OK");
      });

    form.parse(req, async function (err, fields) {
      let listado = files;
      let externalAnimeName = fields.external[0];

      let animeModificar = await anime.findOne({
        where: { external_id: external },
      });

      // Verificar si el anime existe
      if (!animeModificar) {
        res.status(404);
        res.json({ msg: "ERROR", tag: "Anime no encontrado", code: 404 });
        return;
      }

      for (let index = 0; index < listado.length; index++) {
        var file = listado[index];
        //validación del tamaño y tipo de archivo
        var extension = file.originalFilename.split(".").pop().toLowerCase(); //Sacar el nombre original del archivo (archivo.png), separa en puntos y los pone en pilas. Saca la primera posición que sería el formato del archivo
        //console.log(file);

        //validar tamanio
        if (file.size > maxTamanio) {
          res.status(400);
          return res.json({
            msg: "ERROR",
            tag: "El archivo debe ser de 2mb",
            code: 400,
          });
        }

        let extensionesAceptadas = [];
        if (esImagen(extension)) {
          extensionesAceptadas = extensionesImagen;
        } else if (esVideo(extension)) {
          extensionesAceptadas = extensionesVideo;
        } else {
          res.status(400);
          return res.json({
            msg: "ERROR",
            tag: "Tipo de archivo no soportado",
            code: 400,
          });
        }

        if (!extensionesAceptadas.includes(extension)) {
          res.status(400);
          res.json({
            msg: "ERROR",
            tag: "Solo soporta" + extensionesAceptadas,
            code: 200,
          });
        } else {
          const name = externalAnimeName + "." + extension; //Dándole al archivo un nombre específico
          console.log(extension);
          fs.rename(
            file.filepath,
            "public/multimedia/" + name,
            async function (err) {
              //guardar el archivo en la carpeta
              if (err) {
                res.status(200);
                res.json({
                  msg: "Error",
                  tag: "No se pudo guardar el archivo",
                  code: 200,
                });
              } else {
                animeModificar.archivo = name;
                await animeModificar.save();
                res.status(200);
                res.json({ msg: "OK", tag: "Archivo guardado", code: 200 });
              }
            }
          );
        }
      }
    });
  }

  async modificar(req, res) {
    // Obtener la persona a modificar
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
      let animeModificar = await anime.findOne({
        where: { external_id: external },
        include: [
          {
            model: models.persona,
            as: "persona",
            attributes: ["nombres", "apellidos"],
          },
        ],
        transaction,
      });

      // Verificar si el anime existe
      if (!animeModificar) {
        res.status(404);
        res.json({ msg: "ERROR", tag: "Anime no encontrado", code: 404 });
        return;
      }

      var uuid = require("uuid");
      var perA = animeModificar.persona;

      if (!perA) {
        res.status(401);
        res.json({
          msg: "ERROR",
          tag: "El editor a buscar no existe",
          code: 401,
        });
      } else {
        // Actualizar los campos si se proporcionan en la solicitud
        if (
          req.body.hasOwnProperty("titulo") &&
          req.body.hasOwnProperty("cuerpo") &&
          req.body.hasOwnProperty("fecha") &&
          req.body.hasOwnProperty("tipo_anime") &&
          req.body.hasOwnProperty("estado")
        ) {
          animeModificar.titulo = req.body.titulo;
          animeModificar.cuerpo = req.body.cuerpo;
          animeModificar.fecha = req.body.fecha;
          animeModificar.tipo_anime = req.body.tipo_anime;
          animeModificar.estado = req.body.estado;
          animeModificar.external_id = uuid.v4();
        } else {
          res.status(400);
          res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
          return;
        }

        // Guardar los cambios y confirmar la transacción
        await animeModificar.save({ transaction });
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

function esImagen(extension) {
  return extensionesImagen.includes(extension);
}

function esVideo(extension) {
  return extensionesVideo.includes(extension);
}

module.exports = AnimeControl;
