// Path: routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const auth = require("../middleware/authMiddleware");

router.post("/:projectId", auth, taskController.createTask);
router.get("/:projectId", auth, taskController.getTasksByProject);
router.get("/detail/:id", auth, taskController.getTaskById);
router.put("/:id", auth, taskController.updateTask);
router.delete("/:id", auth, taskController.deleteTask);

module.exports = router;
