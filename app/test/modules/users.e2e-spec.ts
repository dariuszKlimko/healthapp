import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "@app/app.module";
import loadFixtures, { FixtureFactory } from "@test/loadFixtures";
import { Repository } from "typeorm";
import { User } from "@app/modules/user/entities/user.entity";
import { CreateUserDto } from "@app/modules/user/dto/create-user.dto";

describe("Users (e2e)", () => {
  let app: INestApplication;
  let fixtures: FixtureFactory;
  let userRepository: Repository<User>
  let accessToken: string;

  beforeAll(async () => {
    fixtures = await loadFixtures();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userRepository = moduleFixture.get("UserRepository");

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    accessToken = await request.default(app.getHttpServer())
    .post("/auth")
    .send({email: "user1@email.com", password: "QWERTqwert1!"})
    .then((res) => res.body.accessToken );
  });

  describe("/users (POST) - register user", () => {
    it("should register user in database", async() => {
      const user: CreateUserDto = { email: "test1@email.com", password: "Qwert12345!"};
      await request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.CREATED);
        expect(res.body.email).toEqual(user.email);
      })
      return userRepository.findOneBy({email: user.email}).then((userDb) => {
        expect(userDb).toBeDefined();
        expect(userDb.email).toEqual(user.email);
      })
    });

    it("should not register user which exist in database", () => {
      const user: CreateUserDto = { email: "user1@email.com", password: "QWERTqwert1!"};
      return request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.CONFLICT);
      })
    });

    it("should not register user with password shorter than 8 characters", () => {
      const user: CreateUserDto = { email: "test2@email.com", password: "Qw1hb!"};
      return request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      })
    });

    it("should not register user with password longer than 24 characters", () => {
      const user: CreateUserDto = { email: "test2@email.com", password: "Qwertoklk1234rfSdCSAWmjhb!"};
      return request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      })
    });

    it("should not register user with password without number", () => {
      const user: CreateUserDto = { email: "test2@email.com", password: "Qwertoklkmjhb!"};
      return request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      })
    });

    it("should not register user with password without special character", () => {
      const user: CreateUserDto = { email: "test2@email.com", password: "Qwert12345"};
      return request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      })
    });

    it("should not register user with password without capital letter", () => {
      const user: CreateUserDto = { email: "test2@email.com", password: "qwert12345!"};
      return request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      })
    });

    it("should not register user with password without small letter", () => {
      const user: CreateUserDto = { email: "test2@email.com", password: "QWERT12345!"};
      return request.default(app.getHttpServer())
      .post("/users")
      .send(user)
      .then((res) => {
        expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      })
    });

  });

  describe("/users (GET) - get user's data", () => {
    it("should return for valid accessToken", () => {
      return request
        .default(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .then((res) => {
          expect(res.status).toEqual(HttpStatus.OK);
          expect(res.body.id).toEqual(fixtures.get("user1").id);
          expect(res.body.email).toEqual("user1@email.com");
        });
    });

    it("should not returne for invalid accessToken", () => {
      return request
        .default(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer someToken`)
        .then((res) => {
          expect(res.status).toEqual(HttpStatus.UNAUTHORIZED);
        });
    });
  });

  describe("/users (PATCH) - update user's data", () => {
    it("should update user in database for given accessToken", () => {});
    it("should not update user in database for given accessToken", () => {})
  });

  describe("/users (DELETE) - delete user's account", () => {
    it("should delete user account for given accessToken", () => {});
    it("should not delete user account for given accessToken", () => {});
  });
});
