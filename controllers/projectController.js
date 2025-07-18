// Path: controllers/projectController.js
const Project = require("../models/Project");
const User = require("../models/User");
const ProjectMember = require("../models/ProjectMember");
const { Op } = require("sequelize"); // Import Op cho các toán tử Sequelize

// Hàm trợ giúp để lấy vai trò của người dùng trong dự án
const getUserRoleInProject = async (userId, projectId) => {
  const projectMember = await ProjectMember.findOne({
    where: { userId, projectId },
  });
  return projectMember ? projectMember.role : null;
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, members } = req.body;
    const userId = req.user.id;

    const newProject = await Project.create({
      name,
      description,
      startDate,
      endDate,
      createdBy: userId,
    });

    // Thêm người tạo làm Project Manager
    await ProjectMember.create({
      userId: userId,
      projectId: newProject.id,
      role: "Project Manager",
    });

    // Thêm các thành viên khác nếu có
    if (members && Array.isArray(members)) {
      for (const member of members) {
        const existingUser = await User.findByPk(member.userId);
        if (existingUser) {
          // Kiểm tra xem thành viên đã tồn tại trong dự án chưa
          const existingMember = await ProjectMember.findOne({
            where: { userId: member.userId, projectId: newProject.id },
          });
          if (!existingMember) {
            await ProjectMember.create({
              userId: member.userId,
              projectId: newProject.id,
              role: member.role || "Member",
            });
          }
        }
      }
    }

    // Lấy lại dự án với thông tin thành viên đầy đủ để trả về
    const projectWithMembers = await Project.findByPk(newProject.id, {
      include: [
        {
          model: ProjectMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "email"],
            },
          ],
        },
        {
          model: User,
          as: "creator", // Đổi alias để tránh xung đột
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.status(201).json(projectWithMembers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};

exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.findAll({
      include: [
        {
          model: ProjectMember,
          as: "members",
          where: { userId: userId }, // Lọc các dự án mà người dùng là thành viên
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "email"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email"],
        },
      ],
    });
    res.json(projects);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: ProjectMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "email"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án." });
    }

    const isMember = project.members.some((member) => member.userId === userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền truy cập dự án này." });
    }

    res.json(project);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;
    const projectId = req.params.id;
    const userId = req.user.id;

    let project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án." });
    }

    const userRole = await getUserRoleInProject(userId, projectId);
    if (userRole !== "Project Manager" && project.createdBy !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền cập nhật dự án này." });
    }

    await project.update({ name, description, startDate, endDate, status });

    // Lấy lại dự án với thông tin thành viên đầy đủ để trả về
    const updatedProject = await Project.findByPk(projectId, {
      include: [
        {
          model: ProjectMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "email"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.json(updatedProject);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    let project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án." });
    }

    const userRole = await getUserRoleInProject(userId, projectId);
    if (userRole !== "Project Manager" && project.createdBy !== userId) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa dự án này." });
    }

    // Xóa tất cả ProjectMembers và Tasks liên quan trước
    await ProjectMember.destroy({ where: { projectId } });
    await Task.destroy({ where: { projectId } });

    await project.destroy();
    res.json({ message: "Dự án đã được xóa." });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};

exports.addProjectMember = async (req, res) => {
  try {
    const { userId: memberId, role } = req.body; // Đổi tên userId thành memberId để tránh nhầm lẫn
    const projectId = req.params.id;
    const currentUserId = req.user.id;

    let project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án." });
    }

    const currentUserRole = await getUserRoleInProject(
      currentUserId,
      projectId
    );
    if (
      currentUserRole !== "Project Manager" &&
      project.createdBy !== currentUserId
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thêm thành viên vào dự án này." });
    }

    const existingMember = await ProjectMember.findOne({
      where: { userId: memberId, projectId: projectId },
    });
    if (existingMember) {
      return res
        .status(400)
        .json({ message: "Người dùng đã là thành viên của dự án." });
    }

    const userToAdd = await User.findByPk(memberId);
    if (!userToAdd) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    await ProjectMember.create({
      userId: memberId,
      projectId: projectId,
      role: role || "Member",
    });

    // Lấy lại dự án với thông tin thành viên đầy đủ để trả về
    const updatedProject = await Project.findByPk(projectId, {
      include: [
        {
          model: ProjectMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "email"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.json(updatedProject);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};

exports.updateProjectMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { projectId, userId: memberId } = req.params; // Đổi tên userId thành memberId
    const currentUserId = req.user.id;

    let project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án." });
    }

    const currentUserRole = await getUserRoleInProject(
      currentUserId,
      projectId
    );
    if (
      currentUserRole !== "Project Manager" &&
      project.createdBy !== currentUserId
    ) {
      return res.status(403).json({
        message:
          "Bạn không có quyền cập nhật vai trò thành viên trong dự án này.",
      });
    }

    const projectMember = await ProjectMember.findOne({
      where: { userId: memberId, projectId },
    });

    if (!projectMember) {
      return res
        .status(404)
        .json({ message: "Thành viên không tìm thấy trong dự án." });
    }

    await projectMember.update({ role });

    // Lấy lại dự án với thông tin thành viên đầy đủ để trả về
    const updatedProject = await Project.findByPk(projectId, {
      include: [
        {
          model: ProjectMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "email"],
            },
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.json(updatedProject);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};

exports.removeProjectMember = async (req, res) => {
  try {
    const { projectId, userId: memberId } = req.params; // Đổi tên userId thành memberId
    const currentUserId = req.user.id;

    let project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: "Không tìm thấy dự án." });
    }

    const currentUserRole = await getUserRoleInProject(
      currentUserId,
      projectId
    );
    if (
      currentUserRole !== "Project Manager" &&
      project.createdBy !== currentUserId
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa thành viên khỏi dự án này." });
    }

    const projectMember = await ProjectMember.findOne({
      where: { userId: memberId, projectId },
    });

    if (!projectMember) {
      return res
        .status(404)
        .json({ message: "Thành viên không tìm thấy trong dự án." });
    }

    // Không cho phép xóa chính mình nếu là người tạo hoặc Project Manager duy nhất
    if (
      project.createdBy === memberId &&
      currentUserRole === "Project Manager"
    ) {
      const otherPMs = await ProjectMember.count({
        where: {
          projectId: projectId,
          role: "Project Manager",
          userId: { [Op.ne]: memberId }, // Không tính chính người này
        },
      });
      if (otherPMs === 0) {
        return res.status(400).json({
          message: "Không thể xóa Project Manager duy nhất của dự án.",
        });
      }
    }

    await projectMember.destroy();
    res.json({ message: "Thành viên đã được xóa khỏi dự án." });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Lỗi Server.");
  }
};
