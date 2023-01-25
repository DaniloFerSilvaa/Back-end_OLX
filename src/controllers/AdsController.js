const { v4: uuid } = require('uuid');
const jimp = require('jimp');

const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require('../models/ad');

const addImage = async (buffer) => {
     let newName = `${uuid()}.jpg`;
     let tmpImg = await jimp.read(buffer);
     tmpImg.cover(500, 600).quality(80).write(`./public/media/${newName}`);
     return newName;
}

module.exports = {
     getCategories: async (req, res) => {
          const cats = await Category.find();

          let categories = [];

          for ( let i in cats) {
               categories.push({
                    ...cats[i]._doc,
                    img: `${process.env.BASE}/assets/images/${cats[i].slug}.png`
               });
          }

          console.log(categories[1].slug)

          res.json({categories});
     },
     
     addAction: async (req, res) => {
          let { title, price, priceneg, desc, cat, token } = req.body;
          const user = await User.findOne({ token }).exec();

          if (!title || !cat) {
               res.json({error: 'Titulo ou Categoria não foram preenchidos'})
          }

          if (price) {
               price = price.replace('.', '').replace(',', '.').replace('R$', '');
               price = parseFloat(price)
          } else {
               price = 0;
          }

          const newAd = new Ad();
          newAd.status = true;
          newAd.idUser = user._id;
          newAd.state = user.state;
          newAd.dateCreate = new Date();
          newAd.title = title;
          newAd.category = cat;
          newAd.price = price;
          newAd.priceNegotiable = (priceneg == 'true') ? true : false ;
          newAd.description = desc;
          newAd.viewes = 0;

          if (req.files && req.files.img) {
               if (req.files.img.length == undefined) {
                    if (['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img.mimetype)) {
                         let url = await addImage(req.files.img.data);
                         newAd.images.push({
                         url,
                         default: false
                         });
                    }
               } else {
                    for (let i = 0; i < req.files.img.length; i++) {
                         if (['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img[i].mimetype)) {
                              let url = await addImage(req.files.img[i].data);
                              newAd.images.push({
                              url,
                              default: false
                              });
                         }
                    }
               }
          }

          if (newAd.images.length > 0) {
               newAd.images[0].default = true;
          }


          const info = await newAd.save();

          res.json({id: info._id})
     },

     getList: async (req, res) => {
     
          res.json({})
     },

     getItem: async (req, res) => {
     
          res.json({})
     },

     editAction: async (req, res) => {
     
          res.json({})
     }
}