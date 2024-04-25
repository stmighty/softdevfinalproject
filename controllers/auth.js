const User = require('../models/User');




//@desc   create a user
//@route  POST /api/v1/auth/register
//@access Public

exports.register = async (req, res, next) => {
    try {
        const {name, email, password, role, telephone} = req.body;

        //create user
        const user = await User.create({
            name,
            email,
            password,
            role,
            telephone
        });
        
        //create token
        
        //const token = user.getSignedJwtToken();
        //res.status(200).json({success: true, token});
        sendTokenResponse(user, 200, res);

    }catch(err) {
        res.status(400).json({success: false});
        console.log(err.stack);
    }
};




//@desc   login 
//@route  POST /api/v1/auth/login
//@access Public

exports.login = async (req,res,next) => {
    try {
        const {email, password} = req.body;

        //Validate email and password (not null)
        if(!email || !password) {
            return res.status(400).json({success: false, msg:"Please provide an email and password"});
        }

        //check for user
        const user = await User.findOne({email}).select('+password');

        if(!user) {
            return res.status(400).json({success:false, msg: "Invalid credentials"});
        }

        //check if password matches

        const isMatch = await user.matchPassword(password);
        if(!isMatch) {
            return res.status(401).json({success: false, msg: "Invalid credentials password is not matched"});
        }

        // Create token 
    
        //const token = user.getSignedJwtToken();
        //res.status(200).json({success: true, token});
        sendTokenResponse(user, 200, res);
    }
    catch (err) {
        return res.status(401).json({success: false, msg: "Cannot convert email or password to string"});
    }
};


//get token from model
const sendTokenResponse = (user, statusCode, res) => {

    //create token
    const token = user.getSignedJwtToken();

    const option = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV === "production") {
        option.secure = true;
    }

    res.status(statusCode).cookie('token', token, option).json({
        success: true,
        //add for frontend
        _id:user._id,
        name: user.name,
        email:user.email,
        //end for frontend
        token
    })
}



//@desc   Get current Logged in user
//@route  POST /api/v1/auth/me
//@access Private

exports.getMe = async(req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({success: true, data: user});
    //console.log('request is:', req);
};






//@desc   Log user out / clear cookie
//@route  GET /api/v1/auth/logout
//@access Private

exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires : new Date(Date.now() + 10*1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    })
}

