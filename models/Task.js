// Path: models/Task.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    projectId: {
      // Task thuộc về dự án nào (Foreign Key to Project)
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Projects",
        key: "id",
      },
    },
    assignedTo: {
      // Người được giao việc (Foreign Key to User)
      type: DataTypes.UUID,
      allowNull: true, // Có thể không được giao cho ai
      references: {
        model: "Users",
        key: "id",
      },
    },
    assignedBy: {
      // Người giao việc (Foreign Key to User)
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    dueDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM("To Do", "In Progress", "Done", "Blocked"),
      defaultValue: "To Do",
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High", "Urgent"),
      defaultValue: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Task;
