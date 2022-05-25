const createError = require('http-errors')
const User = require('../models/User.model')
const Subscription = require('../models/Subscription.model')
const Stripe = require('stripe')
require('../models/Post.model')

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.id)
    .populate('posts')
    .then(user => {
        if (!user) {
          // not found
          next(createError(404, 'User not found'))
        } else {
          res.status(200).json(user)
        }
      })
    .catch(next)
}


module.exports.list = (req, res, next) => {
  User.find()
    .populate('posts')
    .then(users => {
        if (!users) {
          res.status(200).json([])
        } else {
          res.status(200).json(users)
        }
      })
    .catch(next)
}


module.exports.getCurrentUser = (req, res, next) => {
  User.findById(req.currentUser)
    .populate('posts')
    .populate({
      path: 'subscriptions',
      populate: {
        path: 'targetUser'
      }
    })
    .then(user => {
      if (!user) {
        // not found
        next(createError(404, 'User not found'))
      } else {
        res.status(200).json(user)
      }
    })
    .catch(next)
}

module.exports.checkout = (req, res, next) => {
  const stripe = new Stripe(process.env.STRIPE_KEY)

  const { subUserId, amount, paymentId } = req.body
  Subscription.findOne({ user: req.currentUser, targetUser: subUserId })
    .then(sub => {
      if (sub) {
        res.status(400).json({ message: 'already subscribed'})
      } else {
       return stripe.paymentIntents.create({
          amount,
          currency: "USD",
          description: "subscripción al usuario del producto",
          payment_method: paymentId,
          confirm: true
        })
        .then(result => {
          return Subscription.create({ user: req.currentUser,  targetUser: subUserId })
            .then(subscription => {
              console.log(subscription)
              res.status(201).json({ message: "confirmed!", result })
            })
        })
      }
    })

  .catch(next)

}