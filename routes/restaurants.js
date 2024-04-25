


const express = require('express');
const {getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant} = require('../controllers/restaurants');

/**
 * @swagger
 * components :
 *   schemas :
 *     Restaurant :
 *       type : object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the restaurant
 *           example:  d290f1ee-6c54-4b01-90e6-d701748f0851
 *         ลำดับ:
 *           type: string
 *           description: Ordinal number
 *         name:
 *           type: string
 *           description: Restaurant name
 *         address:
 *           type: string
 *           description: House No., Street, Road
 *         district:
 *           type: string
 *           description : District
 *         province:
 *           type: string
 *           description: province
 *         postalcode:
 *           type: string
 *           description: 5-digit postal code
 *         tel:
 *           type: string
 *           description: telephone number
 *         region:
 *           type: string
 *           description: region
 *       example:
 *         id: 609bda561452242d88d36e37
 *         ลำดับ : 121
 *         name : Happy Restaurant
 *         address : 121 ถ.สุขุมวิท
 *         district : บางนา
 *         province : กรุงเทพ
 *         postalcode : 10110
 *         tel: 02-2187000
 *         region: กรุงเทพมหานคร (BKK)
 */

/**
 * @swagger
 * tags :
 *   name: Restaurants
 *   description: The restaurants managing API
 */

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Returns the list of all the restaurants
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: The list of the restaurants
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               iems:
 *                 $ref: '#/components/schemas/Restaurant'
 */

/**
 * @swagger 
 * /restaurants/{id}:
 *   get:
 *     summary: Get the restaurant by id
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: 
 *           type: string
 *         required: true
 *         description: The restaurant id
 *     responses:
 *       200:
 *         description: The restaurant description by id
 *         content: 
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: The restaurant was not found
 */

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: 
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       201:
 *         description: The restaurant was successfully created 
 *         content: 
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       500:
 *         description: Some server error
 */

/**
 * @swagger 
 * /restaurants/{id}:
 *   put:
 *     summary: Update the restaurant by id
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: 
 *           type: string
 *         required: true
 *         description: The restaurant id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: 
 *             $ref: '#/components/schemas/Restaurant'
 *     responses:
 *       200:
 *         description: The restaurant was updated
 *         content: 
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: The restaurant was not found
 *       500 :
 *         description: Some error happened
 */

/**
 * @swagger 
 * /restaurants/{id}:
 *   delete:
 *     summary: Remove the restaurant by id 
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: 
 *           type: string
 *         required: true
 *         description: The restaurant id
 *     responses:
 *       200:
 *         description: The restaurant was deleted
 *       404:
 *         description: The restaurant was not found
 */



// Include other resource routers
const appointmentRouter = require('./appointments');




const router = express.Router();

const {protect, authorize} = require('../middleware/auth');
const swaggerJSDoc = require('swagger-jsdoc');


//Re-route into other resource routers
router.use('/:restaurantId/appointments/', appointmentRouter);


router.route('/').get(protect, getRestaurants).post(protect, authorize('admin'), createRestaurant);
router.route('/:id').get(protect, getRestaurant).put(protect, authorize('admin'), updateRestaurant).delete(protect, authorize('admin'), deleteRestaurant);


module.exports = router;