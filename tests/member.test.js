require("dotenv").config();
jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");

beforeAll(async () =>
{
    await mongoose.connect(process.env.MONGODB_URL);

    app = require("../server");
})

afterAll(async () =>
{
    await mongoose.connection.close();
})

describe("Member API",() =>
{
    it("should add new member",async () =>
    {
        const res = await request(app)
            .post("/api/v1/member/addmember")
            .send({
                name: "Govind Singh",
                phoneNo: "6239038301",
                age: 21,
                gender: "Male",
                email: "govindsingh988877@gmail.com",
                planDuration: "1 month",
                address: "#709 ShastriNagar sector-13",
                feesAmount: 500,
            })
        console.log(res.body);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

    })
})