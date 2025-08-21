// tests/auth.test.js
require("dotenv").config();
jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");

let app;
// const randomEmail = `owner+${Date.now()}@test.com`;

beforeAll(async () => {
  // connect to your real DB
  await mongoose.connect(process.env.MONGODB_URL);
  // load express app AFTER db connection is ready
  app = require("../server");
});

afterAll(async () => {
  // close db connection
  await mongoose.connection.close();
});

describe("Auth API", () => {
  it("should register a new owner", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        firstName: "Test",
        lastName: "User",
        mobileNumber: "9999999999",
        email:"dhruvmishra1234@gmail.com",
        password: "123456",
        confirmPassword: "123456",
         role: "owner"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should login the owner", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "test@gmail.com",
        password: "123456",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
