const Member = require("../models/Member");

exports.addMember = async (req,res) =>
{
    try
    {
        const {
            name,
            phoneNo,
            email,
            gender,
            age,
            joiningDate,
            planDuration,
            feesAmount,
            nextDueDate,
            paymentStatus,
            lastPaidOn,
            address,
        } = req.body;

        const existingMember = await Member.findOne({ phoneNo });
        if (existingMember)
        {
            return res
                .status(409)
                .json({ success: false,message: "Member already exists" });
        }

        const member = await Member.create({
            name,
            phoneNo,
            email,
            gender,
            age,
            joiningDate,
            planDuration,
            feesAmount,
            nextDueDate,
            paymentStatus,
            lastPaidOn,
            address,
        });

        res.status(200).json({
            success: true,
            message: "New member added successfully",
            data: member,
        });
    } catch (error)
    {
        console.error(error);
        res
            .status(500)
            .json({ success: false,message: "Unable to add member, please try again" });
    }
};

exports.editMember = async (req,res) =>
{
    try
    {
        const { phoneNo } = req.params;

        const toUpdateData = req.body;

        const allowedToUpdate = [
            age,
            planDuration,feesAmount,nextDueDate,lastPaidOn,paymentStatus
        ];

        const isAllowed = Object.keys(req.body).every((field) => allowedToUpdate.includes(field));

        if (!isAllowed)
        {
            res.status(500).json({
                success: false,
                message: "Update not allowed"
            })
        };

        const updateMember = await Member.findOneAndUpdate(
            phoneNo,
            toUpdateData,
            { new: true,runValidators: true } // return updated doc & validate
        )

        if (!updateMember)
        {
            return res.status(500).json({
                success: false,
                message: "Member not found with this phone number"
            })
        }

        res.status(200).json({
            success: true,
            message: "Updated Succesfully",
            data: updateMember
        })

    } catch (error)
    {
        console.error(error);
        res
            .status(500)
            .json({ success: false,message: "Unable to add member, please try again" });
    }
}

exports.deleteMember = async (req,res) =>
{
    try
    {
        const { phoneNo } = req.params;


        const deleteUser = await Member.findOneAndDelete({ phoneNo });


        if (!deleteUser)
        {
            return res.status(404).json({
                success: false,
                message: "Member not found!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Deleted Succesfully",
            data: updateMember
        })


    } catch (error)
    {
        console.error(error);
        res
            .status(500)
            .json({ success: false,message: "Unable to add member, please try again" });
    }
}