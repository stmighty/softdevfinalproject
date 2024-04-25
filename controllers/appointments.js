const Appointment = require("../models/Appointment");
const Restaurant = require("../models/Restaurant");
const stripe = require("../config/stripe");
const User = require("../models/User");

//@desc   Get all appointment
//@route  GET /api/v1/appointments
//@access Public

exports.getAppointments = async (req, res, next) => {
  let query;

  //genereal user can see only their appointment
  if (req.user.role !== "admin") {
    query = Appointment.find({ user: req.user.id });

    query = Appointment.find({ user: req.user.id }).populate({
      path: "restaurant",
      select: "name province tel",
    });
    console.log("you are", req.user.role);
    console.log("not admin");
  } else {
    //if you are admin, you can see all
    console.log("you are", req.user.role);
    console.log("admin");
    if (req.params.restaurantId) {
      console.log(
        "restaurantId =",
        req.params.restaurantId,
        "type is",
        typeof req.params.restaurantId
      );

      query = Appointment.find({
        restaurant: req.params.restaurantId,
      }).populate({
        path: "restaurant",
        select: "name province tel",
      });
    } else {
      console.log("no id request");

      query = Appointment.find().populate({
        path: "restaurant",
        select: "name province tel",
      });
    }
  }

  try {
    const appointments = await query;
    console.log("appointments =", appointments);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Appointment" });
  }
};

//@desc   Get single appointment
//@route  GET /api/v1/appointments/:id                  // appointmentId
//@access Public

exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: "restaurant",
      select: "name description tel",
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Appointment" });
  }
};

//@desc   Add appointment
//@route  POST /api/v1/:restaurantId/appointments
//@access Private

exports.addAppointment = async (req, res, next) => {
  try {
    req.body.restaurant = req.params.restaurantId;

    const restaurant = await Restaurant.findById(req.params.restaurantId);

    // if not found restaurant
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `No restaurant with the id of ${req.params.restaurantId}`,
      });
    }

    // add user Id to req.body
    req.body.user = req.user.id;

    //check for existed appointment
    const existedAppointments = await Appointment.find({ user: req.user.id });

    console.log("existedAppointments length is :", existedAppointments.length);
    // if the user is not an admin, they can create at most 3 appointments
    if (existedAppointments.length >= 3 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 appointments`,
      });
    }

    // get user data
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user with the id of ${req.user.id}`,
      });
    }

    // check capacity
    //console.log("restaurant is :", restaurant);
    //console.log(restaurant.capacity);
    var capacity = restaurant.capacity;
    if (typeof capacity === "number") {
      console.log("capacity is :", capacity);
      currentAppointments = await Appointment.find({
        restaurant: req.params.restaurantId,
        apptDate: req.body.apptDate,
      });
      console.log(
        "length of currentAppointments is :",
        currentAppointments.length
      );
      if (currentAppointments.length >= capacity) {
        return res.status(400).json({
          success: false,
          message: `The restaurant is fully booked on that day`,
        });
      }
    }

    req.body.status = "pending";
    const appointment = await Appointment.create(req.body);

    const items = [
      {
        price_data: {
          currency: "thb",
          product_data: {
            name: restaurant.name,
          },
          unit_amount: restaurant.price * 100,
        },
        quantity: 1,
      },
    ];

    const successRedirectUrl = `https://www.google.com/?payment=success&appointment=${appointment.id}`;
    const cancelRedirectUrl = `https://www.google.com/?payment=cancel&appointment=${appointment.id}`;
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: successRedirectUrl,
      cancel_url: cancelRedirectUrl,
      payment_method_types: ["card", "promptpay"],
      mode: "payment",
      billing_address_collection: "auto",
      customer_email: user.email,
      line_items: items,
      metadata: {
        appointmentId: appointment.id,
      },
    });

    console.log("req.body is", req.body);
    res.status(200).json({
      success: true,
      data: appointment,
      stripe: stripeSession,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot create Appointment" });
  }
};

//@desc  Pay appointment
//@route POST /api/v1/appointments/:id/webhook
//@access Private
exports.payAppointment = async (req, res, next) => {
  const body = req.body;
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    console.log(`Webhook Error: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const session = event.data.object;
  if (!session?.metadata?.appointmentId) {
    console.log("Missing metadata");
    return res.status(400).send("Missing metadata");
  }

  if (event.type === "checkout.session.completed") {
    console.log("Payment was successful");
    await Appointment.findByIdAndUpdate(session.metadata.appointmentId, {
      status: "paid",
    });
    return res.status(200).json({ success: true });
  }
  res.status(200).json({ success: true });
};

//@desc   Update appointment
//@route  PUT /api/v1/appointments/:id
//@access Private

exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    console.log("req.param =", req.params);
    console.log("req.params.id =", req.params.id);

    if (!appointment) {
      // if not found
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    // if found
    console.log("old appointment =", appointment);

    if (
      appointment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this appointment`,
      });
    }

    // check if it is fully booked
    const new_restaurant = await Restaurant.findById(req.body.restaurant);
    console.log("new_restaurant is :", new_restaurant);
    var capacity = new_restaurant.capacity;
    console.log("capacity is :", capacity);
    if (typeof capacity === "number") {
      currentAppointments = await Appointment.find({
        restaurant: req.body.restaurant,
        apptDate: req.body.apptDate,
      });
      console.log(
        "length of currentAppointments is :",
        currentAppointments.length
      );
      if (currentAppointments.length >= capacity) {
        return res.status(400).json({
          success: false,
          message: `The restaurant is fully booked on that day`,
        });
      }
    }

    // can be booked
    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    console.log("updated appointment =", appointment);

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "cannot update Appointment" });
  }
};

//@desc     Update restaurant
//route     UPDATE /api/v1/restaurants/:id
//@access   Public
/*
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
*/

//@desc   delete appointment
//@route  Delete /api/v1/appointments/:id
//@access Private

exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      //not found
      return res.status(404).json({
        success: false,
        message: `No appointment with the id of ${req.params.id}`,
      });
    }

    // found
    console.log("found");
    console.log(appointment);

    // make sure that user is the appointment owner
    if (
      appointment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this appointment`,
      });
    }
    await appointment.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "cannot delete Appointment" });
  }
};

//@desc     Delete restaurant
//route     DELETEe /api/v1/restaurants/:id
//@access   Public

/*
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



exports.createRestaurant = async (req,res,next) => {
    const restaurant = await Restaurant.create(req.body);
    res.status(201).json({
        success: true,
        data: restaurant
    });
    res.status(200).json({success:true, msg:'Create new restaurant'});
};
*/
