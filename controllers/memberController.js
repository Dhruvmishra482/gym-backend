const Member = require("../models/Member")

exports.addMember = async (req,res) =>
{
    try
    {
        const [name,phoneNo,email,gender,age,joiningDate,planDuration,feesAmount,nextDueDate,paymentStatus,lastPaidOn,address] = req.body;

        const checkUser = await Member.findOne({ phoneNo });

        if (checkUser)
        {
            return res.json({
                message: "User is already our Member",
                data: checkUser
            })
        }

        const newUser = new Member({
            name,phoneNo,email,gender,age,joiningDate,planDuration,feesAmount,nextDueDate,paymentStatus,lastPaidOn,address
        })

        const newMember = await newUser.save();

        const token = await newMember.getJWT();

        res.cookie("token",token);

        res.json({
            message: "New Member Added",
            data: newMember
        });

    } catch (error)
    {
        res.status(401).send(error.message);
    }
}