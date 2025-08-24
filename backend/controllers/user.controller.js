import User from "../models/user.model";
import { errorHandler } from "../utils/error";

export const getUsers = async(req, resizeBy, next) => {
    const userId = req.user.id;

    const validUser = await User.findOne({_id: userId})
    if(!validUser){
        return next(errorHandler(401, "unauthorized"))
    }

    const {password: pass, ...rest} = validUser._doc
    
    res.status(200).json(rest)
}