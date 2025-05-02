const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const upload = multer(); // Initialize multer (in-memory storage)

const s3 = new S3Client({
  region: "us-east-1", // Ensure to use the correct AWS region
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

app.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.render("upload", { message: "❌ لم يتم اختيار أي ملف." });
  }

  const params = {
    Bucket: process.env.BUCKET_NAME, // Ensure this environment variable is set
    Key: file.originalname, // Use the original filename from the uploaded file
    Body: file.buffer // The file content (in memory buffer)
  };

  try {
    const data = await s3.send(new PutObjectCommand(params)); // Upload the file to S3
    console.log(data);
    res.render("upload", { message: "✅ تم رفع الملف بنجاح إلى S3!" });
  } catch (err) {
    console.error("S3 Upload Error:", err);
    const msg = err.code === 'CredentialsError' ? "❌ بيانات الوصول غير متوفرة." : `❌ حدث خطأ: ${err.message}`;
    return res.render("upload", { message: msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(80, '0.0.0.0', () => {
  console.log('Server is running on http://0.0.0.0:80');
});
