// Path: config/database.js
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

// Sử dụng DATABASE_URL để kết nối
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false, // Tắt log SQL queries
  dialectOptions: {
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            require: true,
            rejectUnauthorized: false, // Chỉ nên dùng false cho dev/test, production cần cert
          }
        : false,
  },
});

module.exports = { sequelize };
