const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const upload = multer();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("upload", { message: "" });
});

app.post("/", upload.single("file"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.render("upload", { message: "❌ لم يتم اختيار أي ملف." });
  }

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: file.originalname,
    Body: file.buffer
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("S3 Upload Error:", err);
      const msg = err.code === 'CredentialsError' ? "❌ بيانات الوصول غير متوفرة." : `❌ حدث خطأ: ${err.message}`;
      return res.render("upload", { message: msg });
    }
    res.render("upload", { message: "✅ تم رفع الملف بنجاح إلى S3!" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
