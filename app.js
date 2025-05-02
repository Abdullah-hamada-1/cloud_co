const express = require("express");
const multer = require("multer");
const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config(); // Load environment variables from .env file

const app = express();
const upload = multer(); // Setup for file upload

// Configure AWS S3 client with v3
const s3 = new S3({
  region: "us-east-1",  // specify the region if necessary
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
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

  const command = new PutObjectCommand(params);

  s3.send(command)
    .then(() => {
      res.render("upload", { message: "✅ تم رفع الملف بنجاح إلى S3!" });
    })
    .catch((err) => {
      console.error("S3 Upload Error:", err);
      const msg = err.code === 'CredentialsError' ? "❌ بيانات الوصول غير متوفرة." : `❌ حدث خطأ: ${err.message}`;
      res.render("upload", { message: msg });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
