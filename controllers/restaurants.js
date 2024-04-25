const Restaurant = require('../models/Restaurant.js');
const vacCenter = require('../models/VacCenter.js');
const { param } = require('../routes/restaurants.js');

require('../models/Restaurant.js');


//@desc     Get all restaurants
//route     Get /api/v1/restaurants
//@access   Public

exports.getRestaurants = async (req,res, next) => {



    // visualize
    console.log("req.body is", req.body);
    console.log("req.user.role", req.user.role);


    let query;

    //Copy req.query
    console.log("req.query =", req.query, "type is", typeof req.query);
    const reqQuery = {...req.query};        //string to array of key value
    console.log("reqQuery", reqQuery, "type is", typeof reqQuery);




    //Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];


    //loop over remove fileds and delete them 
    removeFields.forEach(param => delete reqQuery[param]);
    console.log("reqQuery after removed", reqQuery);


    // Create query string
    let queryStr = JSON.stringify(reqQuery);           //json to str ex. { province: 'Nonthaburi' }
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match=> `$${match}`);
    console.log("queryStr =", queryStr);
    //query = Restaurant.find(JSON.parse(queryStr));
    //console.log("query =", query);



    query = Restaurant.find(JSON.parse(queryStr)).populate('appointments');


    // Select field
    if(req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        //console.log('req.query =', req.query);
        //console.log('req.query.select =', req.query.select);
        //console.log('fields =', fields);
        query = query.select(fields);
    } 

    // sort 
    if(req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        //console.log("sortBy =", sortBy);
        query = query.sort(sortBy);
    }
    else {
        query = query.sort('-createdAt');
    }

    //pagegination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page-1) * limit;
    const endIndex = page*limit;

    console.log('page =', page);
    console.log('limit =', limit);
    console.log('startIndex', startIndex);
    console.log('endIndex =', endIndex);

    try {


        const total = await Restaurant.countDocuments();
        query = query.skip(startIndex).limit(limit);
        console.log("total =", total);



        //executing query
        const restaurants = await query;
        


        // pagination result
        const pagination = {};
        if(endIndex < total) {
            pagination.next = {page: page+1,
                                limit
            }
        }

        if(startIndex > 0) {
            pagination.prev = {
                page: page-1,
                limit
            }
        }


        console.log("pagination =", pagination);

        if(req.user.role === 'admin') {
            res.status(200).json({success:true, count:restaurants.length, pagination, data:restaurants});
        }
        else {
            const restaurants = await Restaurant.find();
            res.status(200).json({success:true, count:restaurants.length, pagination, data:restaurants});
        }
    }
    catch(err){
        res.status(400).json({success:false});
    }
};


//@desc     Get single restaurant
//route     Get /api/v1/restaurants/:id
//@access   Public
exports.getRestaurant = async (req,res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if(!restaurant) {
            return res.status(400).json({success:false});
        }
        console.log(`type of restaurant is ${typeof restaurant} and value of `, 'restaurants is', restaurant);
        res.status(200).json({success:true, data:restaurant})
     }
     catch(err) {
        res.status(400).json({success:false});
     }
};






//@desc     Update restaurant
//route     UPDATE /api/v1/restaurants/:id     //(restaurantId)
//@access   Public
exports.updateRestaurant = async (req,res, next) => {

    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body,  {
            new: true,
            runValidators:true
        });

        if(!restaurant) {
            return res.status(400).json({success: false});
        }

        res.status(200).json({success:true, data: restaurant});
    }
    catch (err) {
        res.status(400).json({success:false});
    }

};


//@desc     Delete restaurant
//route     DELETEe /api/v1/restaurants/:id
//@access   Public
exports.deleteRestaurant = async (req,res, next) => {
    try{
        const restaurant = await Restaurant.findById(req.params.id);
        if(!restaurant) {  // if not found
            return res.status(400).json({success: false});
        }

        // if found
        console.log('found');
        console.log(restaurant);
        await restaurant.deleteOne();

        res.status(200).json({success:true, data: {}});
    }
    
    

    catch(err) {
        console.log(err);
        res.status(400).json({success: false});
    }
};



//@desc     Create new restaurant
//route     Create /api/v1/restaurants/
//@access   Public

exports.createRestaurant = async (req,res,next) => {
    try {
        const restaurant = await Restaurant.create(req.body);
            res.status(201).json({
            success: true,
            data: restaurant
        });
    }
    catch(err) {
        res.status(500).json({
            success: false,
            error: error.message || "Server Error"
        });
    }
    
};






//@desc     Get vaccine center
//route     Get /api/v1/restaurants/vacCenters/
//@access   Public

exports.getVacCenters = (req,res,next) => {
    
    vacCenter.getAll((err, data) => {
        if(err) {
            console.log("error :", err);
            res.status(500).send({message: err.message || "Some error occured while retrieving Vaccine Centers"});
        }

        else {
            res.send(data);
        }
    });
};