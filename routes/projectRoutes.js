// Path: routes/projectRoutes.js
const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
// Import trực tiếp hàm middleware (không destructuring)
const auth = require("../middleware/authMiddleware");

// --- DEBUG LOGS START ---
console.log("DEBUG: Loading routes/projectRoutes.js");
console.log("DEBUG: Type of auth (after direct import):", typeof auth); // Kiểm tra lại type sau khi import trực tiếp
console.log("DEBUG: Type of projectController:", typeof projectController);
console.log(
  "DEBUG: Type of projectController.createProject:",
  typeof projectController.createProject
);
// --- DEBUG LOGS END ---

router.post("/", auth, projectController.createProject);
router.get("/", auth, projectController.getProjects);
router.get("/:id", auth, projectController.getProjectById);
router.put("/:id", auth, projectController.updateProject);
router.delete("/:id", auth, projectController.deleteProject);
router.post("/:id/members", auth, projectController.addProjectMember);
router.put(
  "/:projectId/members/:userId",
  auth,
  projectController.updateProjectMemberRole
);
router.delete(
  "/:projectId/members/:userId",
  auth,
  projectController.removeProjectMember
);

module.exports = router;
