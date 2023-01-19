const { startSession } = require('mongoose');
const  State = require('../models/State')

module.exports = {
     getSates: async (req, res) => {
     let states = await State.find()
     res.json({ states });
     },
     
     info: async (req, res) => {
     
          res.json({})
     },

     editAction: async (req, res) => {
     
          res.json({})
     },
}


