const express = require("express");
const { body,validationResult } = require("express-validator");
const { addMember,editMember,deleteMember } = require("../controllers/memberController");
const router = express.Router();

router.post(
    "/addmember",
    [
        body("name").notEmpty(),
        body("phoneNo").notEmpty(),
        body("feesAmount").notEmpty(),
        body("nextDueDate").notEmpty(),
        body("address").notEmpty(),
    ],
    (req,res,next) =>
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            return res.status(400).json({ success: false,errors: errors.array() });
        }
        next();
    },
    addMember
);

router.patch("/editmember/:phoneNo",[
    body("feesAmount").notEmpty(),
    body("nextDueDate").notEmpty(),
],(req,res,next) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.status(400).json({ success: false,errors: errors.array() });
    }

    next();
},editMember);

router.delete("/deletemember/phoneNo",deleteMember)

module.exports = router;
