require("dotenv").config();
jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
const Owner = require("../models/Owner");

let app;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  app = require("../server");
});

beforeEach(async () => {
  // Clean up test users before each test
  await Owner.deleteMany({ email: "test@gmail.com" });
});

afterAll(async () => {
  // Final cleanup
  await Owner.deleteMany({ email: "test@gmail.com" });
  await mongoose.connection.close();
});

describe("Auth API", () => {
  const testUser = {
    firstName: "Test",
    lastName: "User",
    mobileNumber: "9999999999",
    email: "test@gmail.com",
    password: "123456",
    confirmPassword: "123456"
  };

  describe("POST /api/v1/auth/signup", () => {
    it("should register a new owner", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });

    it("should not register duplicate owner", async () => {
      // First register a user
      await request(app)
        .post("/api/v1/auth/signup")
        .send(testUser);

      // Try to register again with same email
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send(testUser);

      expect(res.statusCode).toBe(409); // Your controller returns 409, not 400
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User already exists");
    });

    it("should not register with invalid data", async () => {
      const invalidUser = {
        firstName: "",
        lastName: "",
        email: "invalid-email",
        password: "123", // Too short
        confirmPassword: "456" // Doesn't match
      };

      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send(invalidUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Register a user before each login test
      await request(app)
        .post("/api/v1/auth/signup")
        .send(testUser);
    });

    it("should login the owner successfully", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.user).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it("should not login with wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword"
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Incorrect password");
    });

    it("should not login non-existent user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@gmail.com",
          password: "123456"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User not registered");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    let authCookie;

    beforeEach(async () => {
      // Register and login to get auth cookie
      await request(app)
        .post("/api/v1/auth/signup")
        .send(testUser);

      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authCookie = loginRes.headers['set-cookie'].find(cookie => 
        cookie.startsWith('token=')
      );
    });

    it("should get current user with valid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", authCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
    });

    it("should not get current user without token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/auth/logout", () => {
    it("should logout successfully", async () => {
      const res = await request(app)
        .get("/api/v1/auth/logout"); // Your route is GET, not POST

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Logged out successfully");
    });
  });
});