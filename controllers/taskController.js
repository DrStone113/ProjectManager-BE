// Path: controllers/taskController.js
const Task = require("../models/Task");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");

// Hàm trợ giúp để lấy vai trò của người dùng trong dự án
const getUserRoleInProject = async (userId, projectId) => {
  const projectMember = await ProjectMember.findOne({
    where: { userId, projectId },
  });
  return projectMember ? projectMember.role : null;
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, status, priority } =
      req.body;
    const projectId = req.params.projectId;
    const assignedBy = req.user.id;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", data: { message: "Không tìm thấy dự án." } });
    }

    const isMember = await ProjectMember.findOne({
      where: { userId: assignedBy, projectId },
    });
    if (!isMember) {
      return res.status(403).json({
        status: "fail",
        data: { message: "Bạn không phải là thành viên của dự án này." },
      });
    }

    const assignedByRole = await getUserRoleInProject(assignedBy, projectId);
    if (!["Project Manager", "Team Lead"].includes(assignedByRole)) {
      return res.status(403).json({
        status: "fail",
        data: { message: "Bạn không có quyền giao việc trong dự án này." },
      });
    }

    if (assignedTo) {
      const assignedToMember = await ProjectMember.findOne({
        where: { userId: assignedTo, projectId },
      });
      if (!assignedToMember) {
        return res.status(400).json({
          status: "fail",
          data: {
            message:
              "Người được giao việc không phải là thành viên của dự án này.",
          },
        });
      }
    }

    const newTask = await Task.create({
      title,
      description,
      projectId,
      assignedTo,
      assignedBy,
      dueDate,
      status,
      priority,
    });

    res.status(201).json({ status: "success", data: { task: newTask } });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi Server.", code: 500 });
  }
};

exports.getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ status: "fail", data: { message: "Không tìm thấy dự án." } });
    }

    const isMember = await ProjectMember.findOne({
      where: { userId, projectId },
    });
    if (!isMember) {
      return res.status(403).json({
        status: "fail",
        data: {
          message: "Bạn không có quyền truy cập các task của dự án này.",
        },
      });
    }

    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "username", "email"],
        },
      ],
    });
    res.json({ status: "success", data: { tasks: tasks } });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi Server.", code: 500 });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = await Task.findByPk(taskId, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (!task) {
      return res
        .status(404)
        .json({ status: "fail", data: { message: "Không tìm thấy task." } });
    }

    const isMember = await ProjectMember.findOne({
      where: { userId, projectId: task.projectId },
    });
    if (!isMember) {
      return res.status(403).json({
        status: "fail",
        data: { message: "Bạn không có quyền truy cập task này." },
      });
    }

    res.json({ status: "success", data: { task: task } });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi Server.", code: 500 });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, status, priority } =
      req.body;
    const taskId = req.params.id;
    const userId = req.user.id;

    let task = await Task.findByPk(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ status: "fail", data: { message: "Không tìm thấy task." } });
    }

    const currentUserRole = await getUserRoleInProject(userId, task.projectId);

    if (currentUserRole === "Member" && task.assignedTo !== userId) {
      return res.status(403).json({
        status: "fail",
        data: { message: "Bạn không có quyền cập nhật task này." },
      });
    }
    if (currentUserRole === "Member" && task.assignedTo === userId) {
      // Nếu là thành viên và task được giao cho họ, chỉ cho phép cập nhật trạng thái
      if (Object.keys(req.body).some((key) => !["status"].includes(key))) {
        return res.status(403).json({
          status: "fail",
          data: {
            message: "Bạn chỉ có thể cập nhật trạng thái của task này.",
          },
        });
      }
    }

    if (assignedTo && assignedTo !== task.assignedTo) {
      const assignedToMember = await ProjectMember.findOne({
        where: { userId: assignedTo, projectId: task.projectId },
      });
      if (!assignedToMember) {
        return res.status(400).json({
          status: "fail",
          data: {
            message:
              "Người được giao việc mới không phải là thành viên của dự án này.",
          },
        });
      }
    }

    await task.update({
      title,
      description,
      assignedTo,
      dueDate,
      status,
      priority,
    });

    // Lấy lại task với thông tin đầy đủ để trả về
    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "email"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    res.json({ status: "success", data: { task: updatedTask } });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi Server.", code: 500 });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    let task = await Task.findByPk(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ status: "fail", data: { message: "Không tìm thấy task." } });
    }

    const currentUserRole = await getUserRoleInProject(userId, task.projectId);
    if (!["Project Manager", "Team Lead"].includes(currentUserRole)) {
      return res.status(403).json({
        status: "fail",
        data: { message: "Bạn không có quyền xóa task này." },
      });
    }

    await task.destroy();
    res.json({ status: "success", data: null, message: "Task đã được xóa." });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ status: "error", message: "Lỗi Server.", code: 500 });
  }
};
