const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please provide a firstName"],
      minlength: [3, "Please provide a firstName at least 3 characters"],
      maxlength: [15, "Please provide a firstName with maximum 15 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please provide a lastName"],
      minlength: [3, "Please provide a lastName at least 3 characters"],
      maxlength: [15, "Please provide a lastName with maximum 15 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide a email"],
      match: [
        /^\w+([.-]?\w+)@\w+([.-]?\w+)(.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Please provide a password at least 6 characters"],
      select: false,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "seller"],
    },
    seller: {
      company: {
        type: String,
        maxlength: [30, "Please provide a company with maximum 30 characters"],
      },
      about: {
        type: String,
      },
      products: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
      ],
    },
    favProducts: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    orders: [
      {
        productId: String,
        name: String,
        price: Number,
        img: String,
        unit: Number,
        seller: Object,
        createdAt: Date,
        star: Number,
        comment: String,
      },
    ],
    phoneNumber: {
      type: Number,
    },
    addresses: [
      {
        title: {
          type: String,
        },
        neighborhood: {
          type: String,
        },
        district: {
          type: String,
        },
        city: {
          type: String,
        },
        street: {
          type: String,
        },
        buildingNumber: {
          type: String,
        },
        apartmentNumber: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.methods.generateJwtFromUser = function () {
  const { JWT_SECRET_KEY, JWT_EXPIRE } = process.env;
  const payload = {
    id: this._id,
  };

  const token = jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: JWT_EXPIRE,
  });
  return token;
};

UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const saltRounds = 10;
  const myPlaintextPassword = this.password;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    bcrypt.hash(myPlaintextPassword, salt, (err, hash) => {
      if (err) next(err);
      this.password = hash;
      next();
    });
  });
});

module.exports = mongoose.model("User", UserSchema);
