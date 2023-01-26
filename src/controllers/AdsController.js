const { v4: uuid } = require('uuid');
const jimp = require('jimp');
const ObjectId = require('mongoose').Types.ObjectId;

const Category = require('../models/Category');
const User = require('../models/User');
const Ad = require('../models/ad');
const StateModel = require('../models/State');

const addImage = async (buffer) => {
     let newName = `${uuid()}.jpg`;
     let tmpImg = await jimp.read(buffer);
     tmpImg.cover(500, 600).quality(80).write(`./public/media/${newName}`);
     return newName;
}

//Função para validar id
function isValidObjectId(id) {
     if (ObjectId.isValid(id)) {
          if((String)(new ObjectId(id)) === id){
               return true;
          }
          return false;
     }
     return false;
};

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
          let { title, price, priceneg, desc, cat, token, state } = req.body;
          const user = await User.findOne({ token }).exec();
          
          if (!title || !cat) {
               res.json({error: 'Titulo ou Categoria não foram preenchidos'})
          }

          let catId = await Category.findOne({slug: cat});
          console.log(catId);

          if (catId == null) {
               res.json({ error: "Selecione uma categoria válida." });
               return;
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
          newAd.dateCreate = new Date();
          newAd.title = title;
          newAd.state = user.state;
          newAd.category = catId._id;
          newAd.price = price;
          newAd.priceNegotiable = (priceneg == 'true') ? true : false ;
          newAd.description = desc;
          newAd.views = 0;

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
          let { sort = 'asc', offset = 0, limit = 8, q, cat, state } = req.query;
          let filters = {status: true};
          let total = 0;

          if (q) {
               filters.title = {'$regex': q, "$options": 'i'}
          }

          if (cat) {
               const c = await Category.findOne({slug: cat}).exec();
               if (c) {
                    filters.category = c._id.toString();
                    
               }
          }

          if (state) {
               const s = await StateModel.findOne({name: state.toUpperCase()}).exec()
               if (s) {
                    filters.state = s._id.toString();
               }
          }

          const adsTotal = await Ad.find(filters).exec()
          total = adsTotal.length;

          const adsData = await Ad.find(filters)
               .sort({dateCreate: (sort=='desc' ? -1 : 1)})
               .skip(parseInt(offset))
               .limit(parseInt(limit))
               .exec();

          let ads = [];
          for ( let i in adsData ) {
               let image;

               let defaultImg = adsData[i].images.find(e => e.default)
               if (defaultImg) {
                    image = `${process.env.BASE}/media/${defaultImg.url}`;
               } else {
                    image = `${process.env.BASE}/media/default.jpg`;
               }

               ads.push({
                    id: adsData[i]._id,
                    title: adsData[i].title,
                    price: adsData[i].price,
                    priceNegotiable: adsData[i].priceNegotiable,
                    image
               })
          }


          res.json({ads, total})
     },

     getItem: async (req, res) => {
          let { id, other = null } = req.query;

          if (!id) {
               res.json({ error: 'sem produto' });
               return;
          }

          if (!isValidObjectId(id)) {
               res.json({ error: 'ID invalido' });
               return;
          }
          const ad = await Ad.findById(id);

          if (!ad) {
               res.json({ error: 'Produto Inexistente' })
               return;
          }

          ad.views++;
          await ad.save();

          let images = [];
          for( let i in ad.images ) {
               images.push(`${process.env.BASE}/media/${ad.images[i].url}`)
          }

          let category = await Category.findById(ad.category).exec();
          let userInfo = await User.findById(ad.idUser).exec();
          let stateInfo = await StateModel.findById(ad.state).exec()

          let others = [];
          if (other) {
               const otherData = await Ad.find({status: true, idUser: ad.idUser}).exec();

               for(let i in otherData){
                    if (otherData[i]._id.toString() != ad._id.toString()) {
                         let image = `${process.env.BASE}/media/default.jpg` ;

                         let defaultImg = otherData[i].images.find(e => e.default)
                         if (defaultImg) {
                              image = `${process.env.BASE}/media/${defaultImg.url}`
                         }

                         others.push({
                              id: otherData[i]._id,
                              title: otherData[i].title,
                              price: otherData[i].price,
                              priceNegotiable: otherData[i].priceNegotiable,
                              image
                         })

                    }
               }
          }

          res.json({
               id: ad.id,
               title: ad.title,
               price: ad.price,
               priceNegotiable: ad.priceNegotiable,
               description: ad.description,
               dateCreate: ad.dateCreate,
               views: ad.views,
               images,
               category,
               userInfo: { name: userInfo.name, email: userInfo.email },
               stateName: stateInfo.name,
               others
          })
     },

     editAction: async (req, res) => {
          let { id } = req.params;
          let { title, status, price,priceneg, desc, cat, images, token } = req.body;

          if (!isValidObjectId(id)) {
               res.json({ error: 'ID invalido' });
               return;
          }

          const ad = await Ad.findById(id). exec();

          if (!ad) {
               res.json({ error: 'Anuncio não foi encontrado' });
               return;
          }

          const user = await User.findOne({ token }).exec();
          
          if (user._id.toString() !== ad.idUser) {
               res.json({ error: 'Você não é o anunciante' });
               return;
          }

          let updates = {};

          if (title) {
               updates.title = title
          }
          
          if (price) {
               price = price.replace('.', '').replace(',', '.').replace('R$', '');
               price = parseFloat(price);
               updates.price = price;
          }
          if (priceneg) {
               updates.priceNegotiable = priceneg;
          }
          if(status) {
               updates.status = status;
          }
          if (desc) {
               updates.description = desc;
          }
          if (cat) {
               const category = await Category.findOne({slug: cat}).exec();
               if (!category) {
                    res.json({ error: 'Categoria não existe' });
                    return;
               }
               updates.category = category._id.toString();
          }
          if (images) {
               updates.images = images;
          }
          console.log(updates);

          await Ad.findByIdAndUpdate(id, {$set: updates});

          //Adicionando nova imagem
          const product = await Ad.findById(id).exec();        
          console.log(product)
          let imagesUpdates = product.images;

          if (req.files && req.files.img) {
               if (req.files.img.length == undefined) {
                    if (['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img.mimetype)) {
                         let url = await addImage(req.files.img.data);
                         imagesUpdates.push({
                         url,
                         default: false
                         });
                    }
               } else {
                    for (let i = 0; i < req.files.img.length; i++) {
                         if (['image/jpeg', 'image/jpg', 'image/png'].includes(req.files.img[i].mimetype)) {
                              let url = await addImage(req.files.img[i].data);
                                    imagesUpdates.push({
                                   url,
                                   default: false
                              })
                              };
                         }
                    }
                    console.log(imagesUpdates);
                    await Ad.findByIdAndUpdate(id, {$set: { images: imagesUpdates }});
                    
               }
               


          res.json({error: ''});
     }
}