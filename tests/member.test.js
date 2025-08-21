require("dotenv").config();
jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
let app;

let token; // JWT token for owner
let testMemberPhone = "6239038301";

beforeAll(async () => {
  // MongoDB connect
  await mongoose.connect(process.env.MONGODB_URL);

  // Express server import
  app = require("../server");

  // Login as owner to get token
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "dhruvmishra1234@gmail.com",
      password:"123456", 
    });

  token = loginRes.body.token;
});

afterAll(async () => {
  // Cleanup: delete test member if exists
  await request(app)
    .delete(`/api/v1/member/deletemember/${testMemberPhone}`)
    .set("Authorization", `Bearer ${token}`);

  await mongoose.connection.close();
});

describe("Member API", () => {

  it("should add new member", async () => {
    const res = await request(app)
      .post("/api/v1/member/addmember")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Govind Singh",
        phoneNo: testMemberPhone,
        age: 21,
        gender: "Male",
        email: "govindsingh988877@gmail.com",
        planDuration: "1 month",
        address: "#709 ShastriNagar sector-13",
        feesAmount: 500,
        nextDueDate: "2025-09-20",
      });

    console.log("Add Member Response:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should edit member's feesAmount and nextDueDate", async () => {
    const res = await request(app)
      .patch(`/api/v1/member/editmember/${testMemberPhone}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        feesAmount: 600,
        nextDueDate: "2025-10-20",
      });

    console.log("Edit Member Response:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.feesAmount).toBe(600);
    expect(res.body.data.nextDueDate).toBe("2025-10-20T00:00:00.000Z"); // MongoDB date format
  });

  it("should delete member", async () => {
    const res = await request(app)
      .delete(`/api/v1/member/deletemember/${testMemberPhone}`)
      .set("Authorization", `Bearer ${token}`);

    console.log("Delete Member Response:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});
