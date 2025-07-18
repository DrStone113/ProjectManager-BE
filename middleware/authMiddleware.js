// Path: middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// Xuất trực tiếp hàm middleware
module.exports = function (req, res, next) {
  // Lấy token từ header 'Authorization'
  const authHeader = req.header("Authorization");

  // Kiểm tra nếu không có header hoặc không phải là Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        message:
          "Không có token hoặc định dạng token sai, ủy quyền bị từ chối.",
      });
  }

  // Xác thực token
  try {
    // Lấy token bằng cách loại bỏ 'Bearer '
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token không hợp lệ." });
  }
};
