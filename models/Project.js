// Path: models/Project.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    startDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    endDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM("Planning", "Active", "Completed", "Archived"),
      defaultValue: "Active",
    },
    createdBy: {
      // Người tạo dự án (Foreign Key to User)
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users", // Tên bảng của User model
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Project;
