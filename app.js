const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"); // Import v3 SDK
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const upload = multer();

// Initialize the AWS S3 client with v3 SDK
const s3 = new S3Client({
  region: "us-east-1",  // specify your region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));
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
    Bucket: process.env.BUCKET_NAME,
    Key: file.originalname,
    Body: file.buffer
  };

  try {
    const data = await s3.send(new PutObjectCommand(params)); // Use the PutObjectCommand for uploading
    console.log(data);
    res.render("upload", { message: "✅ تم رفع الملف بنجاح إلى S3!" });
  } catch (err) {
    console.error("S3 Upload Error:", err);
    const msg = err.code === 'CredentialsError' ? "❌ بيانات الوصول غير متوفرة." : `❌ حدث خطأ: ${err.message}`;
    return res.render("upload", { message: msg });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
