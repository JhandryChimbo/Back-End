"use strict";
var models = require("../models");
var persona = models.persona;
var cuenta = models.cuenta;
var rol = models.rol;
class PersonaControl {
  async listar(req, res) {
    var lista = await persona.findAll({
      include: [
        {
          model: models.cuenta,
          as: "cuenta",
          attributes: ["correo", "estado"],
        },
        { model: models.rol, as: "rol", attributes: ["nombre"] },
      ],
      attributes: [
        "apellidos",
        ["external_id", "id"],
        "nombres",
        "direccion",
        "celular",
        "fecha_nacimiento",
      ],
    });
    res.status(200);
    res.json({ msg: "OK", code: 200, datos: lista });
  }

  async obtener(req, res) {
    const external = req.params.external;
    var lista = await persona.findOne({
      where: { external_id: external },
      include: [
        {
          model: models.cuenta,
          as: "cuenta",
          attributes: ["correo", "estado"],
        },
        { model: models.rol, as: "rol", attributes: ["nombre"] },
      ],
      attributes: [
        "apellidos",
        ["external_id", "id"],
        "nombres",
        "direccion",
        "celular",
        "fecha_nacimiento",
      ],
    });
    if (lista === undefined || lista == null) {
      res.status(404);
      res.json({
        msg: "Error",
        tag: "Usuario no encontrado",
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
      req.body.hasOwnProperty("nombres") &&
      req.body.hasOwnProperty("apellidos") &&
      req.body.hasOwnProperty("direccion") &&
      req.body.hasOwnProperty("celular") &&
      req.body.hasOwnProperty("correo") &&
      req.body.hasOwnProperty("clave") &&
      req.body.hasOwnProperty("fecha") &&
      req.body.hasOwnProperty("rol")
    ) {
      var uuid = require("uuid");
      var rolA = await rol.findOne({ where: { external_id: req.body.rol } });
      var correoA = await cuenta.findOne({
        where: { correo: req.body.correo },
      });

      // Validar correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.correo)) {
        res.status(400);
        res.json({
          msg: "ERROR",
          tag: "El correo ingresado no tiene un formato válido",
          code: 400,
        });
        return;
      }

      // Validar formato de fecha (mm-dd-aaaa)
      const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/;
      if (!dateRegex.test(req.body.fecha)) {
        res.status(400);
        res.json({
          msg: "ERROR",
          tag: "El formato de fecha no es válido 'mm-dd-aaaa'",
          code: 400,
        });
        return;
      }

      if (correoA === null) {
        if (rolA !== null) {
          // Cambiado de `!=` a `!==`
          var data = {
            nombres: req.body.nombres,
            external_id: uuid.v4(),
            apellidos: req.body.apellidos,
            celular: req.body.celular,
            fecha_nacimiento: req.body.fecha,
            id_rol: rolA.id,
            direccion: req.body.direccion,
            cuenta: {
              correo: req.body.correo,
              clave: req.body.clave,
              estado: true,
            },
          };
          let transaction = await models.sequelize.transaction();
          try {
            var result = await persona.create(data, {
              include: [{ model: models.cuenta, as: "cuenta" }],
              transaction,
            });
            await transaction.commit();
            if (result === null) {
              res.status(401);
              res.json({ msg: "ERROR", tag: "no se puede crear", code: 401 });
            } else {
              rolA.external_id = uuid.v4();
              await rolA.save();
              res.status(200);
              res.json({ msg: "OK", code: 200 });
            }
          } catch (error) {
            if (transaction) await transaction.rollback();
            res.status(203);
            res.json({ msg: "ERROR", code: 200, error_msg: error });
          }
        } else {
          res.status(400);
          res.json({
            msg: "ERROR",
            tag: "El rol a buscar no existe",
            code: 400,
          });
        }
      } else {
        res.status(400);
        res.json({
          msg: "ERROR",
          tag: "Este correo ya se encuentra asociado a una cuenta",
          code: 400,
        });
      }
    } else {
      res.status(400);
      res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
    }
  }

  async guardarUsuario(req, res) {
    if (
      req.body.hasOwnProperty("nombres") &&
      req.body.hasOwnProperty("apellidos") &&
      // req.body.hasOwnProperty("direccion") &&
      // req.body.hasOwnProperty("celular") &&
      req.body.hasOwnProperty("correo") &&
      req.body.hasOwnProperty("clave")
      // req.body.hasOwnProperty("fecha")
    ) {
      var uuid = require("uuid");
      var rolA = await rol.findOne({ where: { nombre: "usuario" } });
      var correoA = await cuenta.findOne({
        where: { correo: req.body.correo },
      });

      // Validar correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.correo)) {
        res.status(400);
        res.json({
          msg: "ERROR",
          tag: "El correo ingresado no tiene un formato válido",
          code: 400,
        });
        return;
      }

      // // Validar formato de fecha (mm-dd-aaaa)
      // const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/;
      // if (!dateRegex.test(req.body.fecha)) {
      //   res.status(400);
      //   res.json({
      //     msg: "ERROR",
      //     tag: "El formato de fecha no es válido 'mm-dd-aaaa'",
      //     code: 400,
      //   });
      //   return;
      // }

      // // Validar formato de número de celular de Ecuador (0980657855)
      // const phoneRegex = /^09\d{8}$/;
      // if (!phoneRegex.test(req.body.celular)) {
      //   res.status(400);
      //   res.json({
      //     msg: "ERROR",
      //     tag: "El número de celular ingresado no tiene un formato válido para Ecuador",
      //     code: 400,
      //   });
      //   return;
      // }

      if (correoA === null) {
        var data = {
          nombres: req.body.nombres,
          external_id: uuid.v4(),
          apellidos: req.body.apellidos,
          // celular: req.body.celular,
          // fecha_nacimiento: req.body.fecha,
          id_rol: rolA.id,
          // direccion: req.body.direccion,
          cuenta: {
            correo: req.body.correo,
            clave: req.body.clave,
            estado: true,
          },
        };
        let transaction = await models.sequelize.transaction();
        try {
          var result = await persona.create(data, {
            include: [{ model: models.cuenta, as: "cuenta" }],
            transaction,
          });
          await transaction.commit();
          if (result === null) {
            res.status(401);
            res.json({ msg: "ERROR", tag: "no se puede crear", code: 401 });
          } else {
            rolA.external_id = uuid.v4();
            await rolA.save();
            res.status(200);
            res.json({
              msg: "OK",
              tag: "Cuenta Creada Correctamente",
              code: 200,
            });
          }
        } catch (error) {
          if (transaction) await transaction.rollback();
          res.status(203);
          res.json({ msg: "ERROR", code: 200, error_msg: error });
        }
      } else {
        res.status(400);
        res.json({
          msg: "ERROR",
          tag: "Este correo ya se encuentra asociado a una cuenta",
          code: 400,
        });
      }
    } else {
      res.status(400);
      res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
    }
  }

  async modificar(req, res) {
    const external = req.params.external;

    if (!external) {
      res.status(400);
      res.json({
        msg: "ERROR",
        tag: "Falta la persona a modificar, por favor ingresar su id",
        code: 400,
      });
      return;
    }

    let transaction;
    try {
      transaction = await models.sequelize.transaction();

      let personaModificar = await persona.findOne({
        where: { external_id: external },
        include: [
          { model: models.rol, as: "rol" },
          { model: models.cuenta, as: "cuenta" },
        ],
        transaction,
      });

      if (!personaModificar) {
        res.status(404);
        res.json({ msg: "ERROR", tag: "Persona no encontrada", code: 404 });
        return;
      }

      var uuid = require("uuid");
      var rolA = await rol.findOne({ where: { nombre: req.body.rol } });

      if (rolA) {
        if (
          req.body.hasOwnProperty("nombres") &&
          req.body.hasOwnProperty("apellidos") &&
          req.body.hasOwnProperty("direccion") &&
          req.body.hasOwnProperty("celular") &&
          req.body.hasOwnProperty("fecha") &&
          req.body.hasOwnProperty("estado") &&
          req.body.hasOwnProperty("rol")
        ) {
          personaModificar.nombres = req.body.nombres;
          personaModificar.apellidos = req.body.apellidos;
          personaModificar.direccion = req.body.direccion;
          personaModificar.celular = req.body.celular;
          personaModificar.fecha_nacimiento = req.body.fecha;
          personaModificar.cuenta.estado = req.body.estado;
          personaModificar.id_rol = rolA.id;
        } else {
          res.status(400);
          res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
          return;
        }

        await personaModificar.save({ transaction });
        await personaModificar.cuenta.save({ transaction });
        await transaction.commit();
        console.log("Persona modificada", personaModificar.cuenta.estado);

        res.status(200);
        res.json({ msg: "OK", code: 200 });
      } else {
        res.status(400);
        res.json({
          msg: "ERROR",
          tag: "El rol a buscar no existe",
          code: 400,
        });
      }
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(500);
      res.json({ msg: "ERROR", code: 500, error_msg: error.message });
    }
  }

  async modificarUsuario(req, res) {
    const external = req.params.external;

    if (!external) {
      res.status(400);
      res.json({
        msg: "ERROR",
        tag: "Falta la persona a modificar, por favor ingresar su id",
        code: 400,
      });
      return;
    }

    let transaction;
    try {
      // Iniciar transacción
      transaction = await models.sequelize.transaction();

      // Buscar la persona a modificar
      let personaModificar = await persona.findOne({
        where: { external_id: external },
        include: [{ model: models.rol, as: "rol" }],
        transaction,
      });

      // Verificar si la persona existe
      if (!personaModificar) {
        res.status(404);
        res.json({ msg: "ERROR", tag: "Persona no encontrada", code: 404 });
        return;
      }

      var uuid = require("uuid");
      //var rolA = await rol.findOne({ where: { external_id: req.body.rol } });
      // var rolA = await rol.findOne({ where: { nombre: req.body.rol } });

      if (
        req.body.hasOwnProperty("nombres") &&
        req.body.hasOwnProperty("apellidos") &&
        req.body.hasOwnProperty("direccion") &&
        req.body.hasOwnProperty("celular") &&
        req.body.hasOwnProperty("fecha")
      ) {
        personaModificar.nombres = req.body.nombres;
        personaModificar.apellidos = req.body.apellidos;
        personaModificar.direccion = req.body.direccion;
        personaModificar.celular = req.body.celular;
        personaModificar.fecha_nacimiento = req.body.fecha;

        // personaModificar.external_id = uuid.v4();
      } else {
        res.status(400);
        res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
        return;
      }

      // Guardar los cambios y confirmar la transacción
      await personaModificar.save({ transaction });
      await transaction.commit();

      res.status(200);
      res.json({ msg: "OK", code: 200 });
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(500);
      res.json({ msg: "ERROR", code: 500, error_msg: error.message });
    }
  }

  async banearUsuario(req, res) {
    const external = req.params.external;
    let transaction;
    try {
      transaction = await models.sequelize.transaction();

      let personaModificar = await persona.findOne({
        where: { external_id: external },
        include: [{ model: models.cuenta, as: "cuenta" }],
        transaction,
      });

      if (!personaModificar) {
        res.status(404);
        res.json({ msg: "ERROR", tag: "Persona no encontrada", code: 404 });
        return;
      }

      if (req.body.hasOwnProperty("estado")) {
        personaModificar.cuenta.estado = req.body.estado;
      } else {
        res.status(400);
        res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
        return;
      }

      await personaModificar.save({ transaction });
      await personaModificar.cuenta.save({ transaction });
      await transaction.commit();
      console.log("Persona modificada", personaModificar.cuenta.estado);

      res.status(200);
      res.json({ msg: "OK", code: 200 });
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(500);
      res.json({ msg: "ERROR", code: 500, error_msg: error.message });
    }
  }
}

module.exports = PersonaControl;
