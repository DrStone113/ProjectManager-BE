// Path: models/ProjectMember.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ProjectMember = sequelize.define(
  "ProjectMember",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Projects",
        key: "id",
      },
    },
    role: {
      type: DataTypes.ENUM("Project Manager", "Team Lead", "Member"),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      // Đảm bảo mỗi người dùng chỉ có một vai trò duy nhất trong một dự án
      {
        unique: true,
        fields: ["userId", "projectId"],
      },
    ],
  }
);

module.exports = ProjectMember;
