// Path: server.js
// Đây là tệp chính để khởi động ứng dụng Node.js backend của bạn.

// Import các thư viện cần thiết
const express = require("express"); // Framework web Express.js
const dotenv = require("dotenv"); // Để quản lý biến môi trường
const cors = require("cors"); // Middleware để xử lý Cross-Origin Resource Sharing
const { sequelize } = require("./config/database"); // Import instance Sequelize và hàm kết nối
const User = require("./models/User"); // Import các models
const Project = require("./models/Project");
const Task = require("./models/Task");
const ProjectMember = require("./models/ProjectMember"); // Model cho bảng trung gian
const swaggerUi = require("swagger-ui-express"); // Thêm swagger-ui-express
const swaggerDocument = require("./docs/openapiSpec.json"); // Thêm file OpenAPI Spec

// Tải các biến môi trường từ tệp .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Middleware
// Sử dụng cors để cho phép các yêu cầu từ frontend (Vue.js)
app.use(cors());
// Sử dụng express.json() để phân tích cú pháp các yêu cầu JSON gửi đến server
app.use(express.json());

// Định nghĩa mối quan hệ giữa các models
// User và ProjectMember (một người dùng có thể có nhiều vai trò trong các dự án khác nhau)
User.hasMany(ProjectMember, { foreignKey: "userId", as: "projectRoles" });
ProjectMember.belongsTo(User, { foreignKey: "userId", as: "user" });

// Project và ProjectMember (một dự án có nhiều thành viên)
Project.hasMany(ProjectMember, { foreignKey: "projectId", as: "members" });
ProjectMember.belongsTo(Project, { foreignKey: "projectId", as: "project" });

// Project và Task (một dự án có nhiều task)
Project.hasMany(Task, { foreignKey: "projectId", as: "tasks" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });

// User và Task (người giao việc và người được giao việc)
User.hasMany(Task, { foreignKey: "assignedBy", as: "assignedTasks" });
Task.belongsTo(User, { foreignKey: "assignedBy", as: "assigner" });

// Thêm mối quan hệ giữa User và Project cho createdBy
User.hasMany(Project, { foreignKey: "createdBy", as: "createdProjects" });
Project.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

User.hasMany(Task, { foreignKey: "assignedTo", as: "tasksAssignedToMe" });
Task.belongsTo(User, { foreignKey: "assignedTo", as: "assignee" });

// Kết nối đến cơ sở dữ liệu PostgreSQL và đồng bộ hóa models
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Kết nối PostgreSQL thành công!");

    // Đồng bộ hóa tất cả các model. `alter: true` sẽ cố gắng thay đổi bảng hiện có
    // để khớp với model mà không xóa dữ liệu. Trong môi trường production,
    // bạn nên sử dụng migration tools.
    await sequelize.sync({ alter: true });
    console.log("Đồng bộ hóa models thành công!");
  } catch (error) {
    console.error("Lỗi kết nối hoặc đồng bộ hóa PostgreSQL:", error);
    process.exit(1); // Thoát ứng dụng nếu không thể kết nối DB
  }
}

connectDB();

// Định nghĩa các Routes
// Chúng ta sẽ tổ chức các route thành các tệp riêng biệt để dễ quản lý.

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

// Phục vụ Swagger UI tại /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route mặc định cho kiểm tra server
app.get("/", (req, res) => {
  res.send("Chào mừng đến với Backend Hệ thống Quản lý Dự án!");
});

// Cổng mà server sẽ lắng nghe
const PORT = process.env.PORT || 5000;

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
