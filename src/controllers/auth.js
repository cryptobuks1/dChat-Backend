/* eslint-disable camelcase */
/* eslint-disable node/handle-callback-err */
const { User } = require('../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const joi = require('joi')
const multer = require('multer')
const multerHelper = require('../helpers/uploadHelper')
const fs = require('fs')
const response = require('../helpers/responseStandard')
const {
  APP_KEY
} = process.env

module.exports = {
  login: async (req, res) => {
    const schema = joi.object({
      email: joi.string().required(),
      password: joi.string().required()
    })
    const { value: results, error } = schema.validate(req.body)
    if (error) {
      return response(res, 'Error', { error: error.message }, 400, false)
    } else {
      const { email, password } = results
      try {
        const isExist = await User.findOne({ where: { email: email } })
        if (isExist) {
          console.log(isExist.dataValues)
          if (isExist.dataValues.password) {
            try {
              await bcrypt.compare(password, isExist.dataValues.password, (err, result) => {
                if (result) {
                  jwt.sign({ id: isExist.dataValues.id }, APP_KEY, async (err, token) => {
                    try {
                      await isExist.update({ last_active: new Date() })
                    } catch (e) {

                    }
                    return response(res, { token }, {}, 200, true)
                  })
                } else {
                  return response(res, 'Wrong email or password', {}, 400, false)
                }
              })
            } catch (e) {
              return response(res, e.message, {}, 500, false)
            }
          }
        } else {
          console.log(isExist)
          return response(res, 'Wrong email or password', {}, 400, false)
        }
      } catch (e) {
        return response(res, e.message, {}, 500, false)
      }
    }
  },
  signUp: async (req, res) => {
    const schema = joi.object({
      username: joi.string().required(),
      email: joi.string().required(),
      password: joi.string().required(),
      phone_number: joi.string().required()
    })
    const { value: results, error } = schema.validate(req.body)
    if (error) {
      return response(res, 'Error', { error: error.message }, 400, false)
    } else {
      let { username, email, password, phone_number } = results
      try {
        password = await bcrypt.hash(password, await bcrypt.genSalt())
        const data = {
          username,
          email,
          password,
          phone_number
        }
        const isExist = await User.findOne({ where: { email: email } })
        // console.log(isExist === null)
        if (isExist !== null) {
          return response(res, 'Email has been used', {}, 400, false)
        } else {
          console.log(data)
          const results = await User.create(data)
          return response(res, 'User created successfully', { results })
        }
      } catch (e) {
        return response(res, e.message, {}, 500, false)
      }
    }
  },
  signUpWithPhoneNumber: (req, res) => {
    const schema = joi.object({
      username: joi.string().required(),
      password: joi.string().required(),
      phone_number: joi.string().required()
    })
    const { value: results, error } = schema.validate(req.body)
    if (error) {
      return response(res, 'Error', { error: error.message }, 400, false)
    } else {
      let { username, password, phone_number } = results
      multerHelper(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_UNEXPECTED_FILE' && req.file.length === 0) {
            fs.unlinkSync('assets/uploads/' + req.file.filename)
            return response(res, 'fieldname doesnt match', {}, 500, false)
          }
          // fs.unlinkSync('assets/uploads' + req.file)
          return response(res, err.message, {}, 500, false)
        } else if (err) {
          fs.unlinkSync('assets/uploads/' + req.file.filename)
          return response(res, err.message, {}, 401, false)
        }
        try {
          password = await bcrypt.hash(password, await bcrypt.genSalt())
          let data = {}
          if (req.file) {
            data = {
              username,
              password,
              phone_number,
              profile_image: req.file
            }
          } else {
            data = {
              username,
              password,
              phone_number
            }
            const isExist = await User.findOne({ where: { password } })
            // console.log(isExist === null)
            if (isExist !== null) {
              return response(res, 'Error phone number has been registered, please login with it,', {}, 400, false)
            } else {
              console.log(data)
              const results = await User.create(data)
              return response(res, 'User created successfully', { results })
            }
          }
        } catch (e) {
          return response(res, e.message, {}, 500, false)
        }
      })
    }
  },
  loginWithPhoneNumber: async (req, res) => {
    const schema = joi.object({
      phone_number: joi.string().required(),
      password: joi.string().required()
    })
    const { value: results, error } = schema.validate(req.body)
    if (error) {
      return response(res, 'Error', { error: error.message }, 400, false)
    } else {
      const { phone_number, password } = results
      try {
        const isExist = await User.findOne({ where: { phone_number } })
        if (isExist) {
          console.log(isExist.dataValues)
          if (isExist.dataValues.password) {
            try {
              await bcrypt.compare(password, isExist.dataValues.password, (err, result) => {
                if (result) {
                  jwt.sign({ id: isExist.dataValues.id }, APP_KEY, async (err, token) => {
                    try {
                      await isExist.update({ last_active: new Date() })
                    } catch (e) {

                    }
                    return response(res, { token }, {}, 200, true)
                  })
                } else {
                  return response(res, 'Password wrong!', {}, 400, false)
                }
              })
            } catch (e) {
              return response(res, e.message, {}, 500, false)
            }
          }
        } else {
          console.log(isExist)
          return response(res, 'Phone number is\'nt registered', {}, 400, false)
        }
      } catch (e) {
        return response(res, e.message, {}, 500, false)
      }
    }
  }
}