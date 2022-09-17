if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const path=require('path');

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));
app.use('/static',express.static(path.join(__dirname+'/static')))
app.use(express.json())
app.use(express.static('public'))

app.get('/store', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      
      res.render('store.ejs', {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data)
      })
    }
  }) 
})

app.post('/purchase', async (req, res) => {

  total = 0;
  quantity = 0;
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      const itemsJson = JSON.parse(data)
      const itemsArray = itemsJson.music.concat(itemsJson.merch)
      
      req.body.items.forEach(function(item) {
        const itemJson = itemsArray.find(function(i) {
          return i.id == item.id
        })
        total = total + itemJson.price * item.quantity
        quantity = quantity + item.quantity;
      })

      const session = stripe.checkout.sessions.create({
        line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Tickets',
                },
                unit_amount: total,
              },
              quantity: quantity,
            },
          ],
        mode: 'payment',
        success_url: 'http://127.0.0.1:3000/success.html',
        cancel_url: 'http://127.0.0.1:3000/cancel.html',
      });
    }
  })

  // const session = await stripe.checkout.sessions.create({
  //     line_items: [
  //           {
  //             price_data: {
  //               currency: 'usd',
  //               product_data: {
  //                 name: 'T-shirt',
  //               },
  //               unit_amount: total,
  //             },
  //             quantity: 1,
  //           },
  //         ],
  //     mode: 'payment',
  //     success_url: 'http://127.0.0.1:3000/success.html',
  //     cancel_url: 'http://127.0.0.1:3000/cancel.html',
  //   });

  //   console.log(session);

  //   if(session&&session.id){
  //     console.log(session.success_url);
  //     return res.render('success.ejs');
  //   }
  //   else return res.render('cancel.ejs');

})


app.listen(3000)