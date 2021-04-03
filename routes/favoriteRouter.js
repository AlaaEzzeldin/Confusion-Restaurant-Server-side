const express = require('express');
const bodyParser = require('body-parser');
var authenticate = require('../authenticate');
const cors = require('./cors');
const mongoose = require('mongoose');
const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());


favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ "user": req.user._id })
            .then((fav) => {
                if (fav != null) {
                    Favorites.findById(fav._id)
                        .populate('user')
                        .populate('dishes')
                        .then((favdoc) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favdoc);
                        }, (err) => next(err))
                }
                else {
                    err = new Error('Your favorite list is empty');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ "user": req.user._id })
            .then((fav) => {
                if (fav != null) {
                    (req.body).map(
                        dish => {
                            if (fav.dishes.indexOf(dish._id) !== -1) {
                                err = new Error('Dish ' + dish._id + 'is already in your favorites list');
                                err.status = 403;
                                return next(err);
                            }
                            else fav.dishes.push(dish._id);
                        }
                    )
                    fav.save()
                        .then((fav) => {
                            Favorites.findById(fav._id)
                                .populate('user')
                                .populate('dishes')
                                .then((fav) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(fav);
                                })
                        }, (err) => next(err));
                }
                else {
                    fav = new Favorites({ user: req.user._id })
                    fav.dishes.push(req.body._id);
                    Favorites.create(fav)
                        .then((fav) => {
                            console.log('List of Favorites Created ', fav);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(fav);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /dishes');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

        Favorites.deleteOne({ "user": req.user._id })
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end('Get operation not supported on /favorites/:dishId');
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ "user": req.user._id })
            .then((fav) => {
                if (fav != null) {
                    if (fav.dishes.indexOf(req.params.dishId) !== -1) {
                        err = new Error('Dish ' + req.params.dishId + 'is already in your favorites list');
                        err.status = 403;
                        return next(err);
                    }
                    console.log("here", req.params.dishId);
                    fav.dishes.push(req.params.dishId);
                    fav.save()
                        .then((fav) => {
                            Favorites.findById(fav._id)
                                .populate('user')
                                .populate('dishes')
                                .then((fav) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(fav);
                                })
                        }, (err) => next(err));
                }
                else {
                    fav = new Favorites({ user: req.user._id })
                    fav.dishes.push(req.params.dishId);
                    Favorites.create(fav)
                    fav.save()
                        .then((fav) => {
                            Favorites.findById(fav._id)
                                .populate('user')
                                .populate('dishes')
                                .then((fav) => {
                                    console.log('List of Favorites Created ', fav);
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(fav);
                                })
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /dishes');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOneAndUpdate(
            { user: req.user._id },
            { $pull: { dishes: req.params.dishId } },
            { new: true }
        ).then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;
